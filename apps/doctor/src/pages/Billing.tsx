import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useInvoices, useCreateInvoice, useClinicDoctors } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { useForm } from "@/hooks/use-form";
import { todayKey } from "@/lib/dates";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { StatTile } from "@/components/clinical/StatTile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import type { Invoice } from "@/types";

export const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const statusVariant = { paid: "success", partial: "warning", unpaid: "danger" } as const;
const MODES = ["Cash", "UPI", "Card", "Insurance"] as const;

export function Billing() {
  const { user, activeClinicId } = useAuth();
  const canRecord = !!activeClinicId && (user?.role === "receptionist" || user?.clinics.find((c) => c.id === activeClinicId)?.role === "owner");
  const { data, isLoading } = useInvoices();
  const [open, setOpen] = useState(false);

  const invoices = data?.invoices ?? [];
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const outstanding = invoices.reduce((s, i) => s + (i.total - i.paid), 0);

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Invoice", className: "font-mono text-[13px] tabular-nums", render: (i) => i.number },
    { key: "patient", header: "Patient", render: (i) => <span className="font-medium">{i.patientName}</span> },
    { key: "date", header: "Date", className: "tabular-nums whitespace-nowrap text-muted-foreground", render: (i) => format(new Date(i.date), "d MMM yyyy") },
    { key: "total", header: "Total", className: "tabular-nums", render: (i) => rupee(i.total) },
    { key: "received", header: "Received", className: "tabular-nums", render: (i) => rupee(i.paid) },
    { key: "mode", header: "Mode", className: "text-muted-foreground", render: (i) => i.mode ?? "-" },
    { key: "status", header: "Status", render: (i) => <Badge variant={statusVariant[i.status]} className="capitalize">{i.status}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Billing</h2>
        {canRecord && (
          <Button onClick={() => setOpen(true)}>
            <Plus /> Record payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Collected" value={rupee(collected)} />
        <StatTile label="Outstanding" value={rupee(outstanding)} />
        <StatTile label="Invoices" value={invoices.length} />
      </div>

      {!activeClinicId ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          Billing belongs to a clinic. Select one from the top bar.
        </div>
      ) : isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <DataTable columns={columns} rows={invoices} getRowKey={(i) => i.id} empty="No payments recorded yet." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <InvoiceForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * What the patient owes and what the desk actually received, by which mode.
 * The server sets paid / partial / unpaid from the two amounts. Used on
 * Billing, and on the booking screen right under the payment QR, where the
 * patient and doctor are already known.
 */
export function InvoiceForm({
  patient,
  doctorId,
  defaultMode = "Cash",
  cancelLabel = "Cancel",
  onDone,
  onCancel,
}: {
  patient?: { name: string; mid?: string };
  doctorId?: string;
  defaultMode?: (typeof MODES)[number];
  cancelLabel?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { activeClinicId } = useAuth();
  const pickDoctor = !doctorId && !!activeClinicId;
  const { data: doctors } = useClinicDoctors(pickDoctor);
  const accepted = (doctors?.doctors ?? []).filter((d) => d.active);
  const ownerId = accepted.find((d) => d.role === "owner")?.id ?? accepted[0]?.id ?? "";
  const create = useCreateInvoice();
  const { f, setF } = useForm({ patientName: "", doctorId: "", description: "Consultation", total: "", received: "", mode: defaultMode as string });

  const total = Number(f.total) || 0;
  // Blank "received" = paid in full, the common case at the desk.
  const received = f.received.trim() === "" ? total : Number(f.received);
  const due = total - received;
  const statusHint = !total ? undefined : received === 0 ? "Unpaid" : due > 0 ? `Partial: ${rupee(due)} still due` : due === 0 ? "Paid in full" : undefined;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = patient?.name ?? f.patientName.trim();
    if (!name) return toast.error("Patient name is required.");
    if (!(total > 0)) return toast.error("Enter the total amount.");
    if (!Number.isFinite(received) || received < 0) return toast.error("Enter the amount received.");
    if (received > total) return toast.error("Amount received is more than the total.");
    try {
      await create.mutateAsync({
        patientName: patient?.mid ? undefined : name,
        mid: patient?.mid,
        doctorId: doctorId ?? (f.doctorId || ownerId || undefined),
        date: todayKey(),
        items: [{ description: f.description.trim() || "Consultation", amount: total }],
        paid: received,
        mode: f.mode as Invoice["mode"],
      });
      toast.success(`${rupee(received)} recorded.`);
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record the payment.");
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      {!patient && <TextField label="Patient name" value={f.patientName} onChange={(e) => setF("patientName", e.target.value)} autoFocus />}
      {pickDoctor && accepted.length > 1 && (
        <SelectField label="Doctor" value={f.doctorId || ownerId} onValueChange={(v) => setF("doctorId", v)} options={accepted.map((d) => ({ value: d.id, label: d.name }))} />
      )}
      <TextField label="For" value={f.description} onChange={(e) => setF("description", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Total (₹)" type="number" min={0} inputMode="decimal" value={f.total} onChange={(e) => setF("total", e.target.value)} placeholder="Eg. 500" autoFocus={!!patient} />
        <TextField label="Amount received (₹)" type="number" min={0} inputMode="decimal" value={f.received} onChange={(e) => setF("received", e.target.value)} placeholder={total ? String(total) : "Same as total"} hint={statusHint} />
      </div>
      <SelectField label="Payment mode" value={f.mode} onValueChange={(v) => setF("mode", v)} options={MODES} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{cancelLabel}</Button>
        <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Record payment"}</Button>
      </DialogFooter>
    </form>
  );
}
