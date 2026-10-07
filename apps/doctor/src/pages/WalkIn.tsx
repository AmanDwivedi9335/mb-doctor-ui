import { useState } from "react";
import { Printer, UserPlus, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { format } from "date-fns";
import { GENDER_OPTIONS } from "@myanodex/shared/constants";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useClinicProfile, useCreateWalkIn } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { todayKey, formatFollowUp } from "@/lib/dates";
import { ApiError } from "@myanodex/shared/api-client";
import { VITAL_FIELDS, medName, doseLabel, scheduleLabel, followUpValue } from "@/lib/diagnosis";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import { DiagnosisForm, type DiagnosisFormValues } from "@/pages/patient/DiagnosisForm";
import type { Gender, WalkIn as WalkInRecord } from "@/types";

// Plain object literal, not the interface: useForm needs an index-signature-compatible type.
const blankPatient = () => ({ name: "", dob: "", gender: "Male" as Gender, phone: "" });

/** Consultation for a patient without a MediBank ID: capture who they are,
 *  fill the same diagnosis form, hand them a printed prescription. Nothing is
 *  stored against a MID; the visit shows up in /history like any other. */
export function WalkIn() {
  const { f: p, setF: setP } = useForm(blankPatient());
  const create = useCreateWalkIn();
  const [rx, setRx] = useState<WalkInRecord | null>(null);

  async function save(d: DiagnosisFormValues) {
    if (!p.name.trim()) return void toast.error("Patient name is required.");
    if (!p.dob) return void toast.error("Date of birth is required.");
    if (p.dob > todayKey()) return void toast.error("Date of birth cannot be in the future.");
    // The server does the real check (Indian 10-digit, or + country code).
    if (p.phone.replace(/\D/g, "").length < 10) return void toast.error("Enter the patient's mobile number.");
    const patient = { name: p.name.trim(), dob: p.dob, gender: p.gender, phone: p.phone.trim() };
    try {
      const created = await create.mutateAsync({
        patient,
        diagnosis: {
          name: d.name,
          code: d.code || undefined,
          status: d.status,
          date: d.date,
          notes: d.notes || undefined,
          doctorNotes: d.doctorNotes || undefined,
          medications: d.medications,
          tests: d.tests,
          vitals: d.vitals,
          followUpDate: followUpValue(d),
        },
      });
      setRx(created);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save. Try again.");
    }
  }

  if (rx) return <Prescription rx={rx} onBack={() => setRx(null)} backLabel="New walk-in" />;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground">
            <UserPlus className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Walk-in patient</h2>
            <p className="text-[13px] text-muted-foreground">
              No MID needed. Fill in who they are and what you prescribe, then print the Rx.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_140px_1fr]">
          <TextField label="Patient name" value={p.name} onChange={(e) => setP("name", e.target.value)} placeholder="Full name" autoFocus />
          <TextField label="Date of birth" type="date" max={todayKey()} value={p.dob} onChange={(e) => setP("dob", e.target.value)} />
          <SelectField label="Gender" value={p.gender} onValueChange={(v) => setP("gender", v as Gender)} options={GENDER_OPTIONS} />
          <TextField label="Mobile" value={p.phone} onChange={(e) => setP("phone", e.target.value)} placeholder="10-digit mobile" inputMode="tel" required />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="mb-4 text-[15px] font-semibold">Consultation</h3>
        <DiagnosisForm onSubmit={save} pending={create.isPending} submitLabel="Save and print Rx" summaryOption={false} />
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="text-[13px]">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/** The printable sheet. Clinic letterhead from the clinic profile, doctor from
 *  the session, then the patient and what was prescribed. Doctor's notes are
 *  deliberately left off: they are for the doctor, not the patient. */
