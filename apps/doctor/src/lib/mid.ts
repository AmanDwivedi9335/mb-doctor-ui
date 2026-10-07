/**
 * MediBank ID helpers. A MID is the patient's health identifier the doctor
 * types to look someone up. Formats seen in the wild are 12-14 alphanumerics
 * (e.g. "M012561001001", "22052661001002"), so validation stays lenient on
 * length and only insists the thing is alphanumeric once whitespace is gone.
 */
export function normalizeMid(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidMid(raw: string): boolean {
  const mid = normalizeMid(raw);
  return /^[A-Z0-9]{12,14}$/.test(mid);
}
