import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HourPoint } from "@/types";

export function PatientsChart({ data }: { data: HourPoint[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[15px]">Patients</CardTitle>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "hsl(var(--primary))" }} /> Male
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-pink" /> Female
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[188px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="male" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="female" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--pink))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--pink))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="female" stroke="hsl(var(--pink))" strokeWidth={2} fill="url(#female)" />
              <Area type="monotone" dataKey="male" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#male)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
