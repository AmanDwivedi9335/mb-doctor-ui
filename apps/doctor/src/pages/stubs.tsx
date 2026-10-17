import { useAuth } from "@/contexts/DoctorAuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, Construction } from "lucide-react";
import { useAppointments, useClinicProfile } from "@/hooks/use-api";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VITAL_FIELDS } from "@/lib/diagnosis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types";
import { useAppointmentUi } from "@/hooks/use-appointment-ui";
import { appointmentUiStatus, appointmentStatusVariant } from "@/lib/appointment-status";

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

/** Today's appointments table. Rows with a MID open that patient's workspace. */
export function AppointmentsTable({ paged = false, onEdit }: { paged?: boolean; onEdit?: (a: Appointment) => void }) {
  const { user, activeClinicId } = useAuth();
  const isDesk = user?.role === "receptionist";
  const { data: clinicProfile } = useClinicProfile(!!activeClinicId);
  const { statuses, now } = useAppointmentUi();
  const statusFor = (a: Appointment) => appointmentUiStatus(a, now, clinicProfile, statuses[a.id]);
  const { data } = useAppointments();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Appointment | null>(null);
  function openPatient(a: Appointment) {
    if (isDesk) return;
    if (a.mid) navigate(`/patients/${a.mid}?tab=summary&requestConsent=1`);
    else navigate("/walk-in", { state: { appointment: a } });
  }
  const appointmentColumns: Column<Appointment>[] = [
    { key: "serial", header: "Sl No.", render: (_, i) => i + 1 },
    { key: "patient", header: "Name", render: (a) => isDesk ? <span>{a.patientName}</span> : <button className="font-medium text-primary underline underline-offset-4" onClick={(e) => { e.stopPropagation(); openPatient(a); }}>{a.patientName}</button> },
    { key: "mid", header: "MID", render: (a) => a.mid ? isDesk ? <span>{a.mid}</span> : <button className="text-primary underline underline-offset-4" onClick={(e) => { e.stopPropagation(); openPatient(a); }}>{a.mid}</button> : "—" },
    { key: "date", header: "Date", className: "whitespace-nowrap", render: (a) => format(new Date(a.time), "dd MMM yyyy") },
    { key: "time", header: "Time", className: "whitespace-nowrap", render: (a) => format(new Date(a.time), "h:mm a") },
    { key: "bookedBy", header: "Booked by", render: (a) => a.bookedBy || "—" },
    { key: "status", header: "Status", render: (a) => <Badge variant={appointmentStatusVariant[statusFor(a)]} className="whitespace-nowrap">{statusFor(a)}</Badge> },
    { key: "payment", header: "Payment", render: (a) => a.payment ? `${a.payment.paid ? "Paid" : "Unpaid"} · ₹${a.payment.amount} · ${a.payment.mode}` : "—" },
    { key: "details", header: "Details", render: (a) => <div className="flex items-center gap-2 whitespace-nowrap">
      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(a); }}>Details</Button>
      {onEdit && <Button size="icon" className="size-9 rounded-full" aria-label={`Update appointment details for ${a.patientName}`} title="Update Details" onClick={(e) => { e.stopPropagation(); onEdit(a); }}><ArrowRight className="size-4" /></Button>}
    </div> },
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
          <p className="capitalize">Status: {statusFor(selected)}</p>
          <p>Payment: {selected.payment ? `${selected.payment.paid ? "Paid" : "Unpaid"} · ₹${selected.payment.amount} · ${selected.payment.mode}` : "—"}</p>
          {selected.payment?.reference && <p>Payment reference: {selected.payment.reference}</p>}
          {selected.vitals && <div className="grid grid-cols-2 gap-2 rounded-md border p-3">{VITAL_FIELDS.map((v) => <p key={v.key}>{v.label}: {selected.vitals?.[v.key] ? `${selected.vitals[v.key]} ${v.unit}` : "—"}</p>)}</div>}
          <div className="flex justify-end gap-2">{!isDesk && <Button onClick={() => openPatient(selected)}>{selected.mid ? "Open patient summary" : "Open walk-in Rx"}</Button>}</div>
        </div>}
      </DialogContent>
    </Dialog>
    </>
  );
}

export function Appointments() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Scheduled appointments</h2>
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
