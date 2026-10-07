import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useClinicDoctors, useInviteDoctor, useDeleteDoctor } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";

/**
 * Doctors at the active clinic. Nobody is added directly: the owner or the
 * front desk invites a doctor by username, email or Doctor ID, and the doctor
 * accepts from their own portal.
 */
export function Doctors() {
  const { user, activeClinicId } = useAuth();
  const { data, isLoading } = useClinicDoctors(!!activeClinicId);
  const invite = useInviteDoctor(activeClinicId);
  const remove = useDeleteDoctor();
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");

  const clinic = user?.clinics.find((c) => c.id === activeClinicId);
  const canManage = user?.role === "receptionist" || clinic?.role === "owner";

  if (!activeClinicId) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        Select a clinic from the top bar, or{" "}
        <Link to="/settings/clinic" className="font-medium text-primary hover:underline">
          create one
        </Link>{" "}
        first.
      </div>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return toast.error("Enter a username, email or Doctor ID.");
    try {
      const r = await invite.mutateAsync(identifier.trim());
      toast.success(r.status === "pending" ? "Invite sent. It shows here once they accept." : "Already a member.");
      setIdentifier("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send the invite.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Doctors consulting at {clinic?.name ?? "this clinic"}.</p>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus /> Invite doctor
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(data?.doctors ?? []).map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-[15px]">{d.name}</CardTitle>
                  <div className="text-[13px] text-muted-foreground">{d.specialization || "Doctor"}</div>
                </div>
                <div className="flex items-center gap-2">
                  {d.role === "owner" ? (
                    <Badge variant="primary">Owner</Badge>
                  ) : d.status === "pending" ? (
                    <Badge variant="warning">Invited</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                  {canManage && d.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove doctor"
                      onClick={() =>
                        remove.mutate(d.id, {
                          onSuccess: () => toast.success("Doctor removed from the clinic."),
                          onError: () => toast.error("Could not remove."),
                        })
                      }
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-[13px] text-muted-foreground">
                <div>{d.email}</div>
                {d.username && <div>@{d.username}{d.doctorNo ? ` · ${d.doctorNo}` : ""}</div>}
                {d.phone && <div>{d.phone}</div>}
                {d.registrationNo && <div>Reg: {d.registrationNo}</div>}
                {d.qualifications.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {d.qualifications.map((q) => (
                      <span key={q.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                        <GraduationCap className="size-3" /> {q.degree}{q.year ? ` · ${q.year}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a doctor</DialogTitle>
          </DialogHeader>
          <form onSubmit={send} className="flex flex-col gap-3">
            <TextField
              label="Username, email or Doctor ID"
              hint="They see the invite in their portal and can accept or decline."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="dr.mehta, dr@clinic.in or MB-DR-000123"
              autoFocus
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={invite.isPending}>{invite.isPending ? "Sending..." : "Send invite"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
