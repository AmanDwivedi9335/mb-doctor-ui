import assert from "node:assert";
import { filterDiagnoses, emptyDiagnosisFilter, filterHistory, emptyHistoryFilter } from "./filters.ts";
import type { Diagnosis, ConsultationEntry } from "@/types";

const items: Diagnosis[] = [
  { id: "1", mid: "M1", name: "Type 2 Diabetes Mellitus", code: "E11.9", status: "Confirmed", date: "2026-01-01", recordedBy: "Dr. A" },
  { id: "2", mid: "M1", name: "Essential Hypertension", code: "I10", status: "Suspected", date: "2026-02-01", recordedBy: "Dr. A" },
  { id: "3", mid: "M1", name: "Iron deficiency anaemia", code: "D50.9", status: "To Rule Out", date: "2026-03-01", recordedBy: "Dr. A" },
];

// no filter returns everything
assert.equal(filterDiagnoses(items, emptyDiagnosisFilter).length, 3);

// text matches name (case-insensitive)
assert.deepEqual(filterDiagnoses(items, { q: "diabetes", status: "all" }).map((d) => d.id), ["1"]);

// text matches ICD code
assert.deepEqual(filterDiagnoses(items, { q: "i10", status: "all" }).map((d) => d.id), ["2"]);

// status narrows
assert.deepEqual(filterDiagnoses(items, { q: "", status: "Confirmed" }).map((d) => d.id), ["1"]);

// combined: status + text, no match
assert.equal(filterDiagnoses(items, { q: "diabetes", status: "Suspected" }).length, 0);

const history: ConsultationEntry[] = [
  { id: "h1", date: "2026-08-20", patientName: "Priya Sharma", patientMeta: "42 / Female", phone: "9040012345", mid: "22052661001002", complaint: "Type 2 Diabetes", medications: ["Metformin"], recordedBy: "Dr. A" },
  { id: "h2", date: "2026-08-22", patientName: "Meena Rao", patientMeta: "30 / Female", complaint: "Migraine", medications: ["Ibuprofen"], recordedBy: "Dr. A" },
  { id: "h3", date: "2026-08-23", patientName: "Arjun S", patientMeta: "8 / Male", complaint: "Fever with cough", medications: [], recordedBy: "Dr. A" },
];

assert.equal(filterHistory(history, emptyHistoryFilter).length, 3);
// text over name, MID, mobile, complaint
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, q: "meena" }).map((e) => e.id), ["h2"]);
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, q: "2205266" }).map((e) => e.id), ["h1"]);
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, q: "90400" }).map((e) => e.id), ["h1"]);
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, q: "fever" }).map((e) => e.id), ["h3"]);
// kind
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, kind: "mid" }).map((e) => e.id), ["h1"]);
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, kind: "walk-in" }).map((e) => e.id), ["h2", "h3"]);
// date range, inclusive both ends
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, from: "2026-08-22" }).map((e) => e.id), ["h2", "h3"]);
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, to: "2026-08-22" }).map((e) => e.id), ["h1", "h2"]);
assert.deepEqual(filterHistory(history, { ...emptyHistoryFilter, from: "2026-08-22", to: "2026-08-22" }).map((e) => e.id), ["h2"]);
// combined, no match
assert.equal(filterHistory(history, { ...emptyHistoryFilter, q: "fever", kind: "mid" }).length, 0);

console.log("filters.test.ts ok");
