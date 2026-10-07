import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useVitals, useCreateVital } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import type { Vital } from "@/types";

const TYPES: { value: Vital["type"]; label: string; unit: string }[] = [
  { value: "blood_pressure", label: "Blood pressure", unit: "mmHg" },
  { value: "blood_glucose", label: "Blood glucose", unit: "mg/dL" },
  { value: "heart_rate", label: "Heart rate", unit: "bpm" },
  { value: "resp_rate", label: "Resp rate", unit: "/min" },
  { value: "spo2", label: "SpO2", unit: "%" },
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "temperature", label: "Temperature", unit: "°C" },
];
const today = "2026-08-23"; // ponytail: fixed mock "today"
const fmtValue = (v: Vital) => (typeof v.value === "number" ? `${v.value} ${v.unit}` : `${v.value.systolic}/${v.value.diastolic} ${v.unit}`);

export function VitalsPanel({ mid }: { mid: string }) {
  const { data, isLoading } = useVitals(mid);
  const create = useCreateVital(mid);
  const [open, setOpen] = useState(false);
  const { f, setF, seed } = useForm({ type: "blood_pressure" as Vital["type"], value: "", systolic: "", diastolic: "", date: today });

  const rows = data?.vitals ?? [];

  // Pick a metric to chart; default to the first present type.
  const presentTypes = useMemo(() => TYPES.filter((t) => rows.some((r) => r.type === t.value)), [rows]);
  const [metric, setMetric] = useState<Vital["type"] | null>(null);
  const activeMetric = metric ?? presentTypes[0]?.value ?? null;

  const chartData = useMemo(() => {
    if (!activeMetric) return [];
    return rows
      .filter((r) => r.type === activeMetric)
      .slice()
      .sort((a, b) => a.recordDate.localeCompare(b.recordDate))
      .map((r) => ({
        date: format(new Date(r.recordDate), "d MMM"),
        value: typeof r.value === "number" ? r.value : undefined,
        systolic: typeof r.value === "object" ? r.value.systolic : undefined,
        diastolic: typeof r.value === "object" ? r.value.diastolic : undefined,
      }));
  }, [rows, activeMetric]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const meta = TYPES.find((t) => t.value === f.type)!;
    let value: Vital["value"];
    if (f.type === "blood_pressure") {
      const s = Number(f.systolic), d = Number(f.diastolic);
      if (!s || !d) return toast.error("Enter both systolic and diastolic.");
      value = { systolic: s, diastolic: d };
    } else {
      const n = Number(f.value);
      if (!n) return toast.error("Enter a value.");
      value = n;
    }
    try {
      await create.mutateAsync({ mid, type: f.type, value, unit: meta.unit, recordDate: f.date });
      toast.success("Reading added.");
      seed({ type: "blood_pressure", value: "", systolic: "", diastolic: "", date: today });
      setOpen(false);
    } catch {
      toast.error("Could not save. Try again.");
    }
  }

  const columns: Column<Vital>[] = [
    { key: "type", header: "Measure", render: (v) => TYPES.find((t) => t.value === v.type)?.label ?? v.type },
    { key: "value", header: "Value", className: "tabular-nums font-medium", render: fmtValue },
    { key: "date", header: "Recorded", className: "tabular-nums whitespace-nowrap text-muted-foreground", render: (v) => format(new Date(v.recordDate), "d MMM yyyy") },
  ];

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Health graph</div>
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add reading
        </Button>
      </div>

      {activeMetric && chartData.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Trend</CardTitle>
            <div className="flex flex-wrap gap-1">
              {presentTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setMetric(t.value)}
                  className={`rounded-md px-2 py-1 text-[12px] font-medium ${activeMetric === t.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={44} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  {activeMetric === "blood_pressure" ? (
                    <>
                      <Line type="monotone" dataKey="systolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="diastolic" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} />
                    </>
                  ) : (
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} rows={rows} getRowKey={(v) => v.id} empty="No vitals recorded." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add reading</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-3">
            <SelectField
              label="Measure"
              value={f.type}
              onValueChange={(v) => setF("type", v as Vital["type"])}
              options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            {f.type === "blood_pressure" ? (
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Systolic" type="number" value={f.systolic} onChange={(e) => setF("systolic", e.target.value)} placeholder="mmHg" />
                <TextField label="Diastolic" type="number" value={f.diastolic} onChange={(e) => setF("diastolic", e.target.value)} placeholder="mmHg" />
              </div>
            ) : (
              <TextField label={`Value (${TYPES.find((t) => t.value === f.type)?.unit})`} type="number" value={f.value} onChange={(e) => setF("value", e.target.value)} />
            )}
            <TextField label="Date" type="date" value={f.date} onChange={(e) => setF("date", e.target.value)} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
