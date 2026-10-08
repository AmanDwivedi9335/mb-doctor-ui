import { CalendarDays, House, Mail, Phone, type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { ageFrom } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@/types";

function Fact({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: LucideIcon }) {
  return (
    <div className="min-w-0">
      {Icon && <Icon aria-hidden="true" className="mr-2 inline-block size-5 align-middle text-primary" />}
      <dt className="inline font-semibold">{label}: </dt>
      <dd className="inline break-words font-medium">{value || "N/A"}</dd>
    </div>
  );
}

/** Shared patient identity and contact details across all workspace sections. */
export function PatientHeader({ patient }: { patient: Patient }) {
  const age = ageFrom(patient.dateOfBirth);
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
