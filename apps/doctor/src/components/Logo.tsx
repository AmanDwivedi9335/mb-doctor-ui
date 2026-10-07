import logo from "@/assets/medibank-logo.png";
import { cn } from "@/lib/utils";

/** The MediBank wordmark. `suffix` adds a small label beside it ("for Doctors"). */
export function Logo({ className, suffix }: { className?: string; suffix?: string }) {
  return (
    <span className="flex items-center gap-2">
      <img src={logo} alt="MediBank" className={cn("h-8 w-auto", className)} />
      {suffix && <span className="text-[13px] font-medium text-muted-foreground">{suffix}</span>}
    </span>
  );
}