export function Prescription({ rx, onBack, backLabel }: { rx: WalkInRecord; onBack: () => void; backLabel: string }) {
  const { user, activeClinicId } = useAuth();
  // Personal scope (no active clinic) prints the practice from onboarding; /clinic/profile is pro + clinic only.
  const { data: clinic } = useClinicProfile(!!activeClinicId);
  const d = rx.diagnosis;
  const vitals = VITAL_FIELDS.filter((v) => d.vitals?.[v.key]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {backLabel}
        </button>
        <Button onClick={() => window.print()}>
          <Printer /> Print
        </Button>
      </div>

      <article className="print-sheet rounded-lg border bg-card p-8 text-foreground">
        <header className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <div className="text-lg font-semibold leading-tight">{clinic?.name ?? user?.practice?.name ?? "Clinic"}</div>
            {clinic?.address && <div className="mt-1 text-[12.5px] text-muted-foreground">{clinic.address}</div>}
            <div className="text-[12.5px] text-muted-foreground">
              {[clinic?.receptionMobile, clinic?.website].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{rx.recordedBy}</div>
            {user?.specialization && <div className="text-[12.5px] text-muted-foreground">{user.specialization}</div>}
            <div className="mt-1 text-[12.5px] text-muted-foreground">{format(new Date(d.date), "d MMM yyyy")}</div>
          </div>
        </header>

        <section className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <Line label="Patient" value={rx.patient.name} />
          <Line label="Age / Sex" value={`${rx.patient.age} / ${rx.patient.gender}`} />
          <Line label="Mobile" value={rx.patient.phone} />
          <Line label="Ref" value={rx.id} />
        </section>

        {vitals.length > 0 && (
          <section className="mt-4 flex flex-wrap gap-x-5 gap-y-1 rounded-md bg-secondary/60 px-3 py-2 text-[13px]">
            {vitals.map((v) => (
              <span key={v.key}>
                <span className="text-muted-foreground">{v.label} </span>
                <span className="font-medium tabular-nums">
                  {d.vitals?.[v.key]} {v.unit}
                </span>
              </span>
            ))}
          </section>
        )}

        <section className="mt-5">
          <div className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Diagnosis</div>
          <div className="mt-1 text-[15px] font-semibold">
            {d.name}
            {d.code && <span className="ml-2 font-mono text-[12px] font-normal text-muted-foreground">{d.code}</span>}
          </div>
          {d.notes && <p className="mt-1 text-[13px]">{d.notes}</p>}
        </section>

        <section className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold italic">Rx</span>
            <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Medication</span>
          </div>
          {d.medications?.length ? (
            <ol className="mt-2 flex flex-col divide-y rounded-md border">
              {d.medications.map((m, i) => (
                <li key={i} className="flex items-baseline gap-3 px-3 py-2">
                  <span className="w-5 text-[12px] tabular-nums text-muted-foreground">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {medName(m)} {doseLabel(m)}
                    </div>
                    <div className="text-[12.5px] text-muted-foreground">{scheduleLabel(m)}</div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-1 text-[13px] text-muted-foreground">No medication prescribed.</p>
          )}
        </section>

        {d.tests && d.tests.length > 0 && (
          <section className="mt-5">
            <div className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Investigations</div>
            <ul className="mt-1 flex flex-col gap-0.5 text-[13px]">
              {d.tests.map((t, i) => (
                <li key={i}>
                  <span className="font-medium">{t.name}</span>
                  {t.notes && <span className="text-muted-foreground"> · {t.notes}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.followUpDate && (
          <section className="mt-5 text-[13px]">
            <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Follow-up: </span>
            <span className="font-semibold">{formatFollowUp(d.followUpDate)}</span>
          </section>
        )}

        <footer className="mt-10 flex items-end justify-between border-t pt-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            Generated by <Logo className="h-4" />
          </span>
          <div className="text-right">
            <div className="mb-8 w-48 border-b border-foreground/40" />
            <div>{rx.recordedBy}</div>
            <div>Signature</div>
          </div>
        </footer>
      </article>
    </div>
  );
}
