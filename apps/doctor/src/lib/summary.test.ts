import assert from "node:assert/strict";
import { filterSummaryRows, SUMMARY_TABS } from "./summary";

const rows = [
  { id: "1", mid: "M1", name: "Type 2 Diabetes", bodySite: "Endocrine", diagnosedOn: "2021-03-14" },
  { id: "2", mid: "M1", name: "Hypertension", bodySite: "Cardiovascular", diagnosedOn: "2022-08-02" },
];

assert.equal(filterSummaryRows(rows, "").length, 2, "empty query keeps all");
assert.equal(filterSummaryRows(rows, "  ").length, 2, "blank query keeps all");
assert.deepEqual(filterSummaryRows(rows, "cardio").map((r) => r.id), ["2"], "matches any field, case-insensitive");
assert.equal(filterSummaryRows(rows, "M1").length, 0, "mid is not searchable");
assert.equal(filterSummaryRows(rows, "2021").length, 1, "dates are searchable as text");

for (const t of SUMMARY_TABS) {
  assert.ok(t.fields.some((f) => f.required), `${t.kind} has a required field`);
  for (const f of t.fields) if (f.type === "select") assert.ok(f.options?.length, `${t.kind}.${f.key} select has options`);
}

console.log("summary.test.ts ok");
