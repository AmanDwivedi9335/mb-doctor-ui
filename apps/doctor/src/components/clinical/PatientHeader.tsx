import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ageFrom } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Patient } from "@/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="inline text-muted-foreground">{label}: </dt>
      <dd className="inline break-words font-medium">{value || "N/A"}</dd>
    </div>
  );
}

/** Identity band at the top of a patient workspace: who, MID, key facts, contact
 *  details, and any allergies pulled out as a warning since they change what a
 *  doctor prescribes. */
export function PatientHeader({ patient }: { patient: Patient }) {
  const age = ageFrom(patient.dateOfBirth);
  const facts = [age != null ? `${age}y` : null, patient.gender, patient.bloodGroup, patient.city].filter(Boolean);
  const dob = age != null ? format(new Date(patient.dateOfBirth), "d MMM yyyy") : null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-11">
          <AvatarFallback>{initials(patient.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold leading-tight">{patient.name}</h1>
            <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[12px] tabular-nums text-muted-foreground">
              {patient.mid}
            </span>
            {patient.consentGranted && <Badge variant="success">Consent active</Badge>}
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">{facts.join(" · ")}</div>
        </div>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="DOB" value={dob} />
        <Fact label="Phone" value={patient.phone} />
        <Fact label="Mail" value={patient.email} />
        <Fact label="Address" value={patient.address} />
      </dl>

      {patient.allergies.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/8 px-3 py-2 text-[13px] text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-medium">Allergies:</span>
          <span>{patient.allergies.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
