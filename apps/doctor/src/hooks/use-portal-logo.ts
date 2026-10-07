import { useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/DoctorAuthContext";

const CHANGE_EVENT = "medibank-branding-change";
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Browser-local branding, separate from profile and clinical records. */
export function usePortalLogo() {
  const { user } = useAuth();
  const key = user ? `medibank:portal-logo:${user.id}` : null;
  const logo = useSyncExternalStore(subscribe, () => {
    try { return key ? localStorage.getItem(key) : null; }
    catch { return null; }
  }, () => null);
  function saveLogo(value: string | null) {
    if (!key) throw new Error("Sign in to change your logo.");
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return { logo, saveLogo };
}
