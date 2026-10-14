import { useState } from "react";
import { ClinicNotices } from "@/components/clinical/ClinicNotices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/DoctorAuthContext";
import type { LinkedClinic, ClinicRequest } from "@/lib/profile-settings";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

export function ClinicApprovalQueue() {
  const qc = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["doctor", "clinic-requests"],
    queryFn: () => api.get<{ requests: ClinicRequest[] }>("/clinic-requests"),
  });
  const review = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "approve" | "reject";
    }) => api.post(`/clinic-requests/${id}/${decision}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["doctor"] });
      toast.success("Clinic request reviewed.");
    },
    onError: (e) => toast.error(e.message),
  });
  if (error) return <p role="alert">Could not load clinic requests.</p>;
  if (!data?.requests.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic link requests</CardTitle>
        <p className="text-sm text-muted-foreground">
          Only the principal doctor can approve a doctor’s request to join.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.requests.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
          >
            <div className="flex-1 text-sm">
              <p className="font-medium">{r.doctorName}</p>
              <p className="text-muted-foreground">{r.clinicName}</p>
            </div>
            <Button
              disabled={review.isPending}
              onClick={() => review.mutate({ id: r.id, decision: "approve" })}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              disabled={review.isPending}
              onClick={() => review.mutate({ id: r.id, decision: "reject" })}
            >
              Reject
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function LinkedClinics() {
  const { refreshSession } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [removing, setRemoving] = useState<LinkedClinic | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["doctor", "linked-clinics"],
    queryFn: () => api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics"),
  });
  const directory = useQuery({
    queryKey: ["doctor", "clinic-directory"],
    queryFn: () =>
      api.get<{
        clinics: Pick<
          LinkedClinic,
          "id" | "name" | "address" | "principal" | "notices"
        >[];
      }>("/clinic-directory"),
    enabled: open,
  });
  const update = useMutation({
    mutationFn: ({
      clinicId,
      remove,
    }: {
      clinicId: string;
      remove?: boolean;
    }) =>
      remove
        ? api.delete(`/me/linked-clinics/${clinicId}`)
        : api.post("/me/linked-clinics", { clinicId }),
    onSuccess: async (_, action) => {
      setOpen(false);
      setRemoving(null);
      setSelected("");
      await refreshSession();
      await qc.invalidateQueries({ queryKey: ["doctor"] });
      toast.success(
        action.remove
          ? "Clinic removed."
          : "Request sent to the principal doctor for approval.",
      );
    },
    onError: (e) => toast.error(e.message),
  });
  const available =
    directory.data?.clinics.filter(
      (c) => !data?.clinics.some((linked) => linked.id === c.id),
    ) ?? [];
  if (isLoading) return <Skeleton className="h-48" />;
  if (error)
    return (
      <p role="alert" className="text-destructive">
        Could not load linked clinics.
      </p>
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          View and manage your clinic links on Basic or Pro.
        </p>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Add Clinic
        </Button>
      </div>
      {!data?.clinics.length && (
        <p className="rounded-lg border p-6 text-sm text-muted-foreground">
          No linked clinics yet. Add a clinic to request membership.
        </p>
      )}
      {data?.clinics.map((clinic) => (
        <Card key={clinic.id}>
          <CardContent className="pt-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold">{clinic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {clinic.address}
                  </p>
                </div>
                <Badge
                  variant={clinic.status === "pending" ? "warning" : "success"}
                >
                  {clinic.status === "pending"
                    ? "Pending Approval"
                    : clinic.role === "owner"
                      ? "Principal doctor"
                      : "Linked"}
                </Badge>
                <span
                  className="text-xl transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  ⌄
                </span>
              </summary>
              <div className="mt-4 space-y-2 border-t pt-4">
                <h4 className="text-sm font-semibold">
                  Your working hours at this clinic
                </h4>
                {clinic.hours.length ? (
                  clinic.hours.map((h) => (
                    <p key={h.day} className="text-sm capitalize">
                      {h.day}:{" "}
                      {h.closed ? "Not working" : `${h.opens}–${h.closes}`}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {clinic.status === "pending"
                      ? "Working hours will be available once approved and assigned."
                      : "Working hours have not been assigned."}
                  </p>
                )}
              </div>
            </details>
            <ClinicNotices notices={clinic.notices} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Principal: {clinic.principal}
              </span>
              {clinic.role !== "owner" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() => setRemoving(clinic)}
                >
                  {clinic.status === "pending"
                    ? "Cancel request"
                    : "Remove Clinic"}
                </Button>
              )}
              {clinic.role === "owner" && (
                <span className="text-xs text-muted-foreground">
                  Transfer ownership before leaving.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      <ClinicApprovalQueue />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Clinic</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose a clinic. Its principal doctor must approve your request.
          </p>
          <label className="text-sm font-medium" htmlFor="link-clinic">
            Clinic
          </label>
          <select
            id="link-clinic"
            className="rounded-md border bg-background p-2 text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Select a clinic</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.principal}
              </option>
            ))}
          </select>
          <ClinicNotices
            notices={
              directory.data?.clinics.find((c) => c.id === selected)?.notices
            }
          />
          {directory.isLoading && <p className="text-sm">Loading clinics…</p>}
          {directory.error && (
            <p role="alert" className="text-sm text-destructive">
              Could not load clinic directory.
            </p>
          )}
          {directory.data && !available.length && (
            <p className="text-sm">No additional clinics available.</p>
          )}
          <Button
            disabled={!selected || update.isPending}
            onClick={() => update.mutate({ clinicId: selected })}
          >
            {update.isPending ? "Sending…" : "Send request"}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing}
        onOpenChange={(value) => !value && setRemoving(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {removing?.status === "pending"
                ? "Cancel clinic request?"
                : "Remove clinic?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            {removing?.status === "pending"
              ? "Withdraw your pending request to"
              : "You will unlink yourself from"}{" "}
            {removing?.name}. You can request to join again later.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              disabled={update.isPending}
              onClick={() =>
                removing &&
                update.mutate({ clinicId: removing.id, remove: true })
              }
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
