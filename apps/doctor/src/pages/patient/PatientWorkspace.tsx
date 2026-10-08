import { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert, UserX, Loader2 } from "lucide-react";
import { ApiError } from "@myanodex/shared/api-client";
import { usePatient, useFeatureFlags, useRequestConsent } from "@/hooks/use-api";
import { useSelectedPatient } from "@/contexts/SelectedPatientContext";
import { PatientHeader } from "@/components/clinical/PatientHeader";
import { SummaryPanel } from "./SummaryPanel";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { ProceduresPanel } from "./ProceduresPanel";
import { ReportsPanel } from "./ReportsPanel";
import { VitalsPanel } from "./VitalsPanel";
import { FollowUpsPanel } from "./FollowUpsPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import type { ApiErrorBody } from "@/types";

const TITLES: Record<string, string> = {
  summary: "Patient Summary",
  diagnosis: "Consultations",
  procedures: "Procedure",
  reports: "Report",
  health: "Health graph",
  followups: "Patient history",
};

/** One patient's workspace. The sidebar's Consultation rows pick the section via
 *  `?tab=`; there is no tab strip here on purpose, the sidebar is the switcher. */
export function PatientWorkspace() {
  const { mid = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading, error, isFetching } = usePatient(mid);
  const { data: flags } = useFeatureFlags();
  const requestConsent = useRequestConsent();
  const { select } = useSelectedPatient();
  const showHealthGraph = !!flags?.flags?.health_graph;
  const raw = searchParams.get("tab") || "summary";
  const tab = raw in TITLES && (raw !== "health" || showHealthGraph) ? raw : "summary";

  // Remember this patient so the Consultation menu can point at them.
  useEffect(() => {
    if (data?.patient) select(data.patient.mid, data.patient.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.patient?.mid]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-9 w-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    const status = error instanceof ApiError ? error.status : 0;
    const state = error instanceof ApiError ? (error.data as ApiErrorBody | undefined)?.state : undefined;
    const pending = status === 403 && state === "pending";
    return (
      <StateCard
        icon={status === 403 ? (pending ? Loader2 : ShieldAlert) : UserX}
        spin={pending}
        title={pending ? "Waiting for the patient" : status === 403 ? "Consent required" : "No patient found"}
        body={
          pending
            ? "The patient has your request in their MediBank app. This opens by itself the moment they tap Approve."
            : status === 403
              ? state === "expired"
                ? "Your access to this patient has ended. Ask again to continue."
                : state === "rejected"
                  ? "The patient declined your last request. You can ask again during the consultation."
                  : "This patient has not shared their records with you. Send a request; they approve it in their MediBank app."
              : `No patient matches the MID ${mid}. Check the number and try again.`
        }
        action={
          status === 403 && !pending ? (
            <Button
              disabled={requestConsent.isPending || isFetching}
              onClick={() =>
                requestConsent.mutate(mid, {
                  onSuccess: (r) => toast.success(r.message),
                  onError: () => toast.error("Could not send request."),
                })
              }
            >
              {requestConsent.isPending ? "Sending..." : "Request access"}
            </Button>
          ) : status !== 403 ? (
            <Button variant="outline" onClick={() => navigate("/")}>
              Search again
            </Button>
          ) : undefined
        }
      />
    );
  }

  const patient = data!.patient;
  const panel =
    tab === "diagnosis" ? (
      <DiagnosisPanel mid={mid} />
    ) : tab === "procedures" ? (
      <ProceduresPanel mid={mid} />
    ) : tab === "reports" ? (
      <ReportsPanel mid={mid} />
    ) : tab === "health" ? (
      <VitalsPanel mid={mid} />
    ) : tab === "followups" ? (
      <FollowUpsPanel mid={mid} />
    ) : (
      <SummaryPanel mid={mid} />
    );

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate("/")}
        className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Find another patient
      </button>

      <PatientHeader patient={patient} summary={tab === "summary"} />

      <h2 className="text-base font-semibold">{TITLES[tab]}</h2>
      {panel}
    </div>
  );
}

function StateCard({
  icon: Icon,
  spin,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  spin?: boolean;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className={spin ? "size-5 animate-spin" : "size-5"} />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
