import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { DIAGNOSIS_STATUS_OPTIONS } from "@myanodex/shared/constants";
import { VITAL_FIELDS, medName, doseLabel } from "@/lib/diagnosis";
import { todayKey } from "@/lib/dates";
import { useForm } from "@/hooks/use-form";
import { Button } from "@/components/ui/button";
import { Field, TextField, TextAreaField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { MedicationDialog, LabTestDialog } from "./DiagnosisDialogs";
import type { DiagnosisMedication, DiagnosisStatus, DiagnosisTest, DiagnosisVitals } from "@/types";

// A type alias, not an interface: useForm's Record constraint rejects interfaces.
export type DiagnosisFormValues = {
  name: string;
  code: string;
  status: DiagnosisStatus;
  date: string;
  notes: string;
  doctorNotes: string;
  medications: DiagnosisMedication[];
  tests: DiagnosisTest[];
  addMedsToSummary: boolean;
  vitals: DiagnosisVitals;
  /** Follow-up: ticked, then a date and an optional time. See followUpValue(). */
  followUp: boolean;
  followUpOn: string;
  followUpAt: string;
};

export const blankDiagnosis = (): DiagnosisFormValues => ({
  name: "",
  code: "",
  status: "Confirmed",
  date: todayKey(),
  notes: "",
  doctorNotes: "",
  medications: [],
  tests: [],
  addMedsToSummary: false,
  vitals: {},
  followUp: false,
  followUpOn: "",
  followUpAt: "",
});

/** Input-shaped button that opens a sub-dialog (Medication and Dosage, Lab test). */
function Picker({ text, filled, onClick }: { text: string; filled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm hover:bg-secondary/60",
        !filled && "text-muted-foreground"
      )}
    >
      <span className="truncate">{text}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** The consultation form: chief complaint, notes, medication, tests, vitals.
 *  Shared by the per-patient Diagnosis dialog and the walk-in Rx page. Owns its
 *  own state; mount fresh to reset. `summaryOption` shows the "Add it in
 *  Medication" tick, which only means something for a MID patient. */
export function DiagnosisForm({
  onSubmit,
  pending,
  submitLabel = "Save",
  cancel,
  summaryOption = true,
  autoFocus,
  initialValues,
}: {
  onSubmit: (v: DiagnosisFormValues) => void | Promise<void>;
  pending: boolean;
  submitLabel?: string;
  cancel?: ReactNode;
  summaryOption?: boolean;
  autoFocus?: boolean;
  initialValues?: Partial<DiagnosisFormValues>;
}) {
  const { f, setF } = useForm({ ...blankDiagnosis(), ...initialValues });
  const [sub, setSub] = useState<"meds" | "tests" | null>(null);
  const setVital = (k: keyof DiagnosisVitals, v: string) => setF("vitals", { ...f.vitals, [k]: v });

  const medsText = f.medications.map((m) => `${medName(m)} ${doseLabel(m)}`).join(", ");
  const testsText = f.tests.map((t) => t.name).join(", ");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Chief complaint is required.");
    if (f.followUp && !f.followUpOn) return toast.error("Pick the follow-up date.");
    if (f.followUp && f.followUpOn < f.date) return toast.error("The follow-up cannot be before the consultation.");
    void onSubmit({
      ...f,
      name: f.name.trim(),
      code: f.code.trim(),
      notes: f.notes.trim(),
      doctorNotes: f.doctorNotes.trim(),
    });
  }

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="flex flex-col gap-3">
            <TextField
              label="Chief Complaint"
              value={f.name}
              onChange={(e) => setF("name", e.target.value)}
              placeholder="Eg. Stomach Pain"
              autoFocus={autoFocus}
            />
            <div className="grid grid-cols-3 gap-3">
              <TextField label="ICD-10 code" value={f.code} onChange={(e) => setF("code", e.target.value)} placeholder="Optional" />
              <SelectField
                label="Status"
                value={f.status}
                onValueChange={(v) => setF("status", v as DiagnosisStatus)}
                options={DIAGNOSIS_STATUS_OPTIONS}
              />
              <TextField label="Date" type="date" value={f.date} onChange={(e) => setF("date", e.target.value)} />
            </div>
            <TextAreaField
              label="Clinical Notes"
              value={f.notes}
              onChange={(e) => setF("notes", e.target.value)}
              placeholder="Eg. Have ate something outside"
              rows={3}
            />
            <Field label="Medication and Dosage">
              <Picker text={medsText || "Enter Medication and Dosage"} filled={!!medsText} onClick={() => setSub("meds")} />
            </Field>
            <Field label="Lab / Diagnostic Test">
              <Picker text={testsText || "Lab / Diagnostic Test"} filled={!!testsText} onClick={() => setSub("tests")} />
            </Field>
            <TextAreaField
              label="Doctor's Notes"
              hint="Only for doctor reference. Not seen by the patient."
              value={f.doctorNotes}
              onChange={(e) => setF("doctorNotes", e.target.value)}
              placeholder="Doctor's Notes"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-3">
            {VITAL_FIELDS.map((v) => (
              <TextField
                key={v.key}
                label={`${v.label} (${v.unit})`}
                value={f.vitals[v.key] ?? ""}
                onChange={(e) => setVital(v.key, e.target.value)}
                placeholder={v.key === "bloodPressure" ? "120/80" : undefined}
                inputMode={v.key === "bloodPressure" ? undefined : "decimal"}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-md border px-3 py-2.5">
          <label className="flex h-9 items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={f.followUp} onChange={(e) => setF("followUp", e.target.checked)} className="size-4 accent-primary" />
            Follow-up
          </label>
          {f.followUp && (
            <>
              <TextField label="Date" type="date" min={f.date} value={f.followUpOn} onChange={(e) => setF("followUpOn", e.target.value)} className="w-44" />
              <TextField label="Time (optional)" type="time" value={f.followUpAt} onChange={(e) => setF("followUpAt", e.target.value)} className="w-36" />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {cancel}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>

      {sub === "meds" && (
        <MedicationDialog
          initial={f.medications}
          addToSummary={f.addMedsToSummary}
          summaryOption={summaryOption}
          onSave={(list, flag) => {
            setF("medications", list);
            setF("addMedsToSummary", flag);
            setSub(null);
          }}
          onClose={() => setSub(null)}
        />
      )}
      {sub === "tests" && (
        <LabTestDialog
          initial={f.tests}
          onSave={(list) => {
            setF("tests", list);
            setSub(null);
          }}
          onClose={() => setSub(null)}
        />
      )}
    </>
  );
}
