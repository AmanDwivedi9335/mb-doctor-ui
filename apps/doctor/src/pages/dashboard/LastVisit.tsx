import { Card } from "@/components/ui/card";
import type { LastVisit as LastVisitData } from "@/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2.5">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

export function LastVisit({ visit }: { visit: LastVisitData | null }) {
  if (!visit) {
    return (
      <Card className="p-4">
        <h3 className="text-[15px] font-semibold">Last visit details</h3>
        <p className="mt-3 text-[13px] text-muted-foreground">No consultations yet. Your last visit shows here.</p>
      </Card>
    );
  }
  return (
    <Card className="p-4">
      <h3 className="text-[15px] font-semibold">Last visit details</h3>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="font-semibold">{visit.patientName}</div>
        <span className="font-mono text-[12px] text-muted-foreground">{visit.code}</span>
      </div>
      <div className="text-[12.5px] text-muted-foreground">
        {visit.sex}, {visit.age} years
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {visit.tags.map((t) => (
          <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-[11.5px] font-medium text-secondary-foreground">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-2 divide-y divide-border/60">
        <Field label="Last Checked">{visit.lastChecked}</Field>
        <Field label="Observation">{visit.observation}</Field>
        <Field label="Diagnosis">{visit.diagnosis}</Field>
        <Field label="Prescription">
          <div className="flex flex-col">
            {visit.prescription.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </Field>
        <Field label="Notes">{visit.notes}</Field>
      </div>
    </Card>
  );
}
