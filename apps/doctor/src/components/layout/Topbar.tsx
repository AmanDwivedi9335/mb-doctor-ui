import { NavLink, useNavigate } from "react-router-dom";
import { Menu, Bell, History, ChevronDown, LogOut, Settings, UserRound, Building2, Sun, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useNotifications } from "@/hooks/use-api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name.replace(/^Dr\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function greeting(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout, activeClinicId, setActiveClinic } = useAuth();
  const navigate = useNavigate();
  // The bell is behind the paywall; an approved-but-unpaid doctor on the plan page would 402 every 30s.
  const { data: notifs } = useNotifications(!(user?.plan?.enforced && !user.plan.active));
  const unread = notifs?.unreadCount ?? (notifs?.notifications ?? []).filter((n) => !n.read).length;

  const isDesk = user?.role === "receptionist";
  const clinics = user?.clinics ?? [];
  // The switch: a doctor also has their own practice; a desk only has clinics.
  const showSwitcher = clinics.length > 0;

  return (
    <header className="portal-topbar flex min-h-[76px] shrink-0 flex-wrap items-center gap-3 px-4 py-3 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>

      {user && (
        <h1 className="hidden items-center gap-2 truncate text-[16px] font-bold text-primary sm:flex">
          <Sun className="size-6 shrink-0 text-amber-400" /> {greeting(new Date().getHours())}, {isDesk ? user.name : `Dr. ${user.name.replace(/^Dr\.?\s+/i, "")}`}
        </h1>
      )}

      {showSwitcher && (
        <label className="flex items-center gap-2 rounded-lg bg-transparent py-1 pl-3 pr-2 text-[13px]">
          <Building2 className="size-4 text-muted-foreground" />
          <select
            aria-label="Active clinic"
            value={activeClinicId ?? ""}
            onChange={(e) => {
              setActiveClinic(e.target.value || null);
              navigate("/");
            }}
            className="max-w-[14rem] bg-transparent pr-1 font-medium outline-none"
          >
            {!isDesk && <option value="">My practice</option>}
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.role === "member" ? " (member)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex-1" />

      {/* User chip */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg bg-transparent py-1 pl-1 pr-2.5 hover:bg-secondary/70">
              <Avatar className="size-8">
                <AvatarFallback className="bg-secondary text-foreground">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-[13px] font-semibold">{user.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {isDesk ? "Front desk" : user.specialization ?? "Doctor"}
                  {user.plan?.name ? ` · ${user.plan.name}` : ""}
                </div>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user.email.endsWith("@desk.local") ? user.username : user.email}
              {user.doctorNo && <div className="font-mono text-[11px] font-normal text-muted-foreground">{user.doctorNo}</div>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!isDesk && (
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                <UserRound /> Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => navigate("/help")}>
              <HelpCircle /> Help &amp; Tutorial
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/settings/account")}>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                await logout();
                navigate("/login");
              }}
            >
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <NavLink
        to="/history"
        className={({ isActive }) => `grid size-9 shrink-0 place-items-center rounded-full ${isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        aria-label="History"
        title="History"
      >
        <History className="size-[18px]" />
      </NavLink>

      {/* Bell */}
      <NavLink
        to="/notifications"
        className={({ isActive }) => `relative grid size-9 shrink-0 place-items-center rounded-full ${isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        aria-label="Notifications"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[15px] place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-[15px] text-destructive-foreground">
            {unread}
          </span>
        )}
      </NavLink>
    </header>
  );
}
