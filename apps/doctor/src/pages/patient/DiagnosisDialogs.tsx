import { useState, type ReactNode } from "react";
import { X, Lock } from "lucide-react";
import { format } from "date-fns";
import {
  MEDICATIONS,
  UNITS,
  INSTRUCTIONS,
  MED_FORMS,
  FREQUENCIES,
  TIME_CHIPS,
  DURATION_CHIPS,
  SPECIALS,
  LAB_TESTS,
  VITAL_FIELDS,
  medName,
  doseLabel,
  scheduleLabel,
} from "@/lib/diagnosis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, TextField, TextAreaField, SelectField } from "@/components/form/FormKit";
import { cn } from "@/lib/utils";
import { formatFollowUp } from "@/lib/dates";
import { toast } from "@/components/ui/sonner";
import type { Diagnosis, DiagnosisMedication, DiagnosisStatus, DiagnosisTest } from "@/types";

export const statusVariant: Record<DiagnosisStatus, "success" | "warning" | "primary" | "default"> = {
  Confirmed: "success",
  Suspected: "warning",
  "To Rule Out": "default",
  "Follow Up": "primary",
};

/** The "added so far" list shared by both sub-dialogs. */
function Added<T>({
  items,
  label,
  sub,
  onRemove,
}: {
  items: T[];
  label: (t: T) => string;
  sub?: (t: T) => string | undefined;
  onRemove: (i: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col divide-y rounded-md border text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium">{label(it)}</div>
            {sub?.(it) && <div className="text-[12px] text-muted-foreground">{sub(it)}</div>}
          </div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove"
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

const Check = ({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) => (
  <label className="flex items-center gap-1.5 text-sm">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-primary" />
    {children}
  </label>
);

const blankMed = (): DiagnosisMedication => ({
  name: "",
  form: undefined,
  amount: "",
  unit: UNITS[0],
  frequency: undefined,
  times: [],
  duration: "",
  instructions: INSTRUCTIONS[0],
  special: undefined,
});

/** Row of toggle buttons. Single-select clears on re-click so every row is
 *  optional; multi-select toggles each. Options may carry a short chip label. */
function Chips({
  options,
  value,
  onChange,
  multi,
}: {
  options: readonly (string | { label: string; value: string })[];
  value: string | string[] | undefined;
  onChange: (next: string | string[] | undefined) => void;
  multi?: boolean;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v);
  const pick = (v: string) => {
    if (Array.isArray(value) || multi) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else {
      onChange(value === v ? undefined : v);
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => pick(o.value)}
          aria-pressed={selected(o.value)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-[12.5px] font-medium transition-colors",
            selected(o.value)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-foreground hover:bg-secondary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const isPresetDuration = (v: string) => DURATION_CHIPS.some((c) => c.value === v);

/** Medication and Dosage picker. Add builds a list; Save hands it back. Mounted
 *  fresh each open so Cancel discards the draft. */
export function MedicationDialog({
  initial,
  addToSummary,
  summaryOption = true,
  onSave,
  onClose,
}: {
  initial: DiagnosisMedication[];
  addToSummary: boolean;
  /** Hide the "Add it in Medication" tick (walk-ins have no Patient Summary). */
  summaryOption?: boolean;
  onSave: (list: DiagnosisMedication[], addToSummary: boolean) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState(initial);
  const [flag, setFlag] = useState(addToSummary);
  const [d, setD] = useState<DiagnosisMedication>(blankMed);
  const [customDur, setCustomDur] = useState(false);
  const set = <K extends keyof DiagnosisMedication>(k: K, v: DiagnosisMedication[K]) => setD((p) => ({ ...p, [k]: v }));

  function add() {
    if (!d.name.trim()) return toast.error("Enter a medication.");
    if (!d.amount.trim()) return toast.error("Enter an amount.");
    setList((l) => [...l, { ...d, name: d.name.trim(), amount: d.amount.trim(), duration: d.duration.trim() }]);
    setD(blankMed());
    setCustomDur(false);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Medication and Dosage</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Medication" hint="Type to search. Names not in the list are kept as typed.">
            <Input
              list="medication-catalogue"
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Search or type a medication"
              autoFocus
            />
            <datalist id="medication-catalogue">
              {MEDICATIONS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
          <Field label="Type">
            <Chips options={MED_FORMS} value={d.form} onChange={(v) => set("form", v as string | undefined)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Amount"
              type="number"
              min={0}
              step="any"
              value={d.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="Enter amount"
            />
            <SelectField label="Unit" value={d.unit} onValueChange={(v) => set("unit", v)} options={UNITS} />
          </div>
          <Field label="Timing">
            <Chips options={FREQUENCIES} value={d.frequency} onChange={(v) => set("frequency", v as string | undefined)} />
          </Field>
          <Field label="Schedule">
            <Chips options={TIME_CHIPS} value={d.times} onChange={(v) => set("times", (v as string[]) ?? [])} multi />
          </Field>
          <Field label="Meal">
            <Chips options={INSTRUCTIONS} value={d.instructions} onChange={(v) => set("instructions", (v as string | undefined) ?? "")} />
          </Field>
          <Field label="Duration">
            <div className="flex flex-col gap-2">
              <Chips
                options={[...DURATION_CHIPS, { label: "Custom", value: "__custom" }]}
                value={customDur ? "__custom" : isPresetDuration(d.duration) ? d.duration : undefined}
                onChange={(v) => {
                  if (v === "__custom") {
                    setCustomDur(true);
                    set("duration", "");
                  } else {
                    setCustomDur(false);
                    set("duration", (v as string | undefined) ?? "");
                  }
                }}
              />
              {customDur && (
                <Input value={d.duration} onChange={(e) => set("duration", e.target.value)} placeholder="Eg. 10 Days, 3 Months" autoFocus />
              )}
            </div>
          </Field>
          <Field label="Special">
            <Chips options={SPECIALS} value={d.special} onChange={(v) => set("special", v as string | undefined)} />
          </Field>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={add}>
              Add
            </Button>
          </div>
          <Added
            items={list}
            label={(m) => `${medName(m)} ${doseLabel(m)}`}
            sub={scheduleLabel}
            onRemove={(i) => setList((l) => l.filter((_, j) => j !== i))}
          />
          {summaryOption && (
            <div className="border-t pt-3">
              <Check checked={flag} onChange={setFlag}>
                <span className="font-medium">Add it in Medication</span>
              </Check>
              <p className="mt-1 pl-[22px] text-[12px] text-muted-foreground">
                Also lists these under Patient Summary, Medications.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave(list, flag)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Lab / Diagnostic Test picker. Same Add-then-Save shape as medications. */
export function LabTestDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: DiagnosisTest[];
  onSave: (list: DiagnosisTest[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  function add() {
    if (!name) return toast.error("Select a test.");
    setList((l) => [...l, { name, notes: notes.trim() || undefined }]);
    setName("");
    setNotes("");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lab / Diagnostic Test</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <SelectField label="Test Name" value={name} onValueChange={setName} placeholder="Select Test" options={LAB_TESTS} />
          <TextAreaField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any notes or instructions..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={add}>
              Add
            </Button>
          </div>
          <Added items={list} label={(t) => t.name} sub={(t) => t.notes} onRemove={(i) => setList((l) => l.filter((_, j) => j !== i))} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave(list)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children, priv }: { title: string; children: ReactNode; priv?: boolean }) {
  return (
    <section>
      <h3 className="mb-1 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
        {priv && <Lock className="size-3" aria-label="Doctor only" />}
      </h3>
      <div className="text-sm">{children}</div>
    </section>
  );
}

/** Read-only view of one diagnosis, opened from its card. */
export function DiagnosisDetail({ d, onClose }: { d: Diagnosis | null; onClose: () => void }) {
  return (
    <Dialog open={!!d} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-5 overflow-y-auto rounded-none border-0 p-6">
        {d && (
          <>
            <DialogHeader>
              <div className="text-[12px] text-muted-foreground">Chief Complaint</div>
              <DialogTitle>{d.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                <span>{format(new Date(d.date), "d MMM yyyy")}</span>
                <span>·</span>
                <span>{d.recordedBy}</span>
                <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
                {d.code && <span className="font-mono text-[12px]">{d.code}</span>}
              </div>
            </DialogHeader>

            <div className="grid gap-5 md:grid-cols-[1fr_200px]">
              <div className="flex flex-col gap-4">
                <Section title="Clinical Notes">{d.notes || <span className="text-muted-foreground">None.</span>}</Section>
                <Section title="Medication and Dosage">
                  {d.medications?.length ? (
                    <ul className="flex flex-col divide-y rounded-md border">
                      {d.medications.map((m, i) => (
                        <li key={i} className="px-3 py-2">
                          <div className="font-medium">
                            {medName(m)} {doseLabel(m)}
                          </div>
                          <div className="text-[12px] text-muted-foreground">{scheduleLabel(m)}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">None prescribed.</span>
                  )}
                </Section>
                <Section title="Lab / Diagnostic Test">
                  {d.tests?.length ? (
                    <ul className="flex flex-col divide-y rounded-md border">
                      {d.tests.map((t, i) => (
                        <li key={i} className="px-3 py-2">
                          <div className="font-medium">{t.name}</div>
                          {t.notes && <div className="text-[12px] text-muted-foreground">{t.notes}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">None ordered.</span>
                  )}
                </Section>
                {d.followUpDate && <Section title="Follow-up">{formatFollowUp(d.followUpDate)}</Section>}
                <Section title="Doctor's Notes" priv>
                  {d.doctorNotes || <span className="text-muted-foreground">None.</span>}
                </Section>
              </div>

              <Section title="Vitals">
                <dl className="flex flex-col gap-1.5 rounded-md border px-3 py-2">
                  {VITAL_FIELDS.map((v) => (
                    <div key={v.key} className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{v.label}</dt>
                      <dd className="font-medium tabular-nums">
                        {d.vitals?.[v.key] ? `${d.vitals[v.key]} ${v.unit}` : "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
            </div>

            <DialogFooter className="mt-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
