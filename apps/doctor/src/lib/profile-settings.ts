import type { Clinic, ClinicOperatingDay } from "@/types";

export interface LinkedClinic {
  id: string;
  name: string;
  address: string;
  principal: string;
  role: "owner" | "member";
  status: "pending" | "approved";
  hours: ClinicOperatingDay[];
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
