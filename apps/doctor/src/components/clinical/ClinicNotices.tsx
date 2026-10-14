import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import type { ClinicNotice } from "@/types";
import { activeClinicNotices, clinicToday } from "@/lib/profile-settings";

export function ClinicNotices({ notices = [] }: { notices?: ClinicNotice[] }) {
  const [date, setDate] = useState(clinicToday);
  useEffect(() => {
    let timer: number;
    const update = () => {
      const today = clinicToday();
      setDate(today);
      window.clearTimeout(timer);
      const nextMidnight =
        Date.parse(`${today}T00:00:00+05:30`) + 24 * 60 * 60_000;
      timer = window.setTimeout(update, Math.max(1, nextMidnight - Date.now()));
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const active = activeClinicNotices(notices, date);
  if (!active.length) return null;
  return (
    <section
      aria-label="Clinic noticeboard"
      className="mt-3 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-foreground"
    >
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Megaphone className="size-4 shrink-0" />
        Clinic noticeboard
      </h4>
      {active.map((n) => (
        <div key={n.id} className="space-y-1">
          <p className="whitespace-pre-wrap break-words text-sm">{n.note}</p>
          <p className="text-xs text-muted-foreground">
            {n.start} to {n.end}
          </p>
        </div>
      ))}
    </section>
  );
}
