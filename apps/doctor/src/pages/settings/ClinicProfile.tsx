import { useEffect, useRef, useState } from "react";
import { Plus, QrCode, Upload, ImagePlus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import {
  useClinicProfile,
  useUpdateClinicProfile,
  useCreateClinic,
  useClinicQr,
} from "@/hooks/use-api";
import { useLocalClinicQr } from "@/hooks/use-appointment-ui";
import { ApiError } from "@myanodex/shared/api-client";
import { useForm } from "@/hooks/use-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { WeeklyHoursTable } from "@/components/clinical/WeeklyHoursTable";
import { ClinicLogo } from "@/components/clinical/ClinicLogo";
import { ClinicNoticeFields } from "@/components/form/ClinicNoticeFields";
import {
  validClinicNotices,
  validTemporaryHours,
} from "@/lib/profile-settings";
import type { Clinic, ClinicOperatingDay } from "@/types";

const DAYS: ClinicOperatingDay["day"][] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const weeklyHours = (
  opens = "09:00",
  closes = "20:00",
  saved: ClinicOperatingDay[] = [],
): ClinicOperatingDay[] =>
  DAYS.map((day) => ({
    day,
    opens,
    closes,
    closed: false,
    ...saved.find((entry) => entry.day === day),
  }));
const EMPTY = {
  name: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  website: "",
  receptionMobile: "",
  upiId: "",
  operatingHoursStart: "09:00",
  operatingHoursEnd: "20:00",
  operatingHours: weeklyHours(),
  temporaryHours: [] as NonNullable<Clinic["temporaryHours"]>,
  notices: [] as NonNullable<Clinic["notices"]>,
};

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
            A clinic gets its own appointments, invoices and statistics. Invite
            other doctors to it and give your reception a front desk login.
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

function CreateClinicForm({
  onCreated,
  inDialog,
}: {
  onCreated: (id: string) => void | Promise<void>;
  inDialog?: boolean;
}) {
  const create = useCreateClinic();
  const { f, setF } = useForm({
    name: "",
    address: "",
    phone: "",
    city: "",
    state: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Clinic name is required.");
    try {
      const clinic = await create.mutateAsync({
        name: f.name.trim(),
        address: f.address.trim() || null,
        city: f.city.trim(),
        state: f.state.trim(),
        phone: f.phone.trim() || null,
      });
      toast.success(`${clinic.name} created.`);
      await onCreated(clinic.id);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not create the clinic.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <TextField
        label="Clinic name"
        value={f.name}
        onChange={(e) => setF("name", e.target.value)}
        autoFocus
      />
      <TextField
        label="Address"
        value={f.address}
        onChange={(e) => setF("address", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="City"
          value={f.city}
          onChange={(e) => setF("city", e.target.value)}
        />
        <TextField
          label="State"
          value={f.state}
          onChange={(e) => setF("state", e.target.value)}
        />
      </div>
      <TextField
        label="Phone"
        value={f.phone}
        onChange={(e) => setF("phone", e.target.value)}
      />
      {inDialog ? (
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create clinic"}
          </Button>
        </DialogFooter>
      ) : (
        <div className="flex justify-end">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create clinic"}
          </Button>
        </div>
      )}
    </form>
  );
}

function EditClinic() {
  const { user, activeClinicId, refreshSession } = useAuth();
  // Payment details (QR, UPI ID) are the owning doctor's alone, never the desk's.
  const isOwner =
    user?.role === "doctor" &&
    user.clinics.find((c) => c.id === activeClinicId)?.role === "owner";
  const canEdit = isOwner || user?.role === "receptionist";
  const { data, isLoading, error } = useClinicProfile();
  const existingQr = useClinicQr(activeClinicId, !!data?.qrUrl);
  const [localQr, saveLocalQr] = useLocalClinicQr(activeClinicId);
  const qr = localQr || existingQr;
  const [readingQr, setReadingQr] = useState(false);
  const qrReader = useRef<FileReader | null>(null);
  useEffect(() => () => { qrReader.current?.abort(); qrReader.current = null; }, []);
  const update = useUpdateClinicProfile();
  const qrInput = useRef<HTMLInputElement>(null);
  const { f, seed, setF, dirty } = useForm(EMPTY);

  useEffect(() => {
    if (data)
      seed({
        name: data.name,
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        phone: data.phone ?? "",
        website: data.website ?? "",
        receptionMobile: data.receptionMobile ?? "",
        upiId: data.upiId ?? "",
        operatingHoursStart: data.operatingHoursStart,
        operatingHoursEnd: data.operatingHoursEnd,
        operatingHours: weeklyHours(
          data.operatingHoursStart,
          data.operatingHoursEnd,
          data.operatingHours,
        ),
        temporaryHours: data.temporaryHours ?? [],
        notices: data.notices ?? [],
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Clinic name is required.");
    const missingHours = f.operatingHours.find(
      (entry) => !entry.closed && (!entry.opens || !entry.closes),
    );
    if (missingHours)
      return toast.error(
        `Enter opening and closing times for ${missingHours.day}.`,
      );
    if (f.operatingHours.some((h) => !h.closed && h.opens >= h.closes))
      return toast.error("Closing time must be after opening time.");
    if (!validClinicNotices(f.notices))
      return toast.error("Each notice needs a note and valid start/end dates.");
    if (!validTemporaryHours(f.temporaryHours))
      return toast.error(
        "Temporary changes need valid dates and hours, without overlapping date ranges.",
      );
    try {
      await update.mutateAsync(isOwner ? f : { ...f, upiId: undefined });
      await refreshSession();
      toast.success("Clinic profile saved.");
      seed({ ...f });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
    }
  }

  function pickQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !isOwner) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a PNG, JPG or WebP image up to 2 MB.");
      return;
    }
    setReadingQr(true);
    qrReader.current?.abort();
    const reader = new FileReader();
    qrReader.current = reader;
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        if (qrReader.current !== reader) return;
        try {
          saveLocalQr(String(reader.result));
          toast.success("Payment QR saved in this browser.");
        } catch { toast.error("Browser storage is unavailable or full. Try a smaller image."); }
        setReadingQr(false);
      };
      image.onerror = () => { if (qrReader.current === reader) { setReadingQr(false); toast.error("This image could not be opened."); } };
      image.src = String(reader.result);
    };
    reader.onerror = () => { setReadingQr(false); toast.error("Could not read this image."); };
    reader.readAsDataURL(file);
  }

  if (error)
    return (
      <div className="text-sm text-destructive">
        {error instanceof ApiError
          ? error.message
          : "Could not load the clinic."}
      </div>
    );
  if (isLoading || !data) return <Skeleton className="h-96" />;

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          Clinic details are managed by the principal doctor and front desk.
        </p>
      )}
      <fieldset disabled={!canEdit} className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Clinic details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <TextField
                label="Clinic name"
                value={f.name}
                onChange={(e) => setF("name", e.target.value)}
              />
              <TextField
                label="Address"
                value={f.address}
                onChange={(e) => setF("address", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="City"
                  value={f.city}
                  onChange={(e) => setF("city", e.target.value)}
                />
                <TextField
                  label="State"
                  value={f.state}
                  onChange={(e) => setF("state", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Phone"
                  value={f.phone}
                  onChange={(e) => setF("phone", e.target.value)}
                />
                <TextField
                  label="Reception mobile"
                  value={f.receptionMobile}
                  onChange={(e) => setF("receptionMobile", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Website"
                  value={f.website}
                  onChange={(e) => setF("website", e.target.value)}
                />
                <TextField
                  label="UPI ID (optional fallback)"
                  value={f.upiId}
                  onChange={(e) => setF("upiId", e.target.value)}
                  disabled={!isOwner}
                  hint={
                    isOwner
                      ? undefined
                      : "Only the clinic's doctor can change this."
                  }
                />
              </div>
              <section
                className="grid gap-4 border-t pt-4 sm:grid-cols-2"
                aria-label="Branding and payment"
              >
                <ClinicLogo />
                <section aria-labelledby="payment-qr-heading">
                  <h2
                    id="payment-qr-heading"
                    className="flex items-center gap-1.5 text-sm font-semibold"
                  >
                    <QrCode className="size-4" /> Payment QR Code
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload a payment QR image to show during booking and appointment updates.
                    Saved only in this browser for this clinic.
                  </p>
                  <div className="mt-3 flex flex-col items-start gap-3">
                    <div className="flex size-44 items-center justify-center rounded-lg border bg-white p-2">
                      {qr ? (
                        <img
                          src={qr}
                          alt="Clinic payment QR"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <ImagePlus className="size-7 text-muted-foreground" />
                      )}
                    </div>
                    {isOwner ? (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={qrInput}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          aria-label={
                            qr
                              ? "Change payment QR"
                              : "Upload payment QR"
                          }
                          className="sr-only"
                          disabled={readingQr}
                          onChange={pickQr}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={readingQr}
                          onClick={() => qrInput.current?.click()}
                        >
                          <Upload />
                          {readingQr
                            ? "Reading..."
                            : qr
                              ? "Change QR"
                              : "Upload QR"}
                        </Button>
                        {localQr && <Button type="button" size="sm" variant="outline" onClick={() => {
                          try { saveLocalQr(null); } catch { toast.error("Could not reset the QR image in this browser."); }
                        }}>Reset uploaded QR</Button>}
                        <span className="text-[11px] text-muted-foreground">
                          PNG, JPG or WebP · up to 2 MB
                        </span>
                      </div>
                    ) : (
                      <span className="font-normal text-[12px] text-muted-foreground">
                        Only the clinic's doctor can change this.
                      </span>
                    )}
                  </div>
                </section>
              </section>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Opening hours</CardTitle>
          </CardHeader>
          <CardContent>
            <section
              className="flex flex-col gap-3"
              aria-labelledby="clinic-hours-heading"
            >
              <h3 id="clinic-hours-heading" className="text-sm font-semibold">
                Weekly opening hours
              </h3>
              <p className="text-xs text-muted-foreground">
                Set the normal weekly schedule. Temporary changes below take
                precedence within their date range.
              </p>
              <WeeklyHoursTable
                hours={f.operatingHours}
                onChange={(hours) => setF("operatingHours", hours)}
              />
            </section>
            <section
              className="mt-5 space-y-3 border-t pt-4"
              aria-label="Temporary changes"
            >
              <h3 className="text-sm font-semibold">Temporary opening hours</h3>
              {f.temporaryHours.map((entry, index) => {
                const change = (patch: Partial<typeof entry>) =>
                  setF(
                    "temporaryHours",
                    f.temporaryHours.map((item, i) =>
                      i === index ? { ...item, ...patch } : item,
                    ),
                  );
                return (
                  <div
                    key={entry.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Temporary change {index + 1}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove temporary change ${index + 1}`}
                        onClick={() =>
                          setF(
                            "temporaryHours",
                            f.temporaryHours.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField
                        label="Start date"
                        type="date"
                        value={entry.start}
                        required
                        onChange={(e) => change({ start: e.target.value })}
                      />
                      <TextField
                        label="End date"
                        type="date"
                        min={entry.start}
                        value={entry.end}
                        required
                        onChange={(e) => change({ end: e.target.value })}
                      />
                      <TextField
                        label="Opens"
                        type="time"
                        value={entry.opens}
                        disabled={entry.closed}
                        required={!entry.closed}
                        onChange={(e) => change({ opens: e.target.value })}
                      />
                      <TextField
                        label="Closes"
                        type="time"
                        value={entry.closes}
                        disabled={entry.closed}
                        required={!entry.closed}
                        onChange={(e) => change({ closes: e.target.value })}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={entry.closed}
                        onChange={(e) => change({ closed: e.target.checked })}
                      />
                      Clinic closed during this period
                    </label>
                    <TextField
                      label="Reason for hours change"
                      value={entry.note}
                      onChange={(e) => change({ note: e.target.value })}
                      hint="Use the clinic noticeboard below for messages shown in listings."
                    />
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setF("temporaryHours", [
                    ...f.temporaryHours,
                    {
                      id: crypto.randomUUID(),
                      start: "",
                      end: "",
                      closed: false,
                      opens: "09:00",
                      closes: "20:00",
                      note: "",
                    },
                  ])
                }
              >
                <Plus />
                Add temporary change
              </Button>
            </section>
            <ClinicNoticeFields
              value={f.notices}
              onChange={(notices) => setF("notices", notices)}
            />
          </CardContent>
        </Card>

        {dirty && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                seed({
                  ...f,
                  name: data.name,
                  address: data.address ?? "",
                  city: data.city ?? "",
                  state: data.state ?? "",
                  phone: data.phone ?? "",
                  website: data.website ?? "",
                  receptionMobile: data.receptionMobile ?? "",
                  upiId: data.upiId ?? "",
                  operatingHoursStart: data.operatingHoursStart,
                  operatingHoursEnd: data.operatingHoursEnd,
                  operatingHours: weeklyHours(
                    data.operatingHoursStart,
                    data.operatingHoursEnd,
                    data.operatingHours,
                  ),
                  temporaryHours: data.temporaryHours ?? [],
                  notices: data.notices ?? [],
                })
              }
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  );
}
