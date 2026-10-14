import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DEMO_STORAGE_PREFIX,
  SESSION_GENERATION_KEY,
  hasDemoSession,
} from "@/lib/demo-storage";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/DoctorAuthContext";
import type { AccountPreferencesData } from "@/lib/profile-settings";
import { toast } from "@/components/ui/sonner";

/** Check elapsed time as well as timers, so background tabs expire on return. */
export function SessionActivity() {
  const { logout, refreshSession } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["account-preferences"],
    queryFn: () => authApi.get<AccountPreferencesData>("/auth/me/preferences"),
  });
  useEffect(() => {
    if (!data) return;
    let lastActivity = Date.now();
    let ended = false;
    const expire = () => {
      if (!ended) {
        ended = true;
        toast.message("Signed out after inactivity.");
        void logout();
      }
    };
    const check = () => {
      if (!hasDemoSession()) {
        void logout();
        return;
      }
      if (Date.now() - lastActivity >= data.inactivityMinutes * 60_000)
        expire();
    };
    const activity = () => {
      check();
      if (!ended) lastActivity = Date.now();
    };
    const events = ["pointerdown", "pointermove", "keydown", "scroll"] as const;
    events.forEach((event) =>
      window.addEventListener(event, activity, {
        passive: true,
        capture: true,
      }),
    );
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 1000);
    const revoked = (event: StorageEvent) => {
      if (event.key === SESSION_GENERATION_KEY && !hasDemoSession())
        void logout();
      else if (event.key?.startsWith(DEMO_STORAGE_PREFIX)) {
        void refreshSession();
        void qc.invalidateQueries();
      }
    };
    window.addEventListener("storage", revoked);
    return () => {
      window.clearInterval(timer);
      events.forEach((event) =>
        window.removeEventListener(event, activity, true),
      );
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("storage", revoked);
    };
  }, [data?.inactivityMinutes, logout, refreshSession, qc]);
  return null;
}
