import { AlertTriangle, CalendarDays, House, Mail, Phone, type LucideIcon } from "lucide-react";
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

function Fact({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: LucideIcon }) {
  return (
    <div className="min-w-0">
      {Icon && <Icon aria-hidden="true" className="mr-2 inline-block size-5 align-middle text-primary" />}
      <dt className="inline font-semibold">{label}: </dt>
      <dd className="inline break-words font-medium">{value || "N/A"}</dd>
    </div>
  );
}

/** Identity band at the top of a patient workspace: who, MID, key facts, contact
 *  details, and any allergies pulled out as a warning since they change what a
 *  doctor prescribes. */
export function PatientHeader({ patient, summary = false }: { patient: Patient; summary?: boolean }) {
  const age = ageFrom(patient.dateOfBirth);
  const facts = [age != null ? `${age}y` : null, patient.gender, patient.bloodGroup, patient.city].filter(Boolean);
  const dob = age != null ? format(new Date(patient.dateOfBirth), "d MMM yyyy") : null;

  if (summary) {
    const summaryDob = age != null ? `${format(new Date(patient.dateOfBirth!), "dd-MM-yyyy")} (${age} Yo)` : null;
    return (
      <div className="overflow-hidden rounded-lg border bg-card">
        <dl className="grid items-center gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-[1.5fr_1.2fr_1fr]">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="min-w-0 break-words"><span className="font-semibold">Patient Name: </span>{patient.name || "N/A"}</h1>
            <Badge variant="default" className="px-4 py-2">{patient.gender || "N/A"}</Badge>
          </div>
          <Fact label="DOB" value={summaryDob} icon={CalendarDays} />
          <Fact label="MID" value={patient.mid} />
        </dl>
        <dl className="grid gap-4 border-t p-5 text-sm sm:grid-cols-2 lg:grid-cols-[1.5fr_1.2fr_1fr]">
          <Fact label="Address" value={patient.address || patient.city} icon={House} />
          <Fact label="Phone No." value={patient.phone} icon={Phone} />
          <Fact label="Mail" value={patient.email} icon={Mail} />
        </dl>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback>{initials(patient.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold leading-tight">{patient.name}</h1>
            <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[12px] tabular-nums text-muted-foreground">
              {patient.mid}
            </span>
            {patient.consentGranted && <Badge variant="success">Consent active</Badge>}
            <span className="text-[13px] text-muted-foreground">{facts.join(" · ")}</span>
          </div>
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
