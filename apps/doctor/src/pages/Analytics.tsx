import { useState, type ReactNode } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useBillingAnalytics, useClinicDoctors, usePatientAnalytics } from "@/hooks/use-api";
import { StatTile } from "@/components/clinical/StatTile";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/form/FormKit";
import { rupee } from "@/pages/Billing";
import type { BillingAnalytics as BillingData } from "@/types";

/**
 * Clinic Management analytics, two pages. Both cover the last six months and
 * show only what the dashboard (which is about today) does not. The owner and
 * the front desk see every doctor added up and can narrow to one; anyone else
 * sees only their own numbers.
 */

const ALL = "all";
const axis = { fontSize: 12 };
const tooltip = { fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" };
const PRIMARY = "hsl(var(--primary))";
const SOFT = "hsl(var(--primary) / 0.35)";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym;
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

/** "All doctors" + one entry per doctor, for the owner and the desk inside a clinic. */
function useDoctorPick() {
  const { user, activeClinicId } = useAuth();
  const canPick = !!activeClinicId && (user?.role === "receptionist" || user?.clinics.find((c) => c.id === activeClinicId)?.role === "owner");
  const { data } = useClinicDoctors(canPick);
  const doctors = (data?.doctors ?? []).filter((d) => d.active);
  const [picked, setPicked] = useState(ALL);
  // A pick from another clinic (after switching) falls back to everyone.
  const doctorId = doctors.some((d) => d.id === picked) ? picked : ALL;
  const picker =
    canPick && doctors.length > 1 ? (
      <SelectField
        label="Doctor"
        className="w-56"
        value={doctorId}
        onValueChange={setPicked}
        options={[{ value: ALL, label: "All doctors" }, ...doctors.map((d) => ({ value: d.id, label: d.name }))]}
      />
    ) : null;
  return { doctorId: doctorId === ALL ? undefined : doctorId, picker };
}

function Page({ title, picker, children }: { title: string; picker: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-[13px] text-muted-foreground">Last 6 months</p>
        </div>
        {picker}
      </div>
      {children}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Label, a bar sized against the total, the number. For short categorical splits. */
function Shares({ rows, format = String }: { rows: { label: string; value: number }[]; format?: (n: number) => string }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="text-[13px]">
          <div className="flex justify-between gap-2">
            <span>{r.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {format(r.value)} · {pct(r.value, total)}%
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${pct(r.value, total)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A small vertical bar chart: one series over a category axis. */
function Bars<T>({ data, x, y, name }: { data: T[]; x: keyof T & string; y: keyof T & string; name: string }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey={x} tick={axis} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={axis} stroke="hsl(var(--muted-foreground))" width={36} allowDecimals={false} />
          <Tooltip contentStyle={tooltip} />
          <Bar dataKey={y} name={name} fill={PRIMARY} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const Empty = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">{children}</div>
);

export function PatientAnalytics() {
  const { doctorId, picker } = useDoctorPick();
  const { data, isLoading } = usePatientAnalytics(doctorId);

  return (
    <Page title="Patient analytics" picker={picker}>
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.totals.seen === 0 ? (
        <Empty>No consultations in the last 6 months.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Patients seen" value={data.totals.seen} />
            <StatTile label="New patients" value={data.totals.new} hint="First visit in these 6 months" />
            <StatTile label="Returning" value={`${pct(data.totals.returning, data.totals.seen)}%`} hint={`${data.totals.returning} came back`} />
            <StatTile label="Average age" value={data.totals.averageAge ?? "-"} />
            <StatTile label="With a MediBank ID" value={`${pct(data.totals.withMid, data.totals.seen)}%`} hint={`${data.totals.seen - data.totals.withMid} walk-ins`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="New and returning patients">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.months.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={axis} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={axis} stroke="hsl(var(--muted-foreground))" width={36} allowDecimals={false} />
                    <Tooltip contentStyle={tooltip} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="new" name="New" stackId="p" fill={PRIMARY} />
                    <Bar dataKey="returning" name="Returning" stackId="p" fill={SOFT} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Age groups">
              <Bars data={data.ageGroups} x="label" y="count" name="Patients" />
            </ChartCard>
            <ChartCard title="Busiest days">
              <Bars data={data.weekdays} x="day" y="count" name="Consultations" />
            </ChartCard>
            <ChartCard title="Gender">
              <Shares rows={data.gender.map((g) => ({ label: g.label, value: g.count }))} />
            </ChartCard>
          </div>

          <ChartCard title="Most prescribed medicines">
            {data.topMedicines.length ? (
              <Shares rows={data.topMedicines.map((m) => ({ label: m.name, value: m.count }))} format={(n) => `${n} Rx`} />
            ) : (
              <p className="text-[13px] text-muted-foreground">No medicines prescribed yet.</p>
            )}
          </ChartCard>
        </>
      )}
    </Page>
  );
}

type DoctorRow = BillingData["byDoctor"][number];
const doctorColumns: Column<DoctorRow>[] = [
  { key: "name", header: "Doctor", render: (d) => <span className="font-medium">{d.name}</span> },
  { key: "invoices", header: "Invoices", className: "tabular-nums", render: (d) => d.invoices },
  { key: "billed", header: "Billed", className: "tabular-nums", render: (d) => rupee(d.billed) },
  { key: "collected", header: "Collected", className: "tabular-nums", render: (d) => rupee(d.collected) },
  { key: "due", header: "Still due", className: "tabular-nums", render: (d) => rupee(d.billed - d.collected) },
];

export function BillingAnalytics() {
  const { activeClinicId } = useAuth();
  const { doctorId, picker } = useDoctorPick();
  const { data, isLoading } = useBillingAnalytics(doctorId);

  if (!activeClinicId) {
    return (
      <Page title="Billing analytics" picker={null}>
        <Empty>Billing belongs to a clinic. Select one from the top bar.</Empty>
      </Page>
    );
  }

  return (
    <Page title="Billing analytics" picker={picker}>
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : data.totals.invoices === 0 && data.totals.outstanding === 0 ? (
        <Empty>No payments recorded in the last 6 months.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Collected this month" value={rupee(data.totals.collectedThisMonth)} />
            <StatTile label="Billed this month" value={rupee(data.totals.billedThisMonth)} />
            <StatTile
              label="Outstanding"
              value={rupee(data.totals.outstanding)}
              hint={`${data.totals.outstandingBills} bill${data.totals.outstandingBills === 1 ? "" : "s"} not fully paid`}
            />
            <StatTile label="Average bill" value={rupee(data.totals.averageBill)} hint={`${data.totals.invoices} invoices`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <ChartCard title="Billed and collected">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.months.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={axis} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={axis} stroke="hsl(var(--muted-foreground))" width={56} />
                    <Tooltip contentStyle={tooltip} formatter={(v: number) => rupee(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="billed" name="Billed" fill={SOFT} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Collected by payment mode">
              {data.byMode.length ? (
                <Shares rows={data.byMode.map((m) => ({ label: m.mode, value: m.amount }))} format={rupee} />
              ) : (
                <p className="text-[13px] text-muted-foreground">Nothing collected yet.</p>
              )}
            </ChartCard>
          </div>

          {!doctorId && data.byDoctor.length > 1 && (
            <ChartCard title="By doctor">
              <DataTable columns={doctorColumns} rows={data.byDoctor} getRowKey={(d) => d.doctorId} />
            </ChartCard>
          )}
        </>
      )}
    </Page>
  );
}
