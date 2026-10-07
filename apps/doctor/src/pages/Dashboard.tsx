import { useDashboardOverview, useAppointments } from "@/hooks/use-api";
import { StatCards } from "@/pages/dashboard/StatCards";
import { DiagnosesRadar } from "@/pages/dashboard/DiagnosesRadar";
import { PatientsChart } from "@/pages/dashboard/PatientsChart";
import { PatientsList } from "@/pages/dashboard/PatientsList";
import { LastVisit } from "@/pages/dashboard/LastVisit";
import { ScheduleRail } from "@/pages/dashboard/ScheduleRail";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const { data: overview, isLoading } = useDashboardOverview();
  const { data: appts } = useAppointments();

  if (isLoading || !overview) {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
        <Skeleton className="hidden h-full xl:block" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_336px]">
      <div className="flex min-w-0 flex-col gap-4">
        <StatCards cards={overview.cards} />
        <div className="grid gap-4 lg:grid-cols-2">
          <DiagnosesRadar data={overview.diagnoses} />
          <PatientsChart data={overview.patientsByHour} />
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <PatientsList appointments={appts?.appointments ?? []} />
          <LastVisit visit={overview.lastVisit} />
        </div>
      </div>
      <ScheduleRail events={overview.schedule} />
    </div>
  );
}
