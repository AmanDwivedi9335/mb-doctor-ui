import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useBrowserSetting } from "./use-browser-setting";
import type { ManualAppointmentStatus } from "@/lib/appointment-status";
const EMPTY_STATUSES: Record<string, ManualAppointmentStatus> = {};
export function useAppointmentUi() {
  const { user, activeClinicId } = useAuth();
  const [statuses, save] = useBrowserSetting(`appointment-status:${user?.id ?? "anonymous"}:${activeClinicId ?? "practice"}`, EMPTY_STATUSES);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return { statuses, now, saveStatus: (id: string, value: ManualAppointmentStatus) => save({ ...statuses, [id]: value }) };
}
export function useLocalClinicQr(clinicId: string | null) {
  return useBrowserSetting<string | null>(`clinic-payment-qr:${clinicId ?? "none"}`, null);
}
