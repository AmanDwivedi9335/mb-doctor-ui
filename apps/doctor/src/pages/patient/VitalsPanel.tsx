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

      <div className="grid gap-4 lg:grid-cols-2">
        <VitalTrend key={`${mid}-first`} rows={rows} defaultMetric="blood_pressure" title="Measure 1" />
        <VitalTrend key={`${mid}-second`} rows={rows} defaultMetric="blood_glucose" title="Measure 2" />
      </div>
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

function VitalTrend({ rows, defaultMetric, title }: { rows: Vital[]; defaultMetric: Vital["type"]; title: string }) {
  const [metric, setMetric] = useState(defaultMetric);
  const meta = TYPES.find((t) => t.value === metric)!;
  const readings = useMemo(() => rows.filter((r) => r.type === metric).slice().sort((a, b) => a.recordDate.localeCompare(b.recordDate)), [rows, metric]);
  const chartData = readings.map((r) => ({
    date: r.recordDate,
    value: typeof r.value === "number" ? r.value : undefined,
    systolic: typeof r.value === "object" ? r.value.systolic : undefined,
    diastolic: typeof r.value === "object" ? r.value.diastolic : undefined,
  }));
  const latest = readings[readings.length - 1];

  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-3">
        <CardTitle>{title}</CardTitle>
        <SelectField label="Measure" value={metric} onValueChange={(v) => setMetric(v as Vital["type"])} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} />
        {latest && (
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold tabular-nums">{fmtValue(latest)}</span>
            <span className="text-muted-foreground">Recorded: {format(new Date(latest.recordDate), "d MMM yyyy")}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {readings.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No {meta.label.toLowerCase()} readings recorded.</div>
        ) : (
          <div className="h-56" role="img" aria-label={`${meta.label} readings by recorded date, in ${meta.unit}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "d MMM yyyy")} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" minTickGap={24} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={44} />
                <Tooltip labelFormatter={(d) => format(new Date(String(d)), "d MMM yyyy")} formatter={(value, name) => [`${value} ${meta.unit}`, name]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                {metric === "blood_pressure" ? (
                  <>
                    <Line name="Systolic" type="monotone" dataKey="systolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line name="Diastolic" type="monotone" dataKey="diastolic" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} />
                  </>
                ) : (
                  <Line name={meta.label} type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{meta.label} ({meta.unit}) · Recorded date</p>
        {metric === "blood_pressure" && latest && <p className="mt-1 text-xs text-muted-foreground">Purple: systolic · Gray: diastolic</p>}
      </CardContent>
    </Card>
  );
}