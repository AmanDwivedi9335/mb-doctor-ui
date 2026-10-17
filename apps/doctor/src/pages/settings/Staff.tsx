import { useState } from "react";
import { useFrontDesk, useUpsertFrontDesk, useDeleteFrontDesk } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField, SelectField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import { todayKey } from "@/lib/dates";

const empty = { name: "", username: "", email: "", dob: "", gender: "", phone: "", address: "", aadhaar: "", pan: "", nextOfKin: "", emergencyContact: "", oldPassword: "", password: "", confirmPassword: "" };
export function Staff() {
  const { data, isLoading } = useFrontDesk();
  const upsert = useUpsertFrontDesk();
  const remove = useDeleteFrontDesk();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { f, setF, seed } = useForm(empty);
  const desk = data?.frontDesk;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.password !== f.confirmPassword) return toast.error("Passwords do not match.");
    if (desk && f.password && !f.oldPassword) return toast.error("Enter the old password to change the password.");
    if (!desk && !f.password) return toast.error("Password is required.");
    if (f.aadhaar && !/^\d{12}$/.test(f.aadhaar)) return toast.error("Aadhaar must have 12 digits.");
    if (f.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(f.pan)) return toast.error("Enter a valid PAN.");
    try {
      const { confirmPassword, password, oldPassword, ...profile } = f;
      await upsert.mutateAsync({ ...profile, name: f.name.trim(), username: f.username.trim().toLowerCase(), ...(password ? { password, oldPassword } : {}) });
      setOpen(false); seed(empty); toast.success(desk ? "Staff updated." : "Staff added.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save staff."); }
  }
  if (isLoading) return <Skeleton className="h-48" />;
  return <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Front desk staff</h3><Button disabled={!!desk} onClick={() => { seed(empty); setOpen(true); }}>Add staff</Button></div>
    <p className="text-sm text-muted-foreground">One front desk login is available per doctor account. Staff can manage appointments and billing.</p>
    {desk ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-5"><div><p className="font-semibold">{desk.name}</p><p className="text-sm text-muted-foreground">{desk.email || desk.username}</p><p className="text-sm">{desk.phone}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => { seed({ ...empty, ...desk, username: desk.username ?? "", oldPassword: "", password: "", confirmPassword: "" }); setOpen(true); }}>Edit staff</Button><Button variant="outline" className="text-destructive" onClick={() => setDeleting(true)}>Delete staff</Button></div></div> : <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No staff added yet.</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="left-auto right-0 top-0 flex h-dvh max-h-dvh w-full max-w-xl translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none"><DialogHeader><DialogTitle>{desk ? "Edit staff" : "Add staff"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="flex flex-col gap-3">
        <TextField label="Name" required value={f.name} onChange={(e) => setF("name", e.target.value)} />
        <TextField label="Username" required value={f.username} onChange={(e) => setF("username", e.target.value)} />
        <TextField label="Email" type="email" required value={f.email} onChange={(e) => setF("email", e.target.value)} />
        <div className="grid grid-cols-2 gap-3"><TextField label="Date of birth" type="date" max={todayKey()} value={f.dob} onChange={(e) => setF("dob", e.target.value)} /><SelectField label="Gender" options={["Male", "Female", "Other"]} value={f.gender} onValueChange={(v) => setF("gender", v)} /></div>
        <TextField label="Phone" type="tel" required value={f.phone} onChange={(e) => setF("phone", e.target.value)} />
        <TextField label="Address" value={f.address} onChange={(e) => setF("address", e.target.value)} />
        <fieldset className="grid grid-cols-2 gap-3 rounded-lg border p-3"><legend>KYC</legend><TextField label="Aadhaar" inputMode="numeric" maxLength={12} value={f.aadhaar} onChange={(e) => setF("aadhaar", e.target.value)} /><TextField label="PAN" maxLength={10} value={f.pan} onChange={(e) => setF("pan", e.target.value.toUpperCase())} /></fieldset>
        <TextField label="Next of kin" value={f.nextOfKin} onChange={(e) => setF("nextOfKin", e.target.value)} />
        <TextField label="Emergency contact" type="tel" value={f.emergencyContact} onChange={(e) => setF("emergencyContact", e.target.value)} />
        {desk && <TextField label="Old password" type="password" autoComplete="current-password" value={f.oldPassword} onChange={(e) => setF("oldPassword", e.target.value)} />}
        <TextField label={desk ? "New password" : "Password"} type="password" autoComplete="new-password" required={!desk} value={f.password} onChange={(e) => setF("password", e.target.value)} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" required={!!f.password} value={f.confirmPassword} onChange={(e) => setF("confirmPassword", e.target.value)} />
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button disabled={upsert.isPending} type="submit">{upsert.isPending ? "Saving..." : desk ? "Update staff" : "Add staff"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
    <Dialog open={deleting} onOpenChange={setDeleting}><DialogContent><DialogHeader><DialogTitle>Delete {desk?.name}?</DialogTitle></DialogHeader><p className="text-sm">This removes the front desk login.</p><DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(undefined, { onSuccess: () => { setDeleting(false); toast.success("Staff deleted."); }, onError: () => toast.error("Could not delete staff.") })}>Delete staff</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
