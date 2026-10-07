import { ChevronRight } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiagnosisShare } from "@/types";

export function DiagnosesRadar({ data }: { data: DiagnosisShare[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[15px]">Diagnoses</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_150px]">
        <div className="h-[188px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid gridType="polygon" stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Radar dataKey="pct" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-col">
          {data.map((d) => (
            <li key={d.label} className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-b-0 text-[12.5px]">
              <span className="flex items-center gap-1 text-muted-foreground">
                {d.label}
                <ChevronRight className="size-3" />
              </span>
              <span className="font-semibold tabular-nums">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
