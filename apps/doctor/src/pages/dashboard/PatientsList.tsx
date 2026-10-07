import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function PatientsList({ appointments }: { appointments: Appointment[] }) {
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(appointments[0]?.id ?? null);
  const rows = appointments.filter((a) => a.patientName.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">Patients list</h3>
        <button className="flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
          By upcoming <ChevronDown className="size-3.5" />
        </button>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="h-9 w-full rounded-lg border border-transparent bg-secondary pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-border focus:bg-background"
        />
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {rows.map((a) => {
          const active = a.id === activeId;
          return (
            <button
              key={a.id}
              onClick={() => setActiveId(a.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                active ? "bg-foreground text-background" : "hover:bg-secondary"
              )}
            >
              <Avatar className="size-9">
                <AvatarFallback className={cn(active ? "bg-background/20 text-background" : "bg-secondary text-muted-foreground")}>
                  {initials(a.patientName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">{a.patientName}</div>
                <div className={cn("truncate text-[12px]", active ? "text-background/70" : "text-muted-foreground")}>{a.reason}</div>
              </div>
              <div className={cn("shrink-0 text-[12px] tabular-nums", active ? "text-background/80" : "text-muted-foreground")}>
                {format(new Date(a.time), "H:mm")}
              </div>
            </button>
          );
        })}
        {rows.length === 0 && <p className="px-2 py-6 text-center text-[13px] text-muted-foreground">No patients match.</p>}
      </div>
    </Card>
  );
}
