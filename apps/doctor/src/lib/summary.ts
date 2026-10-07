import { SEVERITY_OPTIONS } from "@myanodex/shared/constants";
import type { SummaryKind, SummaryRow } from "@/types";

/** One column of a summary sub-tab. Doubles as the field spec for its Add form. */
export interface SummaryField {
  key: string;
  label: string;
  type?: "text" | "date" | "select";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
}

export interface SummaryTab {
  kind: SummaryKind;
  label: string;
  noun: string; // "condition" -> "Add condition", "Condition added."
  fields: SummaryField[];
}

/** The five Patient Summary sub-tabs. Columns and Add-form fields come from here,
 *  so a new tab or column is one entry, not a new component. */
export const SUMMARY_TABS: SummaryTab[] = [
  {
    kind: "conditions",
    label: "Active Conditions",
    noun: "condition",
    fields: [
      { key: "name", label: "Condition", required: true, placeholder: "e.g. Type 2 Diabetes Mellitus" },
      { key: "bodySite", label: "Body Site", placeholder: "Optional" },
      { key: "diagnosedOn", label: "Diagnosed", type: "date" },
    ],
  },
  {
    kind: "medications",
    label: "Medications",
    noun: "medication",
    fields: [
      { key: "name", label: "Medicine", required: true, placeholder: "e.g. Metformin" },
      { key: "dose", label: "Dose", placeholder: "e.g. 500mg" },
      { key: "frequency", label: "Frequency", placeholder: "e.g. BD" },
      { key: "startedOn", label: "Started", type: "date" },
    ],
  },
  {
    kind: "allergies",
    label: "Allergies",
    noun: "allergy",
    fields: [
      { key: "allergen", label: "Allergen", required: true, placeholder: "e.g. Penicillin" },
      { key: "reaction", label: "Reaction", placeholder: "e.g. Rash" },
      { key: "severity", label: "Severity", type: "select", options: SEVERITY_OPTIONS },
      { key: "notedOn", label: "Noted", type: "date" },
    ],
  },
  {
    kind: "procedures",
    label: "Major Procedures",
    noun: "procedure",
    fields: [
      { key: "name", label: "Procedure", required: true, placeholder: "e.g. Appendectomy" },
      { key: "hospital", label: "Hospital", placeholder: "Optional" },
      { key: "date", label: "Date", type: "date" },
    ],
  },
  {
    kind: "history",
    label: "Family / Social HX",
    noun: "history entry",
    fields: [
      { key: "type", label: "Type", type: "select", options: ["Family", "Social"] },
      { key: "relation", label: "Relation / Habit", placeholder: "e.g. Father, Smoking" },
      { key: "details", label: "Details", required: true, placeholder: "e.g. Type 2 diabetes" },
      { key: "notedOn", label: "Noted", type: "date" },
    ],
  },
];

/** Free-text filter over every visible field of a summary row. */
export function filterSummaryRows(rows: SummaryRow[], q: string): SummaryRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) =>
    Object.entries(r).some(([k, v]) => k !== "id" && k !== "mid" && v.toLowerCase().includes(s))
  );
}
