import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useSummary, useCreateSummaryRow } from "@/hooks/use-api";
import { SUMMARY_TABS, filterSummaryRows, type SummaryTab } from "@/lib/summary";
import { useForm } from "@/hooks/use-form";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { FilterBar } from "@/components/clinical/FilterBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import type { SummaryKind, SummaryRow } from "@/types";

const today = "2026-08-23"; // ponytail: fixed mock "today"; use new Date() once live
const KINDS = SUMMARY_TABS.map((t) => t.kind);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtDate = (d: string) =>
  d && !Number.isNaN(new Date(d).getTime()) ? format(new Date(d), "d MMM yyyy") : d || "—";

/** Patient Summary: five sub-tabs (Active Conditions, Medications, Allergies,
 *  Major Procedures, Family / Social HX), each a filterable, paged table with Add. */
export function SummaryPanel({ mid }: { mid: string }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("sub");
  const sub: SummaryKind = KINDS.includes(raw as SummaryKind) ? (raw as SummaryKind) : "conditions";

  return (
    <Tabs value={sub} onValueChange={(v) => setParams({ tab: "summary", sub: v }, { replace: true })}>
      <TabsList className="flex-wrap">
        {SUMMARY_TABS.map((t) => (
          <TabsTrigger key={t.kind} value={t.kind}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SUMMARY_TABS.map((t) => (
        <TabsContent key={t.kind} value={t.kind}>
          <SummaryTable mid={mid} tab={t} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

const blank = (tab: SummaryTab): Record<string, string> =>
  Object.fromEntries(
    tab.fields.map((f) => [f.key, f.type === "date" ? today : f.type === "select" ? f.options![0] : ""])
  );

function SummaryTable({ mid, tab }: { mid: string; tab: SummaryTab }) {
  const { data, isLoading } = useSummary(tab.kind, mid);
  const create = useCreateSummaryRow(tab.kind, mid);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { f, setF, seed } = useForm(blank(tab));
  const rows = useMemo(() => filterSummaryRows(data?.rows ?? [], q), [data, q]);
  const lower = tab.label.toLowerCase();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const missing = tab.fields.find((x) => x.required && !f[x.key].trim());
    if (missing) return toast.error(`${missing.label} is required.`);
    try {
      await create.mutateAsync({ mid, ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])) });
      toast.success(`${cap(tab.noun)} added.`);
      seed(blank(tab));
      setOpen(false);
    } catch {
      toast.error("Could not save. Try again.");
    }
  }

  const columns: Column<SummaryRow>[] = tab.fields.map((x, i) => ({
    key: x.key,
    header: x.label,
    className:
      i === 0 ? "font-medium" : x.type === "date" ? "tabular-nums whitespace-nowrap text-muted-foreground" : "text-muted-foreground",
    render: (r) => (x.type === "date" ? fmtDate(r[x.key]) : r[x.key] || "—"),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterBar value={q} onChange={setQ} placeholder={`Search ${lower}`} className="flex-1" />
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.id}
          paged
          empty={q ? `No ${lower} match your search.` : `No ${lower} recorded yet.`}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {tab.noun}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-3">
            {tab.fields.map((x, i) =>
              x.type === "select" ? (
                <SelectField
                  key={x.key}
                  label={x.label}
                  value={f[x.key]}
                  onValueChange={(v) => setF(x.key, v)}
                  options={x.options!}
                />
              ) : (
                <TextField
                  key={x.key}
                  label={x.label}
                  type={x.type === "date" ? "date" : "text"}
                  value={f[x.key]}
                  onChange={(e) => setF(x.key, e.target.value)}
                  placeholder={x.placeholder}
                  autoFocus={i === 0}
                />
              )
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Saving..." : `Save ${tab.noun}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
