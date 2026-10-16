import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/DoctorAuthContext";
import type { AccountPreferencesData } from "@/lib/profile-settings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

export function AccountPreferences() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["account-preferences"],
    queryFn: () => authApi.get<AccountPreferencesData>("/auth/me/preferences"),
  });
  const [revokeOpen, setRevokeOpen] = useState(false);
  const save = useMutation({
    mutationFn: (minutes: number) =>
      authApi.put<AccountPreferencesData>("/auth/me/preferences", {
        inactivityMinutes: minutes,
        language: data?.language ?? "en",
      }),
    onSuccess: (saved) => {
      qc.setQueryData(["account-preferences"], saved);
      toast.success("Preferences saved.");
    },
    onError: (e) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: async () => {
      await authApi.post("/auth/me/logout-everywhere");
      await logout();
      navigate("/login");
    },
    onError: (e) => toast.error(e.message),
  });
  if (error) return <p role="alert">Could not load account preferences.</p>;
  if (!data)
    return (
      <p className="text-sm text-muted-foreground">Loading preferences…</p>
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[15px]">Account preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="inactivity" className="text-sm font-medium">
            Inactivity timeout
          </label>
          <select
            id="inactivity"
            className="rounded-md border bg-background p-2 text-sm"
            value={data.inactivityMinutes}
            disabled={save.isPending}
            onChange={(e) => save.mutate(Number(e.target.value))}
          >
            {[5, 15, 30, 60].map((n) => (
              <option key={n} value={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Logout everywhere</p>
            <p className="text-xs text-muted-foreground">
              End all demo sessions, including this one.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRevokeOpen(true)}
          >
            Logout everywhere
          </Button>
        </div>
        <div>
          <label htmlFor="display-language" className="text-sm font-medium">
            Display language
          </label>
          <select
            id="display-language"
            value={data.language}
            disabled
            className="ml-3 rounded-md border bg-background p-2 text-sm"
          >
            <option value="en">English</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            English is currently available. Additional translations require
            approved content.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Referral link</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {data.referralLink}
          </p>
          <Button
            className="mt-2"
            variant="outline"
            size="sm"
            onClick={() =>
              navigator.clipboard.writeText(data.referralLink).then(
                () => toast.success("Referral link copied."),
                () =>
                  toast.error(
                    "Could not copy. Select the link above to copy it.",
                  ),
              )
            }
          >
            Copy link
          </Button>
        </div>
        <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Logout everywhere?</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              You will need to sign in again on this device and any other demo
              tabs.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRevokeOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={revoke.isPending}
                onClick={() => revoke.mutate()}
              >
                Logout everywhere
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
