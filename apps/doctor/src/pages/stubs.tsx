import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Check, Construction } from "lucide-react";
import { useAppointments, useSetAppointmentStatus } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { toast } from "@/components/ui/sonner";
import { DataTable, type Column } from "@/components/clinical/DataTable";
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

const appointmentColumns: Column<Appointment>[] = [
  { key: "time", header: "Time", className: "tabular-nums whitespace-nowrap", render: (a) => format(new Date(a.time), "h:mm a") },
  { key: "patient", header: "Patient", render: (a) => <span className="font-medium">{a.patientName}</span> },
  { key: "reason", header: "Chief complaint", className: "text-muted-foreground", render: (a) => a.reason },
  { key: "status", header: "Status", render: (a) => <Badge variant={statusVariant[a.status]} className="capitalize">{a.status.replace("-", " ")}</Badge> },
  { key: "done", header: "", className: "w-24 text-right", render: (a) => <DoneButton a={a} /> },
];

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
  return (
    <DataTable
      paged={paged}
      searchable={paged ? (a) => `${a.patientName} ${a.mid ?? ""} ${a.reason}` : undefined}
      columns={appointmentColumns}
      rows={data?.appointments ?? []}
      getRowKey={(a) => a.id}
      empty="No appointments today."
      onRowClick={(a) => a.mid && navigate(`/patients/${a.mid}`)}
    />
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
