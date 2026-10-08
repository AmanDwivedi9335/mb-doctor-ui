import { useEffect, useRef, useState } from "react";
import { Plus, QrCode, Upload, ImagePlus } from "lucide-react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useClinicProfile, useUpdateClinicProfile, useCreateClinic, useUploadClinicImage, useClinicQr } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { useForm } from "@/hooks/use-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { ClinicLogo } from "@/components/clinical/ClinicLogo";
import type { ClinicOperatingDay } from "@/types";

const DAYS: ClinicOperatingDay["day"][] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const weeklyHours = (opens = "09:00", closes = "20:00", saved: ClinicOperatingDay[] = []): ClinicOperatingDay[] =>
  DAYS.map((day) => ({ day, opens, closes, closed: false, ...saved.find((entry) => entry.day === day) }));
const EMPTY = { name: "", address: "", phone: "", website: "", receptionMobile: "", upiId: "", operatingHoursStart: "09:00", operatingHoursEnd: "20:00", operatingHours: weeklyHours() };

/** The active clinic's details, or the form that creates the first one. */
export function ClinicProfile() {
  const { user, activeClinicId, setActiveClinic, refreshSession } = useAuth();
  const owned = (user?.clinics ?? []).filter((c) => c.role === "owner");
  const isDesk = user?.role === "receptionist";
  const canCreate = !isDesk;
  const [newOpen, setNewOpen] = useState(false);

  if (!activeClinicId) {
    return owned.length === 0 ? (
      <Card>
        <CardHeader>
          <CardTitle>Set your clinic name</CardTitle>
          <p className="text-[13px] text-muted-foreground">
            A clinic gets its own appointments, invoices and statistics. Invite other doctors to it and give your reception
            a front desk login.
          </p>
        </CardHeader>
        <CardContent>
          <CreateClinicForm
            onCreated={async (id) => {
              await refreshSession();
              setActiveClinic(id);
            }}
          />
        </CardContent>
      </Card>
    ) : (
      <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        Select a clinic from the top bar to edit it.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setNewOpen(true)}>
            <Plus /> New clinic
          </Button>
        </div>
      )}
      <EditClinic key={activeClinicId} />
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New clinic</DialogTitle>
          </DialogHeader>
          <CreateClinicForm
            inDialog
            onCreated={async (id) => {
              setNewOpen(false);
              await refreshSession();
              setActiveClinic(id);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateClinicForm({ onCreated, inDialog }: { onCreated: (id: string) => void | Promise<void>; inDialog?: boolean }) {
  const create = useCreateClinic();
  const { f, setF } = useForm({ name: "", address: "", phone: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Clinic name is required.");
    try {
      const clinic = await create.mutateAsync({ name: f.name.trim(), address: f.address.trim() || null, phone: f.phone.trim() || null });
      toast.success(`${clinic.name} created.`);
      await onCreated(clinic.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create the clinic.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <TextField label="Clinic name" value={f.name} onChange={(e) => setF("name", e.target.value)} autoFocus />
      <TextField label="Address" value={f.address} onChange={(e) => setF("address", e.target.value)} />
      <TextField label="Phone" value={f.phone} onChange={(e) => setF("phone", e.target.value)} />
      {inDialog ? (
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating..." : "Create clinic"}</Button>
        </DialogFooter>
      ) : (
        <div className="flex justify-end">
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating..." : "Create clinic"}</Button>
        </div>
      )}
    </form>
  );
}

function EditClinic() {
  const { user, activeClinicId, refreshSession } = useAuth();
  // Payment details (QR, UPI ID) are the owning doctor's alone, never the desk's.
  const isOwner = user?.role === "doctor" && user.clinics.find((c) => c.id === activeClinicId)?.role === "owner";
  const { data, isLoading, error } = useClinicProfile();
  const qr = useClinicQr(activeClinicId, !!data?.qrUrl);
  const update = useUpdateClinicProfile();
  const uploadQr = useUploadClinicImage("qr-code");
  const qrInput = useRef<HTMLInputElement>(null);
  const { f, seed, setF, dirty } = useForm(EMPTY);

  useEffect(() => {
    if (data)
      seed({
        name: data.name,
        address: data.address ?? "",
        phone: data.phone ?? "",
        website: data.website ?? "",
        receptionMobile: data.receptionMobile ?? "",
        upiId: data.upiId ?? "",
        operatingHoursStart: data.operatingHoursStart,
        operatingHoursEnd: data.operatingHoursEnd,
        operatingHours: weeklyHours(data.operatingHoursStart, data.operatingHoursEnd, data.operatingHours),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Clinic name is required.");
    const missingHours = f.operatingHours.find((entry) => !entry.closed && (!entry.opens || !entry.closes));
    if (missingHours) return toast.error(`Enter opening and closing times for ${missingHours.day}.`);
    try {
      await update.mutateAsync(isOwner ? f : { ...f, upiId: undefined });
      await refreshSession();
      toast.success("Clinic profile saved.");
      seed({ ...f });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
    }
  }

  const pick = (m: typeof uploadQr) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a PNG, JPG or WebP image up to 2 MB.");
      return;
    }
    const form = new FormData();
    form.append("file", file, file.name);
    m.mutate(form, { onSuccess: () => toast.success("Uploaded."), onError: (err) => toast.error(err instanceof ApiError ? err.message : "Upload failed.") });
  };

  if (error) return <div className="text-sm text-destructive">{error instanceof ApiError ? error.message : "Could not load the clinic."}</div>;
  if (isLoading || !data) return <Skeleton className="h-96" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Card>
        <CardHeader>
          <CardTitle>Clinic details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-3">
            <TextField label="Clinic name" value={f.name} onChange={(e) => setF("name", e.target.value)} />
            <TextField label="Address" value={f.address} onChange={(e) => setF("address", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Phone" value={f.phone} onChange={(e) => setF("phone", e.target.value)} />
              <TextField label="Reception mobile" value={f.receptionMobile} onChange={(e) => setF("receptionMobile", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Website" value={f.website} onChange={(e) => setF("website", e.target.value)} />
              <TextField
                label="UPI ID"
                value={f.upiId}
                onChange={(e) => setF("upiId", e.target.value)}
                disabled={!isOwner}
                hint={isOwner ? undefined : "Only the clinic's doctor can change this."}
              />
            </div>
            <section className="mt-2 flex flex-col gap-3 border-t pt-4" aria-labelledby="clinic-hours-heading">
              <h3 id="clinic-hours-heading" className="text-sm font-semibold">Weekly opening hours</h3>
              <p className="text-xs text-muted-foreground">Set opening and closing times for each day. Any temporary changes to clinic hours can also be updated here.</p>
              {f.operatingHours.map((entry) => {
                const dayLabel = entry.day.charAt(0).toUpperCase() + entry.day.slice(1);
                const change = (patch: Partial<ClinicOperatingDay>) => setF("operatingHours", f.operatingHours.map((day) => day.day === entry.day ? { ...day, ...patch } : day));
                return (
                  <div key={entry.day} className="grid items-center gap-3 rounded-lg border p-3 sm:grid-cols-[110px_1fr_1fr_auto]">
                    <span className="text-sm font-medium">{dayLabel}</span>
                    <TextField label="Opens" aria-label={`${dayLabel} opens`} type="time" value={entry.opens} disabled={entry.closed} required={!entry.closed} onChange={(e) => change({ opens: e.target.value })} />
                    <TextField label="Closes" aria-label={`${dayLabel} closes`} type="time" value={entry.closes} disabled={entry.closed} required={!entry.closed} onChange={(e) => change({ closes: e.target.value })} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={entry.closed} onChange={(e) => change({ closed: e.target.checked })} aria-label={`${dayLabel} closed`} />Closed</label>
                  </div>
                );
              })}
            </section>
            {dirty && (
              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save changes"}</Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding and payment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ClinicLogo />
          <section aria-labelledby="payment-qr-heading">
            <h2 id="payment-qr-heading" className="flex items-center gap-1.5 text-sm font-semibold"><QrCode className="size-4" /> Payment QR</h2>
            <p className="mt-1 text-xs text-muted-foreground">{data.qrUrl ? "Shown to patients when an appointment is booked." : "Not added yet. Shown to patients when an appointment is booked."}</p>
            <div className="mt-3 flex flex-col items-start gap-3">
              <div className="flex h-20 w-28 items-center justify-center rounded-lg border bg-white p-2">
                {qr ? <img src={qr} alt="Clinic payment QR" className="max-h-full max-w-full object-contain" /> : <ImagePlus className="size-7 text-muted-foreground" />}
              </div>
            {isOwner ? (
              <div className="flex flex-col gap-2">
                <input ref={qrInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label={data.qrUrl ? "Change payment QR" : "Upload payment QR"} className="sr-only" disabled={uploadQr.isPending} onChange={pick(uploadQr)} />
                <Button type="button" size="sm" disabled={uploadQr.isPending} onClick={() => qrInput.current?.click()}><Upload />{uploadQr.isPending ? "Uploading..." : data.qrUrl ? "Change QR" : "Upload QR"}</Button>
                <span className="text-[11px] text-muted-foreground">PNG, JPG or WebP · up to 2 MB</span>
              </div>
            ) : (
              <span className="font-normal text-[12px] text-muted-foreground">Only the clinic's doctor can change this.</span>
            )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
