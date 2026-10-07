import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useAppointmentLookup, useBookAppointment, useClinicDoctors, useClinicProfile, useClinicQr } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { useForm } from "@/hooks/use-form";
import { AppointmentsTable } from "@/pages/stubs";
import { rupee } from "@/pages/Billing";
import { todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Field, TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import type { Appointment, Gender } from "@/types";

const today = todayKey;

/** What the MID box holds: a 14-digit MID, a valid phone number, or neither yet. */
function classify(raw: string): { kind: "mid" | "phone"; value: string } | null {
  const s = raw.trim();
  const d = s.replace(/\D/g, "");
  if (s.startsWith("+")) return d.length >= 8 && d.length <= 15 ? { kind: "phone", value: `+${d}` } : null;
  if (d.length === 14) return { kind: "mid", value: d };
  let n = d.replace(/^0+/, "");
  if (n.length === 12 && n.startsWith("91")) n = n.slice(2);
  return /^[6-9]\d{9}$/.test(n) ? { kind: "phone", value: n } : null;
}

/** Radio pair styled as two buttons. */
function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <Field label={label}>
      <div role="radiogroup" aria-label={label} className="flex gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={cn(
              "flex flex-1 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              value === o ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50"
            )}
          >
            <input type="radio" name={label} value={o} checked={value === o} onChange={() => onChange(o)} className="accent-primary" />
            {o}
          </label>
        ))}
      </div>
    </Field>
  );
}

const EMPTY = {
  doctorId: "",
  id: "",
  name: "",
  phone: "",
  gender: "",
  date: today(),
  time: "10:00",
  reason: "",
  fee: "",
  mode: "UPI" as "UPI" | "Cash",
  paid: "Paid" as "Paid" | "Unpaid",
};

type Booked = Appointment & { payment?: { amount: number; mode: string; paid: boolean } };

/**
 * Today's queue for the active clinic, or the doctor's own practice. Any pro
 * doctor books for themselves; the clinic's owner and the front desk book for
 * any doctor at the clinic. A member doctor sees only their own queue.
 */
