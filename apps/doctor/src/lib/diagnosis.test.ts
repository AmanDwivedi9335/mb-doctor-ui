import assert from "node:assert/strict";
import { vitalsToRecords, medicationToSummaryRow, medName, MEDICATIONS, LAB_TESTS, followUpValue } from "./diagnosis";
import { formatFollowUp, hasTime } from "./dates";

const recs = vitalsToRecords(
  { temperature: "36.9", heartRate: " 72 ", respRate: "", bloodPressure: "120/80", spo2: "abc", weight: "68" },
  "M1",
  "2026-08-23"
);
assert.deepEqual(
  recs.map((r) => r.type),
  ["temperature", "heart_rate", "weight", "blood_pressure"],
  "blank and junk skipped, BP parsed"
);
assert.deepEqual(recs.find((r) => r.type === "blood_pressure")?.value, { systolic: 120, diastolic: 80 });
assert.equal(vitalsToRecords(undefined, "M1", "2026-08-23").length, 0, "no vitals = no records");
assert.equal(vitalsToRecords({ bloodPressure: "120" }, "M1", "2026-08-23").length, 0, "BP needs sys/dia");

const row = medicationToSummaryRow(
  { name: "Paracetamol", amount: "500", unit: "Mg", times: ["Morning", "Night"], duration: "5 Days", instructions: "After Food" },
  "M1",
  "2026-08-23"
);
assert.equal(row.dose, "500 Mg");
assert.equal(row.frequency, "Morning, Night · 5 Days · After Food");
assert.equal(row.startedOn, "2026-08-23");

const full = medicationToSummaryRow(
  { name: "Pantoprazole", form: "TAB", amount: "40", unit: "Mg", frequency: "Once", times: ["Morning"], duration: "2 Weeks", instructions: "Empty Stomach", special: "To continue" },
  "M1",
  "2026-08-23"
);
assert.equal(full.frequency, "Once a day · Morning · 2 Weeks · Empty Stomach · To continue");
assert.equal(medName({ name: "Pantoprazole", form: "TAB", amount: "", unit: "", times: [], duration: "", instructions: "" }), "TAB Pantoprazole");
assert.equal(medName({ name: "Pantoprazole", amount: "", unit: "", times: [], duration: "", instructions: "" }), "Pantoprazole");

assert.ok(MEDICATIONS.length > 10, "medication catalogue seeded");
assert.ok(LAB_TESTS.includes("MRI") && LAB_TESTS.includes("CT Scan"), "lab catalogue has imaging");

// Follow-up: unticked = nothing sent; time is optional.
assert.equal(followUpValue({ followUp: false, followUpOn: "2026-09-30", followUpAt: "10:30" }), undefined, "unticked sends nothing");
assert.equal(followUpValue({ followUp: true, followUpOn: "", followUpAt: "10:30" }), undefined, "no date, no follow-up");
assert.equal(followUpValue({ followUp: true, followUpOn: "2026-09-30", followUpAt: "" }), "2026-09-30", "date only");
assert.equal(followUpValue({ followUp: true, followUpOn: "2026-09-30", followUpAt: "10:30" }), "2026-09-30T10:30", "date + time");
assert.ok(hasTime("2026-09-30T10:30") && !hasTime("2026-09-30") && !hasTime("2026-09-30T00:00:00.000Z"), "only a doctor-picked time counts");
assert.equal(formatFollowUp("2026-09-30"), "30 Sep 2026", "date only, local day");
assert.equal(formatFollowUp("2026-09-30T10:30"), "30 Sep 2026, 10:30 AM", "date + time");

console.log("diagnosis.test.ts ok");
