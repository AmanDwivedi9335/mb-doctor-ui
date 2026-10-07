import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Search box plus an optional slot for selects/actions, on one row. */
export function FilterBar({
  value,
  onChange,
  placeholder = "Search",
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      {children}
    </div>
  );
}
