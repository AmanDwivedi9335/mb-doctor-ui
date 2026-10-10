import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Check, Construction, ChevronRight } from "lucide-react";
import { useAppointments, useSetAppointmentStatus } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { toast } from "@/components/ui/sonner";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VITAL_FIELDS } from "@/lib/diagnosis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types";

/** Clean placeholder for anything not built yet. Honest, not a spinner. */
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed bg-card p-10 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Construction className="size-5" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

const statusVariant: Record<Appointment["status"], "default" | "primary" | "success" | "warning"> = {
  waiting: "warning",
  "in-progress": "primary",
  completed: "success",
  cancelled: "default",
};

/** Done / Undo on one appointment. Stops the click: the row itself opens the patient. */
function DoneButton({ a }: { a: Appointment }) {
  const set = useSetAppointmentStatus();
  if (a.status === "cancelled") return null;
  const done = a.status === "completed";
  return (
    <Button
      size="sm"
      variant={done ? "ghost" : "outline"}
      disabled={set.isPending}
      onClick={(e) => {
        e.stopPropagation();
        set.mutate(
          { id: a.id, status: done ? "waiting" : "completed" },
          { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update the appointment.") }
        );
      }}
    >
      {done ? "Undo" : <><Check /> Done</>}
    </Button>
  );
}

/** Today's appointments table. Rows with a MID open that patient's workspace. */
export function AppointmentsTable({ paged = false }: { paged?: boolean }) {
  const { data } = useAppointments();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Appointment | null>(null);
  function openPatient(a: Appointment) {
    if (a.mid) navigate(`/patients/${a.mid}?requestConsent=1`);
    else navigate("/walk-in", { state: { appointment: a } });
  }
  const appointmentColumns: Column<Appointment>[] = [
    { key: "serial", header: "Sl No.", render: (_, i) => i + 1 },
    { key: "patient", header: "Name", render: (a) => <button className="font-medium text-primary underline underline-offset-4" onClick={(e) => { e.stopPropagation(); openPatient(a); }}>{a.patientName}</button> },
    { key: "mid", header: "MID", render: (a) => a.mid ? <button className="text-primary underline underline-offset-4" onClick={(e) => { e.stopPropagation(); openPatient(a); }}>{a.mid}</button> : "—" },
    { key: "date", header: "Date", className: "whitespace-nowrap", render: (a) => format(new Date(a.time), "dd MMM yyyy") },
    { key: "time", header: "Time", className: "whitespace-nowrap", render: (a) => format(new Date(a.time), "h:mm a") },
    { key: "bookedBy", header: "Booked by", render: (a) => a.bookedBy || "—" },
    { key: "status", header: "Status", render: (a) => <Badge variant={statusVariant[a.status]} className="capitalize">{a.status.replace("-", " ")}</Badge> },
    { key: "payment", header: "Payment", render: (a) => a.payment ? `${a.payment.paid ? "Paid" : "Unpaid"} · ₹${a.payment.amount} · ${a.payment.mode}` : "—" },
    { key: "details", header: "Details", render: (a) => <Button size="icon" variant="ghost" aria-label={`View appointment for ${a.patientName}`} onClick={(e) => { e.stopPropagation(); setSelected(a); }}><ChevronRight /></Button> },
  ];
  return (
    <>

    <DataTable
      paged={paged}
      searchable={paged ? (a) => `${a.patientName} ${a.mid ?? ""} ${a.reason}` : undefined}
      columns={appointmentColumns}
      rows={data?.appointments ?? []}
      getRowKey={(a) => a.id}
      empty="No appointments today."
      onRowClick={(a: Appointment) => setSelected(a)}
    />
    <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Appointment details</DialogTitle></DialogHeader>
        {selected && <div className="flex flex-col gap-3 text-sm">
          <p className="text-base font-semibold">{selected.patientName}</p>
          {selected.mid && <p>MID: {selected.mid}</p>}
          <p>{format(new Date(selected.time), "dd MMM yyyy, h:mm a")}</p>
          <p>Booked by: {selected.bookedBy || "—"}</p>
          <p>Doctor: {selected.doctorName || "—"}</p>
          <p>Chief complaint: {selected.reason || "—"}</p>
          <p className="capitalize">Status: {selected.status.replace("-", " ")}</p>
          <p>Payment: {selected.payment ? `${selected.payment.paid ? "Paid" : "Unpaid"} · ₹${selected.payment.amount} · ${selected.payment.mode}` : "—"}</p>
          {selected.payment?.reference && <p>Payment reference: {selected.payment.reference}</p>}
          {selected.vitals && <div className="grid grid-cols-2 gap-2 rounded-md border p-3">{VITAL_FIELDS.map((v) => <p key={v.key}>{v.label}: {selected.vitals?.[v.key] ? `${selected.vitals[v.key]} ${v.unit}` : "—"}</p>)}</div>}
          <div className="flex justify-end gap-2"><DoneButton a={selected} /><Button onClick={() => openPatient(selected)}>{selected.mid ? "Open patient summary" : "Open walk-in Rx"}</Button></div>
        </div>}
      </DialogContent>
    </Dialog>
    </>
  );
}

export function Appointments() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Today's appointments</h2>
      <AppointmentsTable />
    </div>
  );
}

export function NotFound() {
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">That page does not exist.</p>
      <Button asChild className="mt-5">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
