import type { Appointment, Clinic } from "@/types";
import { clinicHoursOn, clinicToday } from "./profile-settings";

export const APPOINTMENT_STATUS_OPTIONS = [
  "Upcoming", "In Clinic", "Past Due", "Completed", "Cancelled / No Show", "Rescheduled", "Missed",
] as const;
export type AppointmentUiStatus = typeof APPOINTMENT_STATUS_OPTIONS[number];
export type ManualAppointmentStatus = { status: AppointmentUiStatus; appointmentTime: string };
const terminal = new Set<AppointmentUiStatus>(["Completed", "Cancelled / No Show", "Rescheduled", "Missed"]);
export const appointmentStatusVariant = {
  Upcoming: "primary", "In Clinic": "success", "Past Due": "warning", Completed: "success",
  "Cancelled / No Show": "default", Rescheduled: "outline", Missed: "danger",
} as const;

// UI-only policy for the Indian clinic timezone. Replace this adapter when server statuses are available.
export function appointmentUiStatus(
  appointment: Appointment,
  now = new Date(),
  clinic?: Clinic,
  manual?: ManualAppointmentStatus,
): AppointmentUiStatus {
  // Explicit choices remain authoritative; a changed appointment time releases nonterminal overrides.
  if (manual && APPOINTMENT_STATUS_OPTIONS.includes(manual.status) &&
      (manual.appointmentTime === appointment.time || terminal.has(manual.status))) return manual.status;
  if (appointment.status === "completed") return "Completed";
  if (appointment.status === "cancelled") return "Cancelled / No Show";
  const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/.test(appointment.time)
    ? appointment.time : `${appointment.time}+05:30`;
  const start = new Date(timestamp);
  if (!Number.isFinite(start.getTime())) return "Upcoming";
  if (clinic) {
    const day = clinicToday(start);
    const hours = clinicHoursOn(clinic, day);
    const close = new Date(`${day}T${hours.closes}:00+05:30`);
    if ((hours.closed && clinicToday(now) >= day) || now > close) return "Missed";
  }
  if (appointment.status === "in-progress") return "In Clinic";
  return now.getTime() > start.getTime() + 60 * 60 * 1000 ? "Past Due" : "Upcoming";
}
