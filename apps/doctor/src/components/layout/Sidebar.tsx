import appPackage from "../../../package.json";
import { usePortalLogo } from "@/hooks/use-portal-logo";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Stethoscope,
  Search,
  UserPlus,
  UserRound,
  ClipboardList,
  Syringe,
  FileText,
  CalendarCheck,
  HeartPulse,
  Building2,
  CalendarDays,
  Receipt,
  Settings as SettingsIcon,
  BarChart3,
  Users,
  LogOut,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useSelectedPatient } from "@/contexts/SelectedPatientContext";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useFeatureFlags } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** One nav leaf. Link when it has a destination, muted div when disabled. */
function Row({
  icon: Icon,
  label,
  to,
  active,
  disabled,
  onNavigate,
  indent,
}: {
  icon?: LucideIcon;
  label: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  const cls = cn(
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
    indent ? (Icon ? "ml-6" : "pl-9") : "",
    active
      ? "bg-sidebar-accent font-semibold text-primary"
      : disabled
        ? "cursor-not-allowed text-sidebar-muted/40"
        : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
  );
  const inner = (
    <>
      {Icon && <Icon className="size-[17px] shrink-0" strokeWidth={2} />}
      <span className="truncate">{label}</span>
    </>
  );
  if (to && !disabled)
    return (
      <Link to={to} onClick={onNavigate} className={cls}>
        {inner}
      </Link>
    );
  return (
    <div className={cls} aria-disabled={disabled}>
      {inner}
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logo } = usePortalLogo();
  const { pathname, search } = useLocation();
  const { mid } = useSelectedPatient();
  const { user, activeClinicId, logout } = useAuth();
  const navigate = useNavigate();
  const { data: flags } = useFeatureFlags();
  const showHealthGraph = !!flags?.flags?.health_graph;
  const tab = new URLSearchParams(search).get("tab") || "summary";

  const isDesk = user?.role === "receptionist";
  const isPro = !!user?.plan?.isPro;
  const showConsult = !isDesk;
  const showClinic = isDesk || isPro;
  // A basic doctor invited into a clinic still gets their own queue there.
  const memberQueue = !isDesk && !isPro && !!activeClinicId;

  const inSettings = pathname.startsWith("/settings/clinic") || pathname.startsWith("/settings/doctors") || pathname.startsWith("/settings/staff");

  const clinicRoute = inSettings || pathname === "/dashboard" || pathname === "/billing" || pathname.startsWith("/analytics/") || (showClinic && pathname === "/appointments");
  const [mode, setMode] = useState<"consultation" | "clinic">(clinicRoute ? "clinic" : "consultation");
  const selectedMode = showConsult && showClinic ? mode : showClinic ? "clinic" : "consultation";
  const [settingsOpen, setSettingsOpen] = useState(inSettings);

  // Consultation leaves point at the selected patient's workspace tab.
  const pt = (t: string) => (mid ? `/patients/${mid}?tab=${t}` : undefined);
  const tabActive = (t: string) => !!mid && pathname === `/patients/${mid}` && tab === t;

  return (
    <aside className="portal-sidebar flex h-full w-[224px] flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="border-b border-sidebar-accent px-5 py-6">
        {logo ? <img src={logo} alt="Practice logo" className="mx-auto h-16 w-full object-contain" /> : <div className="flex h-16 items-center justify-center rounded-lg bg-secondary text-xs font-medium text-muted-foreground">Practice logo</div>}
      </div>

      <nav className="scroll-area flex-1 overflow-y-auto px-3 pb-2">
        {/* The desk has no Consultation group, so its Dashboard (its home) stays up top. */}
        {isDesk && <Row icon={LayoutGrid} label="Dashboard" to="/" active={pathname === "/"} onNavigate={onNavigate} />}

        {showConsult && showClinic && (
          <div role="group" aria-label="Navigation section" className="sidebar-mode-switch my-3 grid grid-cols-2 gap-1 rounded-xl border border-border p-1">
            <button aria-pressed={selectedMode === "consultation"} onClick={() => setMode("consultation")}><Stethoscope className="size-4" />Consultation</button>
            <button aria-pressed={selectedMode === "clinic"} onClick={() => setMode("clinic")}><Building2 className="size-4" />Clinic Management</button>
          </div>
        )}

        {showConsult && selectedMode === "consultation" && (
          <div className="mb-1 mt-0.5 flex flex-col gap-0.5">
                <Row icon={Search} label="Home" to="/" active={pathname === "/"} onNavigate={onNavigate} indent />
                <Row icon={UserPlus} label="Walk-in Rx" to="/walk-in" active={pathname === "/walk-in"} onNavigate={onNavigate} indent />
                <Row icon={UserRound} label="Patient Summary" to={pt("summary")} active={tabActive("summary")} disabled={!mid} onNavigate={onNavigate} indent />
                <Row icon={ClipboardList} label="Consultations" to={pt("diagnosis")} active={tabActive("diagnosis")} disabled={!mid} onNavigate={onNavigate} indent />
                <Row icon={Syringe} label="Procedure" to={pt("procedures")} active={tabActive("procedures")} disabled={!mid} onNavigate={onNavigate} indent />
                <Row icon={FileText} label="Report" to={pt("reports")} active={tabActive("reports")} disabled={!mid} onNavigate={onNavigate} indent />
                <Row icon={CalendarCheck} label="Patient history" to={pt("followups")} active={tabActive("followups")} disabled={!mid} onNavigate={onNavigate} indent />
                {showHealthGraph && (
                  <Row icon={HeartPulse} label="Health graph" to={pt("health")} active={tabActive("health")} disabled={!mid} onNavigate={onNavigate} indent />
                )}
                {memberQueue && (
                  <Row icon={CalendarDays} label="My queue" to="/appointments" active={pathname === "/appointments"} onNavigate={onNavigate} indent />
                )}
          </div>
        )}

        {showClinic && selectedMode === "clinic" && (
          <div className="mb-1 mt-0.5 flex flex-col gap-0.5">
                <Row icon={CalendarDays} label="Appointments" to="/appointments" active={pathname === "/appointments"} onNavigate={onNavigate} indent />
                <Row icon={Receipt} label="Billing" to="/billing" active={pathname === "/billing"} onNavigate={onNavigate} indent />
                <Row icon={LayoutGrid} label="Dashboard" to="/dashboard" active={pathname === "/dashboard"} onNavigate={onNavigate} indent />
                <Row icon={Users} label="Patient analytics" to="/analytics/patients" active={pathname === "/analytics/patients"} onNavigate={onNavigate} indent />
                <Row icon={BarChart3} label="Billing analytics" to="/analytics/billing" active={pathname === "/analytics/billing"} onNavigate={onNavigate} indent />

                <button
                  onClick={() => setSettingsOpen((o) => !o)}
                  className={cn(
                    "ml-6 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                    inSettings ? "font-medium text-primary" : "text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground"
                  )}
                >
                  <SettingsIcon className="size-[17px] shrink-0" strokeWidth={2} />
                  <span className="flex-1 text-left">Clinic settings</span>
                  <ChevronDown className={cn("size-3.5 text-sidebar-muted transition-transform", settingsOpen && "rotate-180")} />
                </button>
                {settingsOpen && (
                  <div className="flex flex-col gap-0.5">
                    <Row label="Clinic's Profile" to="/settings/clinic" active={pathname === "/settings/clinic"} onNavigate={onNavigate} indent />
                    <Row label="Doctors" to="/settings/doctors" active={pathname === "/settings/doctors"} onNavigate={onNavigate} indent />
                    {!isDesk && <Row label="Front desk" to="/settings/staff" active={pathname === "/settings/staff"} onNavigate={onNavigate} indent />}
                  </div>
                )}
          </div>
        )}

      </nav>

      {/* Log out, pinned */}
      <div className="flex flex-col gap-0.5 border-t border-sidebar-accent px-3 py-3">
        {/* Solid red, full width: same as the patient app's sidebar. */}
        <Button
          size="sm"
          variant="destructive"
          className="mt-1 w-full"
          onClick={async () => {
            onNavigate?.();
            await logout();
            navigate("/login");
          }}
        >
          <LogOut /> Log out
        </Button>
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <Logo className="h-5" />
          <span className="text-[10px] text-muted-foreground">Version {appPackage.version}</span>
        </div>
      </div>
    </aside>
  );
}
