import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useHistory } from "@/hooks/use-api";
import { filterHistory, emptyHistoryFilter, type HistoryFilter } from "@/lib/filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterBar } from "@/components/clinical/FilterBar";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Prescription } from "@/pages/WalkIn";
import type { ConsultationEntry, WalkIn } from "@/types";

const columns: Column<ConsultationEntry>[] = [
  { key: "date", header: "Date", className: "tabular-nums whitespace-nowrap", render: (e) => format(new Date(e.date), "d MMM yyyy") },
  {
    key: "patient",
    header: "Patient",
    render: (e) => (
      <div>
        <div className="font-medium">{e.patientName}</div>
        <div className="text-[12px] text-muted-foreground">
          {e.patientMeta}
          {e.phone && ` · ${e.phone}`}
        </div>
      </div>
    ),
  },
  {
    key: "kind",
    header: "Type",
    render: (e) =>
      e.mid ? (
        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11.5px] tabular-nums text-muted-foreground">{e.mid}</span>
      ) : (
        <Badge variant="outline">Walk-in</Badge>
      ),
  },
  { key: "complaint", header: "Chief complaint", render: (e) => e.complaint },
  { key: "rx", header: "Rx", className: "text-muted-foreground", render: (e) => e.medications.join(", ") || "None" },
  { key: "by", header: "By", className: "whitespace-nowrap text-muted-foreground", render: (e) => e.recordedBy },
];

/** Every consultation the clinic has recorded: MID patients and walk-ins in
 *  one list. A MID row opens that patient's Diagnosis tab; a walk-in row
 *  reopens its Rx for reprint. Filters are pure (lib/filters). */
export function History() {
  const navigate = useNavigate();
  const { data, isLoading } = useHistory();
  const [flt, setFlt] = useState<HistoryFilter>(emptyHistoryFilter);
  const [rx, setRx] = useState<WalkIn | null>(null);
  const set = <K extends keyof HistoryFilter>(k: K, v: HistoryFilter[K]) => setFlt((f) => ({ ...f, [k]: v }));
  const rows = useMemo(() => filterHistory(data?.entries ?? [], flt), [data, flt]);
  const active = JSON.stringify(flt) !== JSON.stringify(emptyHistoryFilter);

  if (rx) return <Prescription rx={rx} onBack={() => setRx(null)} backLabel="Back to history" />;

  return (
    <div className="flex flex-col gap-3">
      <FilterBar value={flt.q} onChange={(v) => set("q", v)} placeholder="Search patient, MID, mobile, or complaint">
        <Input type="date" value={flt.from} onChange={(e) => set("from", e.target.value)} className="w-[150px]" aria-label="From date" />
        <span className="text-[13px] text-muted-foreground">to</span>
        <Input type="date" value={flt.to} onChange={(e) => set("to", e.target.value)} className="w-[150px]" aria-label="To date" />
        <Select value={flt.kind} onValueChange={(v) => set("kind", v as HistoryFilter["kind"])}>
          <SelectTrigger className="w-[150px]" aria-label="Type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All patients</SelectItem>
            <SelectItem value="mid">MID patients</SelectItem>
            <SelectItem value="walk-in">Walk-ins</SelectItem>
          </SelectContent>
        </Select>
        {active && (
          <Button variant="ghost" size="sm" onClick={() => setFlt(emptyHistoryFilter)}>
            Clear
          </Button>
        )}
      </FilterBar>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(e) => e.id}
          empty={active ? "No consultations match your filters." : "No consultations yet."}
          onRowClick={(e) => (e.walkIn ? setRx(e.walkIn) : navigate(`/patients/${e.mid}?tab=diagnosis`))}
        />
      )}
    </div>
  );
}
