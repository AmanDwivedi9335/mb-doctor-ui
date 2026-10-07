import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A single dashboard metric. Number leads, label sits under it, icon is quiet. */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-start justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
