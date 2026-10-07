import { useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useFrontDesk, useUpsertFrontDesk, useDeleteFrontDesk } from "@/hooks/use-api";
import { ApiError } from "@myanodex/shared/api-client";
import { useForm } from "@/hooks/use-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";

/**
 * The front desk: one login per doctor account (Pro). It signs in with its
 * own username, sees every clinic this doctor owns, books appointments and
 * raises invoices, and never opens a patient's records.
 */
export function Staff() {
  const { data, isLoading } = useFrontDesk();
  const upsert = useUpsertFrontDesk();
  const remove = useDeleteFrontDesk();
  const [resetOpen, setResetOpen] = useState(false);
  const { f, setF, seed } = useForm({ name: "", username: "", password: "" });

  const desk = data?.frontDesk ?? null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = f.name.trim() || desk?.name || "";
    const username = f.username.trim().toLowerCase() || desk?.username || "";
    if (!name || !username || !f.password) return toast.error("Name, username and password are required.");
    try {
      await upsert.mutateAsync({ name, username, password: f.password });
      toast.success(desk ? "Password reset. The desk is signed out everywhere." : "Front desk login created.");
      seed({ name: "", username: "", password: "" });
      setResetOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
    }
  }

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        A front desk login for your reception. It can book appointments, raise invoices, invite doctors and see clinic
        statistics for every clinic you own. It cannot open patient records or change your payment QR or UPI ID.
      </p>

      {desk ? (
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-[15px]">{desk.name}</CardTitle>
              <div className="text-[13px] text-muted-foreground">
                Username <span className="font-mono">{desk.username}</span>
                {desk.lastLogin ? ` · last signed in ${format(new Date(desk.lastLogin), "d MMM yyyy")}` : " · never signed in"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                <KeyRound /> Reset password
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove front desk"
                onClick={() =>
                  remove.mutate(undefined, {
                    onSuccess: () => toast.success("Front desk login removed."),
                    onError: () => toast.error("Could not remove."),
                  })
                }
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-[13px] text-muted-foreground">
            The desk signs in on the login page with the Front desk toggle, using this username and its password.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px]">Create the front desk login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="flex flex-col gap-3">
              <TextField label="Display name" value={f.name} onChange={(e) => setF("name", e.target.value)} placeholder="Reception" autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Username" hint="Letters, numbers, dots or underscores" value={f.username} onChange={(e) => setF("username", e.target.value)} placeholder="mehta.desk" />
                <TextField label="Password" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF("password", e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={upsert.isPending}>{upsert.isPending ? "Creating..." : "Create login"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset the front desk password</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-3">
            <TextField label="New password" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF("password", e.target.value)} autoFocus />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Reset password"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
