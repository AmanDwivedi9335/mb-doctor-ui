import { format } from "date-fns";

/** Today as "YYYY-MM-DD" in the LOCAL calendar (toISOString is UTC: a day behind before 05:30 IST). */
export function todayKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole years between an ISO date of birth and `now`. Null for junk input. */
export function ageFrom(dob: string, now: string | Date = new Date()): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const n = new Date(now);
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return age;
}

/** A follow-up is "YYYY-MM-DD", or "YYYY-MM-DDTHH:mm" (local, no zone) when the doctor picked a time. */
export const hasTime = (s: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);

/** "30 Sep 2026", or "30 Sep 2026, 10:30 AM" when a time was set. Parsed as LOCAL, never UTC. */
export function formatFollowUp(s: string): string {
  const [y, mo, d] = s.slice(0, 10).split("-").map(Number);
  const [h, mi] = hasTime(s) ? s.slice(11).split(":").map(Number) : [0, 0];
  return format(new Date(y, mo - 1, d, h, mi), hasTime(s) ? "d MMM yyyy, h:mm a" : "d MMM yyyy");
}
