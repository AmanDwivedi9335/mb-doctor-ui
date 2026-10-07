import type { Diagnosis, DiagnosisStatus, ConsultationEntry } from "@/types";

export interface DiagnosisFilter {
  q: string; // free text over name/code
  status: DiagnosisStatus | "all";
}

export const emptyDiagnosisFilter: DiagnosisFilter = { q: "", status: "all" };

/** Pure filter used by the Diagnosis screen. Kept out of the component so it is
 *  testable and so the same rule can run against mock or real data unchanged. */
export function filterDiagnoses(items: Diagnosis[], filter: DiagnosisFilter): Diagnosis[] {
  const q = filter.q.trim().toLowerCase();
  return items.filter((d) => {
    if (filter.status !== "all" && d.status !== filter.status) return false;
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || (d.code ?? "").toLowerCase().includes(q);
  });
}

export interface HistoryFilter {
  q: string; // patient name, MID, mobile, or chief complaint
  from: string; // ISO date or ""
  to: string; // ISO date or ""
  kind: "all" | "mid" | "walk-in";
}

export const emptyHistoryFilter: HistoryFilter = { q: "", from: "", to: "", kind: "all" };

/** Consultation history filter. Dates compare on the visit date (yyyy-mm-dd), inclusive. */
export function filterHistory(items: ConsultationEntry[], filter: HistoryFilter): ConsultationEntry[] {
  const q = filter.q.trim().toLowerCase();
  return items.filter((e) => {
    if (filter.kind === "mid" && !e.mid) return false;
    if (filter.kind === "walk-in" && e.mid) return false;
    if (filter.from && e.date < filter.from) return false;
    if (filter.to && e.date > filter.to) return false;
    if (!q) return true;
    return (
      e.patientName.toLowerCase().includes(q) ||
      (e.mid ?? "").toLowerCase().includes(q) ||
      (e.phone ?? "").includes(q) ||
      e.complaint.toLowerCase().includes(q)
    );
  });
}
