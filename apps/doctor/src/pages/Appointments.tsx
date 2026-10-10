import { useState } from "react";
import { format } from "date-fns";
import { Plus, Loader2, Search } from "lucide-react";
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
import type { Appointment, AppointmentLookup, DiagnosisVitals, Gender } from "@/types";

import { VITAL_FIELDS } from "@/lib/diagnosis";

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
  reference: "",
  vitals: {} as DiagnosisVitals,
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

  const key = classify(f.id);
  const [searchKey, setSearchKey] = useState<string | null>(null);
  const [hit, setHit] = useState<AppointmentLookup | null>(null);
  const lookup = useAppointmentLookup(open ? searchKey : null);
  const candidates = [lookup.data?.patient, ...(lookup.data?.family ?? [])].filter((p): p is AppointmentLookup => !!p);
  const people = candidates.filter((p, i) => candidates.findIndex((x) => (x.mid || x.chartId) === (p.mid || p.chartId)) === i);
  function searchPatient() {
    if (!key) return toast.error("Enter a valid 14-digit MID or phone number.");
    setHit(null);
    setSearchKey(key.value);
    if (searchKey === key.value) void lookup.refetch();
  }
  function selectPatient(p: AppointmentLookup) {
    setHit(p);
    setForm((prev) => ({ ...prev, name: p.name, phone: p.phone || "", gender: p.gender ?? "" }));
  }
  const mid = hit?.mid ?? undefined;
  const detailsFromMediBank = false;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.id.trim() && !key) return toast.error("Enter a valid 14-digit MID or phone number.");
    if (lookup.isFetching) return toast.error("Wait for the patient search to finish.");
    if (people.length && !hit) return toast.error("Select the patient this appointment is for.");
    if (!mid && !f.name.trim()) return toast.error("Enter the patient's name.");
    const fee = f.fee.trim() ? Number(f.fee) : 0;
    if (f.fee.trim() && !(fee > 0)) return toast.error("Consultation fee must be a positive amount.");
    // No doctor picked = the caller themselves (the owner, for a desk).
    const doctorId = accepted.find((d) => d.name === f.doctorId)?.id;
    const payment = fee > 0 ? { amount: fee, mode: f.mode, paid: f.paid === "Paid", reference: f.mode === "UPI" ? f.reference.trim() || undefined : undefined } : undefined;
    try {
      const appt = await book.mutateAsync({
        doctorId,
        mid,
        chartId: mid ? undefined : hit?.chartId,
        patient: mid ? undefined : { name: f.name.trim(), phone: f.phone.trim() || undefined, gender: (f.gender || undefined) as Gender | undefined },
        date: `${f.date}T${f.time}:00`,
        reason: f.reason.trim() || undefined,
        payment,
        vitals: f.vitals,
      });
      seed({ ...EMPTY, date: today() });
      setHit(null);
      setSearchKey(null);
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
            <Plus /> Book Appointment
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
        <DialogContent className="left-auto right-0 top-0 flex h-dvh max-h-dvh w-full max-w-xl translate-x-0 translate-y-0 flex-col rounded-none overflow-y-auto data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
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
              <div className="flex flex-col gap-5">
                <form id="book-form" onSubmit={save} className="flex flex-col gap-3">
                  <div className="relative">
                    <TextField
                      label="MediBank ID or phone"
                      hint="Search by mobile or MID, then select the patient. For a non-MediBank patient, enter details manually."
                      value={f.id}
                      onChange={(e) => { setF("id", e.target.value); setSearchKey(null); setHit(null); setForm((prev) => ({ ...prev, name: "", phone: "", gender: "" })); }}
                      className="pr-12"
                      placeholder="14-digit MID or mobile number"
                      inputMode="tel"
                      autoFocus
                    />
                    <Button type="button" variant="ghost" size="icon" aria-label="Search patient" onClick={searchPatient} disabled={lookup.isFetching} className="absolute right-1 top-7 size-8">
                      {lookup.isFetching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    </Button>
                  </div>
                  {searchKey && lookup.isError && <p role="alert" className="text-sm text-destructive">Patient search failed. Please try again.</p>}
                  {searchKey && !lookup.isFetching && lookup.data && (
                    <div className="rounded-lg border p-3">
                      <p className="mb-2 text-sm font-medium">Select patient / family member</p>
                      {people.length ? people.map((p) => (
                        <button type="button" key={p.mid || p.chartId} onClick={() => selectPatient(p)} aria-pressed={hit === p} className={cn("mb-1 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm", hit === p && "border-primary bg-primary/5")}>
                          <span>{p.name}<span className="block text-xs text-muted-foreground">{p.mid || p.phone}</span></span>
                          {hit === p && <span className="text-primary">Selected</span>}
                        </button>
                      )) : <p className="text-sm text-muted-foreground">No patient found. Fill in the patient details below.</p>}
                    </div>
                  )}
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
                  <fieldset className="rounded-lg border p-3">
                    <legend className="px-1 text-sm font-semibold">Vitals (optional)</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {VITAL_FIELDS.map((v) => <TextField key={v.key} label={`${v.label} (${v.unit})`} value={f.vitals[v.key] ?? ""} onChange={(e) => setF("vitals", { ...f.vitals, [v.key]: e.target.value })} placeholder={v.key === "bloodPressure" ? "120/80" : undefined} inputMode={v.key === "bloodPressure" ? undefined : "decimal"} />)}
                    </div>
                  </fieldset>
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
                  {f.mode === "UPI" && <TextField label="Payment reference / transaction ID" value={f.reference} onChange={(e) => setF("reference", e.target.value)} placeholder="Enter UPI transaction ID" />}
                </form>

                {showQr && (
                  <aside className="flex flex-col items-center gap-2 w-full rounded-lg border bg-muted/30 p-4 text-center">
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
              <DialogFooter className="sticky bottom-0 mt-auto border-t bg-background py-3">
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
