import { useState } from "react";
import { Plus } from "lucide-react";
import { useFollowUps, useCreateFollowUp, usePatient } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import type { FollowUp } from "@/types";
import { todayKey, formatFollowUp } from "@/lib/dates";

const variant = { upcoming: "primary", overdue: "danger", done: "success" } as const;

export function FollowUpsPanel({ mid }: { mid: string }) {
  const { data, isLoading } = useFollowUps(mid);
  const { data: patient } = usePatient(mid);
  const create = useCreateFollowUp(mid);
  const [open, setOpen] = useState(false);
  const { f, setF, seed } = useForm({ reason: "", dueOn: todayKey() });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.reason.trim()) return toast.error("Reason is required.");
    try {
      await create.mutateAsync({
        mid,
        patientName: patient?.patient.name ?? "",
        reason: f.reason.trim(),
        dueOn: f.dueOn,
        status: "upcoming",
      });
      toast.success("Follow-up scheduled.");
      seed({ reason: "", dueOn: todayKey() });
      setOpen(false);
    } catch {
      toast.error("Could not save. Try again.");
    }
  }

  const columns: Column<FollowUp>[] = [
    { key: "reason", header: "Reason", render: (x) => <span className="font-medium">{x.reason}</span> },
    { key: "due", header: "Due", className: "tabular-nums whitespace-nowrap", render: (x) => formatFollowUp(x.dueOn) },
    { key: "status", header: "Status", render: (x) => <Badge variant={variant[x.status]} className="capitalize">{x.status}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> Schedule follow-up
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <DataTable columns={columns} rows={data?.followups ?? []} getRowKey={(x) => x.id} empty="No follow-ups scheduled." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule follow-up</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-3">
            <TextField label="Reason" value={f.reason} onChange={(e) => setF("reason", e.target.value)} placeholder="e.g. Repeat HbA1c" autoFocus />
            <TextField label="Due on" type="date" value={f.dueOn} onChange={(e) => setF("dueOn", e.target.value)} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
