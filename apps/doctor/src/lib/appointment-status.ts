import type { Appointment, Clinic } from "@/types";
import { clinicHoursOn, clinicToday } from "./profile-settings";

export const APPOINTMENT_STATUS_OPTIONS = [
  "Upcoming", "In Clinic", "Past Due", "Completed", "Missed / No Show", "Rescheduled", "Cancelled",
] as const;
export type AppointmentUiStatus = typeof APPOINTMENT_STATUS_OPTIONS[number];
export type ManualAppointmentStatus = { status: AppointmentUiStatus; appointmentTime: string };
const terminal = new Set<AppointmentUiStatus>(["Completed", "Cancelled", "Rescheduled", "Missed / No Show"]);
export const appointmentStatusVariant = {
  Upcoming: "primary", "In Clinic": "success", "Past Due": "warning", Completed: "success",
  Cancelled: "default", Rescheduled: "outline", "Missed / No Show": "danger",
} as const;

// UI-only policy for the Indian clinic timezone. Replace this adapter when server statuses are available.
export function appointmentUiStatus(
  appointment: Appointment,
  now = new Date(),
  clinic?: Clinic,
  manual?: ManualAppointmentStatus,
): AppointmentUiStatus {
  // Explicit choices remain authoritative; a changed appointment time releases nonterminal overrides.
  // Preserve selections saved in browsers before the status labels changed.
  const savedStatus = manual?.status as string | undefined;
  const manualStatus = (savedStatus === "Missed" ? "Missed / No Show"
    : savedStatus === "Cancelled / No Show" ? "Cancelled" : savedStatus) as AppointmentUiStatus | undefined;
  if (manual && manualStatus && APPOINTMENT_STATUS_OPTIONS.includes(manualStatus) &&
      (manual.appointmentTime === appointment.time || terminal.has(manualStatus))) return manualStatus;
  if (appointment.status === "completed") return "Completed";
  if (appointment.status === "cancelled") return "Cancelled";
  const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/.test(appointment.time)
    ? appointment.time : `${appointment.time}+05:30`;
  const start = new Date(timestamp);
  if (!Number.isFinite(start.getTime())) return "Upcoming";
  if (clinic) {
    const day = clinicToday(start);
    const hours = clinicHoursOn(clinic, day);
    const close = new Date(`${day}T${hours.closes}:00+05:30`);
    if ((hours.closed && clinicToday(now) >= day) || now > close) return "Missed / No Show";
  }
  if (appointment.status === "in-progress") return "In Clinic";
  return now.getTime() > start.getTime() + 60 * 60 * 1000 ? "Past Due" : "Upcoming";
}
