import type { DiagnosisMedication, DiagnosisVitals, SummaryRow, Vital } from "@/types";

// ponytail: seeded catalogues; swap for an API-backed list once the backend has one
export const MEDICATIONS = [
  "Amlodipine",
  "Amoxicillin",
  "Amoxicillin-Clavulanate",
  "Atorvastatin",
  "Azithromycin",
  "Cetirizine",
  "Ciprofloxacin",
  "Diclofenac",
  "Domperidone",
  "Doxycycline",
  "Ibuprofen",
  "Levocetirizine",
  "Levothyroxine",
  "Losartan",
  "Metformin",
  "Metronidazole",
  "Montelukast",
  "Omeprazole",
  "Ondansetron",
  "Pantoprazole",
  "Paracetamol",
  "Prednisolone",
  "Salbutamol",
  "Telmisartan",
  "Vitamin D3",
];
export const UNITS = ["Mg", "Ml", "Mcg", "IU", "Tablet", "Drops"];
export const TIMES = ["Morning", "Afternoon", "Evening", "Night"];
export const INSTRUCTIONS = ["Before Food", "After Food", "With Food", "Empty Stomach", "At Bedtime"];
export const MED_FORMS = ["TAB", "CAP", "GEL", "ORA", "INJ", "SYR", "DRP", "CRM", "OIN"];
export const FREQUENCIES = ["Once", "Twice", "Thrice"];
/** Chip label -> stored value. Chips stay short; the Rx reads the full word. */
export const TIME_CHIPS: { label: string; value: string }[] = [
  { label: "Morn", value: "Morning" },
  { label: "After", value: "Afternoon" },
  { label: "Eve", value: "Evening" },
  { label: "Nig", value: "Night" },
];
export const DURATION_CHIPS: { label: string; value: string }[] = [
  { label: "1d", value: "1 Day" },
  { label: "2d", value: "2 Days" },
  { label: "3d", value: "3 Days" },
  { label: "4d", value: "4 Days" },
  { label: "5d", value: "5 Days" },
  { label: "1w", value: "1 Week" },
  { label: "2w", value: "2 Weeks" },
  { label: "3w", value: "3 Weeks" },
  { label: "4w", value: "4 Weeks" },
];
export const SPECIALS = ["SOS", "Till required", "To continue"];
export const LAB_TESTS = [
  "CT Scan",
  "MRI",
  "X-Ray",
  "Ultrasound",
  "ECG",
  "Echocardiogram",
  "CBC",
  "LFT",
  "KFT",
  "Lipid Profile",
  "HbA1c",
  "Fasting Blood Glucose",
  "Thyroid Profile",
  "Urine Routine",
  "Vitamin D",
  "Vitamin B12",
  "Serum Electrolytes",
  "CRP",
  "ESR",
  "Dengue NS1",
  "Malaria Antigen",
  "COVID-19 RT-PCR",
];

/** The six vitals on the New Diagnosis form, in display order. */
export const VITAL_FIELDS: { key: keyof DiagnosisVitals; label: string; unit: string }[] = [
  { key: "temperature", label: "Body Temp", unit: "°C" },
  { key: "heartRate", label: "Heart Rate", unit: "bpm" },
  { key: "respRate", label: "Resp Rate", unit: "/min" },
  { key: "bloodPressure", label: "Blood Press.", unit: "mmHg" },
  { key: "spo2", label: "SpO2", unit: "%" },
  { key: "weight", label: "Weight", unit: "kg" },
];

/** "TAB Paracetamol" or just "Paracetamol". */
export const medName = (m: DiagnosisMedication) => [m.form, m.name].filter(Boolean).join(" ");
export const doseLabel = (m: DiagnosisMedication) => [m.amount, m.unit].filter(Boolean).join(" ");
export const scheduleLabel = (m: DiagnosisMedication) =>
  [m.frequency && `${m.frequency} a day`, m.times.join(", "), m.duration, m.instructions, m.special].filter(Boolean).join(" · ");

/** Shape a prescribed medication as a Patient Summary, Medications row. */
export function medicationToSummaryRow(m: DiagnosisMedication, mid: string, date: string): Omit<SummaryRow, "id"> {
  return { mid, name: m.name, dose: doseLabel(m), frequency: scheduleLabel(m), startedOn: date };
}

/** Turn the vitals typed on a diagnosis into health-data records. Blank or
 *  unparseable entries are skipped rather than failing the whole save. */
export function vitalsToRecords(v: DiagnosisVitals | undefined, mid: string, recordDate: string): Omit<Vital, "id">[] {
  if (!v) return [];
  const out: Omit<Vital, "id">[] = [];
  const num = (s?: string) => {
    const t = (s ?? "").trim();
    const n = Number(t);
    return t && Number.isFinite(n) ? n : null;
  };
  const scalar: [keyof DiagnosisVitals, Vital["type"], string][] = [
    ["temperature", "temperature", "°C"],
    ["heartRate", "heart_rate", "bpm"],
    ["respRate", "resp_rate", "/min"],
    ["spo2", "spo2", "%"],
    ["weight", "weight", "kg"],
  ];
  for (const [key, type, unit] of scalar) {
    const n = num(v[key]);
    if (n != null) out.push({ mid, type, value: n, unit, recordDate });
  }
  const bp = (v.bloodPressure ?? "").match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);
  if (bp) {
    out.push({ mid, type: "blood_pressure", value: { systolic: Number(bp[1]), diastolic: Number(bp[2]) }, unit: "mmHg", recordDate });
  }
  return out;
}

/** The follow-up the API stores: the date, plus "THH:mm" only when a time was
 *  picked. Undefined when the box is not ticked. */
export function followUpValue(v: { followUp: boolean; followUpOn: string; followUpAt: string }): string | undefined {
  if (!v.followUp || !v.followUpOn) return undefined;
  return v.followUpAt ? `${v.followUpOn}T${v.followUpAt}` : v.followUpOn;
}
