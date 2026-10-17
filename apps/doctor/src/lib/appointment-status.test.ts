import assert from "node:assert/strict";
import type { Appointment, Clinic } from "@/types";
import { APPOINTMENT_STATUS_OPTIONS, appointmentUiStatus } from "./appointment-status";

const appointment: Appointment = { id: "a1", patientName: "Patient", time: "2026-10-19T10:00:00", status: "waiting", reason: "Follow-up" };
const clinic = { operatingHoursStart: "09:00", operatingHoursEnd: "18:00", operatingHours: [], temporaryHours: [] } as unknown as Clinic;
const at = (time: string) => new Date(`2026-10-19T${time}+05:30`);
assert.equal(appointmentUiStatus(appointment, at("09:00:00"), clinic), "Upcoming");
assert.equal(appointmentUiStatus(appointment, at("11:00:00"), clinic), "Upcoming");
assert.equal(appointmentUiStatus(appointment, at("11:00:01"), clinic), "Past Due");
assert.equal(appointmentUiStatus(appointment, at("18:00:00"), clinic), "Past Due");
assert.equal(appointmentUiStatus(appointment, at("18:00:01"), clinic), "Missed");
assert.equal(appointmentUiStatus({ ...appointment, time: "2026-10-19T04:30:00Z" }, at("11:00:01"), clinic), "Past Due");
assert.equal(appointmentUiStatus({ ...appointment, status: "in-progress" }, at("10:30:00"), clinic), "In Clinic");
assert.equal(appointmentUiStatus({ ...appointment, status: "in-progress" }, at("18:01:00"), clinic), "Missed");
for (const [status, expected] of [["completed", "Completed"], ["cancelled", "Cancelled / No Show"]] as const) {
  assert.equal(appointmentUiStatus({ ...appointment, status }, at("21:00:00"), clinic), expected);
}
for (const status of APPOINTMENT_STATUS_OPTIONS) {
  assert.equal(appointmentUiStatus(appointment, at("21:00:00"), clinic, { status, appointmentTime: appointment.time }), status);
}
for (const status of ["Completed", "Cancelled / No Show", "Rescheduled", "Missed"] as const) {
  assert.equal(appointmentUiStatus({ ...appointment, time: "2026-10-19T11:00:00" }, at("21:00:00"), clinic, { status, appointmentTime: appointment.time }), status);
}
assert.equal(appointmentUiStatus({ ...appointment, time: "2026-10-19T12:00:00" }, at("11:30:00"), clinic, { status: "Past Due", appointmentTime: appointment.time }), "Upcoming");
assert.equal(appointmentUiStatus(appointment, at("21:00:00")), "Past Due"); // No invented closing time when clinic is unavailable.
const temporary = { ...clinic, temporaryHours: [{ id: "hours", start: "2026-10-19", end: "2026-10-19", opens: "09:00", closes: "12:00", closed: false }] } as Clinic;
assert.equal(appointmentUiStatus(appointment, at("12:00:01"), temporary), "Missed");
const weekly = { ...clinic, operatingHours: [{ day: "monday", opens: "09:00", closes: "13:00", closed: false }] } as Clinic;
assert.equal(appointmentUiStatus(appointment, at("13:00:01"), weekly), "Missed");
assert.equal(appointmentUiStatus(appointment, new Date("2026-10-20T00:01:00+05:30"), clinic), "Missed");
assert.equal(appointmentUiStatus({ ...appointment, time: "invalid" }, at("10:00:00"), clinic), "Upcoming");
console.log("Appointment UI status boundaries, clinic hours, timezone and manual terminal overrides pass.");
