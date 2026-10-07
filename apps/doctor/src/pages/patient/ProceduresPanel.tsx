import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useProcedures, useCreateProcedure } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField, TextAreaField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import type { Procedure } from "@/types";

const today = "2026-08-23"; // ponytail: fixed mock "today"; use new Date() once live

export function ProceduresPanel({ mid }: { mid: string }) {
  const { data, isLoading } = useProcedures(mid);
  const create = useCreateProcedure(mid);
  const [open, setOpen] = useState(false);
  const { f, setF, seed } = useForm({ name: "", date: today, notes: "" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Procedure name is required.");
    try {
      await create.mutateAsync({ mid, name: f.name.trim(), date: f.date, notes: f.notes.trim() || undefined });
      toast.success("Procedure added.");
      seed({ name: "", date: today, notes: "" });
      setOpen(false);
    } catch {
      toast.error("Could not save. Try again.");
    }
  }

  const columns: Column<Procedure>[] = [
    { key: "name", header: "Procedure", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "notes", header: "Notes", className: "text-muted-foreground", render: (p) => p.notes ?? "—" },
    { key: "date", header: "Date", className: "tabular-nums whitespace-nowrap text-muted-foreground", render: (p) => format(new Date(p.date), "d MMM yyyy") },
    { key: "by", header: "By", className: "text-muted-foreground", render: (p) => p.recordedBy },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add procedure
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <DataTable columns={columns} rows={data?.procedures ?? []} getRowKey={(p) => p.id} empty="No procedures recorded." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add procedure</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-3">
            <TextField label="Procedure" value={f.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. ECG (12-lead)" autoFocus />
            <TextField label="Date" type="date" value={f.date} onChange={(e) => setF("date", e.target.value)} />
            <TextAreaField label="Notes" value={f.notes} onChange={(e) => setF("notes", e.target.value)} placeholder="Optional" />
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
