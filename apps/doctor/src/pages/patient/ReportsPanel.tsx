import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { useReports, useCreateReport, useFeatureFlags } from "@/hooks/use-api";
import { apiBlob } from "@/lib/api";
import { ApiError } from "@myanodex/shared/api-client";
import { useForm } from "@/hooks/use-form";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import type { Report } from "@/types";
import { todayKey } from "@/lib/dates";

const CATEGORIES = ["Pathology", "Imaging", "Prescription", "Other"] as const;
const today = todayKey;

/** Scanned reports on this patient's charts. Upload is a real file; View streams it back. */
export function ReportsPanel({ mid }: { mid: string }) {
  const { data, isLoading } = useReports(mid);
  const create = useCreateReport(mid);
  const { data: flags } = useFeatureFlags();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { f, setF, seed } = useForm({ title: "", category: "Pathology" as Report["category"], date: today() });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Choose the report file.");
    const form = new FormData();
    form.append("mid", mid);
    form.append("title", f.title.trim() || file.name);
    form.append("category", f.category);
    form.append("date", f.date);
    form.append("file", file, file.name);
    try {
      await create.mutateAsync(form);
      toast.success("Report added.");
      seed({ title: "", category: "Pathology", date: today() });
      setFile(null);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save. Try again.");
    }
  }

  async function view(r: Report) {
    try {
      const blob = await apiBlob(`/reports/${r.id}/file?mid=${encodeURIComponent(mid)}`);
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open the file.");
    }
  }

  const columns: Column<Report>[] = [
    {
      key: "title",
      header: "Report",
      render: (r) => (
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">{r.title}</span>
        </div>
      ),
    },
    { key: "category", header: "Category", className: "text-muted-foreground", render: (r) => r.category },
    { key: "date", header: "Date", className: "tabular-nums whitespace-nowrap text-muted-foreground", render: (r) => format(new Date(r.date), "d MMM yyyy") },
    ...(flags?.flags?.report_verification
      ? [
          {
            key: "status",
            header: "Status",
            render: (r: Report) => (r.status === "verified" ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>),
          },
        ]
      : []),
    {
      key: "action",
      header: "",
      className: "text-right",
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => void view(r)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add report
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <DataTable columns={columns} rows={data?.reports ?? []} getRowKey={(r) => r.id} empty="No reports yet." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add report</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              File (PDF, JPG or PNG, up to 10 MB)
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-[12px] font-normal" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <TextField label="Title" value={f.title} onChange={(e) => setF("title", e.target.value)} placeholder="e.g. Lipid profile" />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Category" value={f.category} onValueChange={(v) => setF("category", v as Report["category"])} options={CATEGORIES as unknown as string[]} />
              <TextField label="Date" type="date" value={f.date} onChange={(e) => setF("date", e.target.value)} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Uploading..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
