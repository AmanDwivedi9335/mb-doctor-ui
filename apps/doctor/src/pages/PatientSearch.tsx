import { useEffect, useRef, useState } from "react";
import { Crown, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MidSearch } from "@/components/clinical/MidSearch";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentsTable } from "@/pages/stubs";
import { useAllFollowUps, useAppointments } from "@/hooks/use-api";
import type { FollowUp } from "@/types";
import { formatFollowUp } from "@/lib/dates";

const followUpVariant: Record<FollowUp["status"], "primary" | "danger" | "success"> = {
  upcoming: "primary",
  overdue: "danger",
  done: "success",
};

const followUpColumns: Column<FollowUp>[] = [
  { key: "number", header: "Sr. No", render: (_f, index) => index + 1 },
  { key: "mid", header: "MID", className: "tabular-nums", render: (f) => f.mid },
  { key: "due", header: "Follow-up on", className: "tabular-nums whitespace-nowrap", render: (f) => formatFollowUp(f.dueOn) },
  { key: "patient", header: "Patient", render: (f) => <span className="font-medium">{f.patientName}</span> },
  { key: "reason", header: "Comments", className: "text-muted-foreground", render: (f) => f.reason },
  { key: "status", header: "Status", render: (f) => <Badge variant={followUpVariant[f.status]} className="capitalize">{f.status}</Badge> },
  { key: "open", header: "", render: (f) => <Button asChild size="icon" className="size-7 rounded-full"><Link to={`/patients/${f.mid}?tab=followups`} aria-label={`Open follow-up for ${f.patientName}`} onClick={(e) => e.stopPropagation()}><ChevronRight /></Link></Button> },
];

export function PatientSearch() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("followups");
  const [frame, setFrame] = useState({ width: 0, height: 0, tabHeight: 78 });
  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const tabs = element.querySelector('[role="tablist"]');
      setFrame({ width: element.clientWidth, height: element.clientHeight, tabHeight: tabs?.getBoundingClientRect().height ?? 78 });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const { width: w, height: h, tabHeight: t } = frame;
  const r = 16;
  const outline = w && h ? `M ${r + 0.5} 0.5 H ${w / 2 - r} Q ${w / 2} 0.5 ${w / 2} ${r + 0.5} V ${t - r} Q ${w / 2} ${t} ${w / 2 + r} ${t} H ${w - r - 0.5} Q ${w - 0.5} ${t} ${w - 0.5} ${t + r} V ${h - r - 0.5} Q ${w - 0.5} ${h - 0.5} ${w - r - 0.5} ${h - 0.5} H ${r + 0.5} Q 0.5 ${h - 0.5} 0.5 ${h - r - 0.5} V ${r + 0.5} Q 0.5 0.5 ${r + 0.5} 0.5 Z` : "";
  const navigate = useNavigate();
  const { data } = useAllFollowUps();
  const { data: appts } = useAppointments();
  // Open follow-ups only; completed ones live on the patient's Follow-ups tab.
  const followups = (data?.followups ?? []).filter((f) => f.status !== "done");
  const todayCount = appts?.appointments.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section aria-label="Find a patient by MID">
        <MidSearch size="lg" appearance="reference" autoFocus />
        <p className="mt-2 px-4 text-[12px] text-muted-foreground">Enter a patient's MID to open their shared records. Demo: 22052661001002.</p>
      </section>
      <div ref={frameRef} className="relative">
      <svg className="pointer-events-none absolute inset-0 z-10 size-full" aria-hidden="true">
        <path d={outline} transform={activeTab === "today" ? `translate(${w} 0) scale(-1 1)` : undefined} fill="none" stroke="#b8b8b8" strokeWidth="1" />
      </svg>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="search-appointment-panel">
        <TabsList className="search-appointment-tabs grid w-full grid-cols-2 items-stretch gap-0 border-0" aria-label="Appointment lists">
          <TabsTrigger value="followups">Follow-up Appointments ({followups.length})</TabsTrigger>
          <TabsTrigger value="today"><Crown className="mr-2 size-4 text-amber-300" />Today's Appointments ({todayCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <AppointmentsTable paged />
        </TabsContent>
        <TabsContent value="followups">
          <DataTable
            paged
            searchable={(f) => `${f.patientName} ${f.mid} ${f.reason}`}
            columns={followUpColumns}
            rows={followups}
            getRowKey={(f) => f.id}
            empty="No follow-ups scheduled."
            onRowClick={(f) => navigate(`/patients/${f.mid}?tab=followups`)}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
