import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatCard } from "@/types";

export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">
              {c.value}
              {c.unit && <span className="ml-1 text-[13px] font-medium text-muted-foreground">{c.unit}</span>}
            </div>
            {c.delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  c.deltaTone === "down" ? "bg-pink/12 text-pink" : "bg-success/12 text-success"
                )}
              >
                {c.deltaTone === "down" ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                {c.delta}
              </span>
            )}
          </div>
          <div className="mt-3 text-[12.5px] text-muted-foreground">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
