import type { Clinic, ClinicNotice, ClinicOperatingDay } from "@/types";

export interface LinkedClinic {
  city?: string;
  state?: string;
  id: string;
  name: string;
  address: string;
  principal: string;
  role: "owner" | "member";
  status: "pending" | "approved";
  hours: ClinicOperatingDay[];
  notices?: ClinicNotice[];
}
export interface ClinicRequest {
  id: string;
  clinicId: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
}
export interface AccountPreferencesData {
  mfaEnabled: boolean;
  inactivityMinutes: number;
  language: "en";
  referralLink: string;
}
export const validTemporaryHours = (
  entries: {
    start: string;
    end: string;
    closed: boolean;
    opens: string;
    closes: string;
  }[],
) =>
  entries.every(
    (e) =>
      e.start &&
      e.end &&
      e.start <= e.end &&
      (e.closed || (e.opens && e.closes && e.opens < e.closes)),
  ) &&
  entries.every((e, i) =>
    entries.every(
      (other, j) => i === j || e.end < other.start || e.start > other.end,
    ),
  );

export function clinicHoursOn(clinic: Clinic, date: string) {
  const temporary = clinic.temporaryHours?.find(
    (entry) => entry.start <= date && date <= entry.end,
  );
  if (temporary) return temporary;
  const day = (
    [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const
  )[new Date(`${date}T12:00:00`).getDay()];
  return (
    clinic.operatingHours?.find((entry) => entry.day === day) ?? {
      closed: false,
      opens: clinic.operatingHoursStart,
      closes: clinic.operatingHoursEnd,
    }
  );
}

/** Clinic date ranges use the portal's Indian clinic timezone, including both end dates. */
export function clinicToday(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
const validDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(Date.parse(`${date}T00:00:00Z`)) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
export function validClinicNotices(notices: ClinicNotice[]) {
  return (
    Array.isArray(notices) &&
    notices.every(
      (n) =>
        n &&
        typeof n.id === "string" &&
        n.id.trim() &&
        typeof n.note === "string" &&
        n.note.trim() &&
        validDate(n.start) &&
        validDate(n.end) &&
        n.start <= n.end,
    ) &&
    new Set(notices.map((n) => n.id)).size === notices.length
  );
}
export function activeClinicNotices(
  notices: ClinicNotice[] = [],
  date = clinicToday(),
) {
  return notices
    .filter((n) => n.start <= date && date <= n.end && n.note.trim())
    .sort((a, b) => a.start.localeCompare(b.start));
}