export function Appointments() {
  const { user, activeClinicId } = useAuth();
  const clinic = user?.clinics.find((c) => c.id === activeClinicId);
  const isDesk = user?.role === "receptionist";
  const canBook = isDesk ? !!activeClinicId : !!user?.plan?.isPro;
  const pickDoctor = !!activeClinicId && (isDesk || clinic?.role === "owner");
  const { data: doctors } = useClinicDoctors(pickDoctor);
  // The clinic's payment QR, beside the form so the patient can pay while it is filled in.
  const { data: profile } = useClinicProfile(canBook && !!activeClinicId);
  const qr = useClinicQr(activeClinicId, !!profile?.qrUrl);
  const book = useBookAppointment();
  const [open, setOpen] = useState(false);
  const [booked, setBooked] = useState<Booked | null>(null);
  const { f, setF, setForm, seed } = useForm(EMPTY);

  const accepted = pickDoctor ? (doctors?.doctors ?? []).filter((d) => d.active) : [];

  // Autofill from a chart this clinic already has, keyed by phone or MID.
  const key = classify(f.id);
  const lookup = useAppointmentLookup(open && key ? key.value : null);
  const hit = key && lookup.data ? lookup.data.patient : null;
  useEffect(() => {
    if (!key || !lookup.data) return;
    const p = lookup.data.patient;
    if (p) setForm((prev) => ({ ...prev, name: p.name, phone: p.phone || (key.kind === "phone" ? key.value : prev.phone), gender: p.gender ?? "" }));
    else if (key.kind === "phone") setForm((prev) => ({ ...prev, phone: key.value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key?.value, lookup.data]);

  // Booked by MID when one was typed or the found chart is linked to one.
  const mid = key?.kind === "mid" ? key.value : (hit?.mid ?? undefined);
  const detailsFromMediBank = !!mid && !hit;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.id.trim() && !key) return toast.error("Enter a valid 14-digit MID or phone number.");
    if (!mid && !f.name.trim()) return toast.error("Enter the patient's name.");
    const fee = f.fee.trim() ? Number(f.fee) : 0;
    if (f.fee.trim() && !(fee > 0)) return toast.error("Consultation fee must be a positive amount.");
    // No doctor picked = the caller themselves (the owner, for a desk).
    const doctorId = accepted.find((d) => d.name === f.doctorId)?.id;
    const payment = fee > 0 ? { amount: fee, mode: f.mode, paid: f.paid === "Paid" } : undefined;
    try {
      const appt = await book.mutateAsync({
        doctorId,
        mid,
        chartId: mid ? undefined : hit?.chartId,
        patient: mid ? undefined : { name: f.name.trim(), phone: f.phone.trim() || undefined, gender: (f.gender || undefined) as Gender | undefined },
        date: `${f.date}T${f.time}:00`,
        reason: f.reason.trim() || undefined,
        payment,
      });
      seed({ ...EMPTY, date: today() });
      setBooked({ ...appt, payment });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not book.");
    }
  }

  if (isDesk && !activeClinicId) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Appointments</h2>
        <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          Appointments belong to a clinic. Select one from the top bar.
        </div>
      </div>
    );
  }

  const showQr = !!activeClinicId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Today's appointments{clinic ? ` at ${clinic.name}` : ""}</h2>
        {canBook && (
          <Button onClick={() => setOpen(true)}>
            <Plus /> Book
          </Button>
        )}
      </div>
      <AppointmentsTable />

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setBooked(null);
        }}
      >
        <DialogContent className={cn("max-h-[92dvh] overflow-y-auto", showQr && !booked && "sm:max-w-3xl")}>
          {booked ? (
            <>
              <DialogHeader>
                <DialogTitle>Appointment booked</DialogTitle>
              </DialogHeader>
              <p className="text-sm">
                <span className="font-medium">{booked.patientName}</span>
                {booked.tokenNumber ? `, token ${booked.tokenNumber}` : ""}, {format(new Date(booked.time), "d MMM, h:mm a")}
              </p>
              {booked.payment && (
                <p className="text-sm text-muted-foreground">
                  Consultation fee {rupee(booked.payment.amount)} by {booked.payment.mode}, {booked.payment.paid ? "paid" : "unpaid"}.
                </p>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Done</Button>
                </DialogClose>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Book an appointment</DialogTitle>
              </DialogHeader>
              <div className={cn("grid gap-6", showQr && "sm:grid-cols-[1fr_220px]")}>
                <form id="book-form" onSubmit={save} className="flex flex-col gap-3">
                  <div className="relative">
                    <TextField
                      label="MediBank ID or phone"
                      hint={
                        !f.id.trim()
                          ? "A returning patient's details fill in by themselves."
                          : !key
                            ? "Enter a 14-digit MID or a valid phone number."
                            : lookup.isFetching
                              ? "Looking up..."
                              : hit
                                ? "Returning patient, details filled in."
                                : detailsFromMediBank
                                  ? "Details come from their MediBank record."
                                  : "New patient, enter their details."
                      }
                      value={f.id}
                      onChange={(e) => setF("id", e.target.value)}
                      placeholder="14-digit MID or mobile number"
                      inputMode="tel"
                      autoFocus
                    />
                    {lookup.isFetching && <Loader2 className="absolute right-3 top-[34px] size-4 animate-spin text-muted-foreground" />}
                  </div>
                  {!detailsFromMediBank && (
                    <>
                      <TextField label="Patient name" value={f.name} onChange={(e) => setF("name", e.target.value)} readOnly={!!mid} />
                      <div className="grid grid-cols-2 gap-3">
                        <TextField label="Phone" value={f.phone} onChange={(e) => setF("phone", e.target.value)} readOnly={!!mid} inputMode="tel" />
                        <SelectField label="Sex at birth" value={f.gender} onValueChange={(v) => setF("gender", v)} options={["Male", "Female", "Other"]} placeholder="Select" />
                      </div>
                    </>
                  )}
                  {accepted.length > 0 && (
                    <SelectField
                      label="Assign doctor (optional)"
                      value={f.doctorId}
                      onValueChange={(v) => setF("doctorId", v)}
                      options={accepted.map((d) => d.name)}
                      placeholder={isDesk ? "Clinic's doctor" : "Me"}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Date" type="date" value={f.date} onChange={(e) => setF("date", e.target.value)} />
                    <TextField label="Time" type="time" value={f.time} onChange={(e) => setF("time", e.target.value)} />
                  </div>
                  <TextField label="Chief complaint" value={f.reason} onChange={(e) => setF("reason", e.target.value)} placeholder="Fever, follow-up..." />
                  <TextField
                    label="Consultation fee (₹, optional)"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={f.fee}
                    onChange={(e) => setF("fee", e.target.value)}
                    placeholder="Eg. 500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Choice label="Payment mode" value={f.mode} options={["UPI", "Cash"] as const} onChange={(v) => setF("mode", v)} />
                    <Choice label="Payment status" value={f.paid} options={["Paid", "Unpaid"] as const} onChange={(v) => setF("paid", v)} />
                  </div>
                </form>

                {showQr && (
                  <aside className="flex flex-col items-center gap-2 self-start rounded-lg border bg-muted/30 p-4 text-center">
                    {qr || profile?.upiId ? (
                      <>
                        {qr && <img src={qr} alt="Clinic payment QR" className="size-44 rounded-md bg-white object-contain" />}
                        <p className="text-[13px] text-muted-foreground">
                          Scan to pay {clinic?.name ?? "the clinic"}
                          {profile?.upiId && <span className="block font-medium text-foreground">UPI ID: {profile.upiId}</span>}
                        </p>
                      </>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">This clinic has no payment QR yet. The doctor who owns it can add one in Clinic's Profile.</p>
                    )}
                  </aside>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" form="book-form" disabled={book.isPending}>{book.isPending ? "Booking..." : "Book"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
