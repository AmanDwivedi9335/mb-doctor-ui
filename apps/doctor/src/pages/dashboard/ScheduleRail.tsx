import { ChevronLeft, ChevronRight, ChevronDown, User, Users, Droplet, Stethoscope, Syringe } from "lucide-react";
import { startOfWeek, addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ScheduleEvent, ScheduleKind } from "@/types";

// Align with the mock "today" so the week strip and the schedule agree.
const TODAY = new Date("2026-08-23T20:34:00");

const kindIcon: Record<ScheduleKind, React.ComponentType<{ className?: string }>> = {
  patient: User,
  meeting: Users,
  lab: Droplet,
  operation: Stethoscope,
  prep: Syringe,
};

export function ScheduleRail({ events }: { events: ScheduleEvent[] }) {
  const weekStart = startOfWeek(TODAY, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex h-full flex-col gap-4 border-l border-border/70 pl-4 md:pl-5">
      {/* Month header */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="text-[15px] font-semibold">{format(TODAY, "MMM yyyy")}</div>
        <div className="flex items-center gap-1">
          <button className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Previous week">
            <ChevronLeft className="size-4" />
          </button>
          <button className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Next week">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => {
          const isToday = format(d, "yyyy-MM-dd") === format(TODAY, "yyyy-MM-dd");
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <div key={d.toISOString()} className="flex flex-col items-center gap-1">
              <span className={cn("text-[11px] font-medium", weekend ? "text-primary" : "text-muted-foreground")}>{format(d, "EEE")}</span>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-[12.5px] font-medium tabular-nums",
                  isToday ? "bg-foreground text-background" : "text-foreground hover:bg-secondary"
                )}
              >
                {format(d, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Today label */}
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-medium">{format(TODAY, "MMMM d")}, Today, {format(TODAY, "EEE")}</div>
        <button className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
          All <ChevronDown className="size-3.5" />
        </button>
      </div>

      {/* Timeline */}
      <div className="scroll-area relative flex-1 overflow-y-auto pr-1">
        {/* now marker */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold tabular-nums text-background">
            {format(TODAY, "HH:mm")}
          </span>
          <span className="h-px flex-1 bg-foreground/30" />
        </div>

        <ol className="relative ml-1 border-l border-border/70">
          {events.map((ev) => {
            const Icon = kindIcon[ev.kind];
            const highlight = ev.kind === "patient";
            return (
              <li key={ev.id} className="relative mb-2.5 pl-4">
                <span className="absolute -left-[5px] top-4 size-2 rounded-full bg-border" />
                <div
                  className={cn(
                    "rounded-xl border bg-card p-3",
                    highlight ? "border-foreground/15 shadow-sm ring-1 ring-foreground/5" : "border-border"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {ev.tag && (
                        <span
                          className={cn(
                            "mb-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                            ev.kind === "operation" ? "bg-sky-100 text-sky-700" : "bg-accent text-accent-foreground"
                          )}
                        >
                          {ev.tag}
                        </span>
                      )}
                      <div className="truncate text-[13px] font-semibold">{ev.title}</div>
                      <div className="truncate text-[12px] text-muted-foreground">{ev.subtitle}</div>
                      <div className="mt-1 text-[11.5px] tabular-nums text-muted-foreground">
                        {ev.start} — {ev.end}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
