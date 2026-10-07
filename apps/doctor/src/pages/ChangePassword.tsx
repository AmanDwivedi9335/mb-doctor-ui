import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ApiError } from "@/contexts/DoctorAuthContext";
import { useForm } from "@/hooks/use-form";
import { TextField } from "@/components/form/FormKit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

export function ChangePassword() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const { f, setF } = useForm({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (f.next !== f.confirm) return toast.error("New passwords do not match.");
    setBusy(true);
    try {
      await changePassword(f.current, f.next);
      // The backend revokes every session, this one included; say so instead
      // of bouncing the doctor to the login page on the next refresh.
      await logout().catch(() => undefined);
      toast.success("Password changed. Sign in again with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-3">
            <TextField label="Current password" type="password" value={f.current} onChange={(e) => setF("current", e.target.value)} autoComplete="current-password" />
            <TextField label="New password" type="password" value={f.next} onChange={(e) => setF("next", e.target.value)} autoComplete="new-password" hint="At least 8 characters." />
            <TextField label="Confirm new password" type="password" value={f.confirm} onChange={(e) => setF("confirm", e.target.value)} autoComplete="new-password" />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Change password"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
