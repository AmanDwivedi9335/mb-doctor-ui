import { useMemo, useState } from "react";
import { Plus, ChevronRight, CalendarDays, UserRound } from "lucide-react";
import { DIAGNOSIS_STATUS_OPTIONS } from "@myanodex/shared/constants";
import { format } from "date-fns";
import { useDiagnoses, useCreateDiagnosis } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { filterDiagnoses, emptyDiagnosisFilter } from "@/lib/filters";
import { FilterBar } from "@/components/clinical/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { DiagnosisDetail, statusVariant } from "./DiagnosisDialogs";
import { DiagnosisForm, type DiagnosisFormValues } from "./DiagnosisForm";
import { followUpValue } from "@/lib/diagnosis";
import type { Diagnosis, DiagnosisStatus } from "@/types";

export function DiagnosisPanel({ mid }: { mid: string }) {
  const { data, isLoading } = useDiagnoses(mid);
  const create = useCreateDiagnosis(mid);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<DiagnosisStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Diagnosis | null>(null);

  const rows = useMemo(
    () => filterDiagnoses(data?.diagnoses ?? [], { ...emptyDiagnosisFilter, q, status }),
    [data, q, status]
  );

  // One request: the backend writes the prescription, the ordered tests, the
  // vitals row and (when ticked) the Medications summary rows in a single
  // transaction, so a diagnosis is never half-saved.
  async function save(snap: DiagnosisFormValues) {
    try {
      await create.mutateAsync({
        mid,
        name: snap.name,
        code: snap.code || undefined,
        status: snap.status,
        date: snap.date,
        notes: snap.notes || undefined,
        doctorNotes: snap.doctorNotes || undefined,
        medications: snap.medications,
        tests: snap.tests,
        vitals: snap.vitals,
        copyMedicationsToSummary: !!snap.addMedsToSummary,
        followUpDate: followUpValue(snap),
      });
    } catch (err) {
      return void toast.error(err instanceof ApiError ? err.message : "Could not save. Try again.");
    }
    toast.success("Diagnosis added. The patient can see it in their app.");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterBar value={q} onChange={setQ} placeholder="Search chief complaint or code" className="flex-1">
          <Select value={status} onValueChange={(v) => setStatus(v as DiagnosisStatus | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {DIAGNOSIS_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {q || status !== "all" ? "No diagnoses match your filters." : "No diagnoses recorded yet."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDetail(d)}
              className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span>Chief Complaint :</span>
                <ChevronRight className="size-4" />
              </div>
              <div className="text-[15px] font-semibold leading-tight">{d.name}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {format(new Date(d.date), "d MMM yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <UserRound className="size-3.5" />
                  {d.recordedBy}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
                {d.code && <span className="font-mono text-[12px] text-muted-foreground">{d.code}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Diagnosis</DialogTitle>
          </DialogHeader>
          <DiagnosisForm
            onSubmit={save}
            pending={create.isPending}
            autoFocus
            cancel={
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
            }
          />
        </DialogContent>
      </Dialog>

      <DiagnosisDetail d={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
