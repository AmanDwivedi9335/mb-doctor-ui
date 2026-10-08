import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { cn } from "@/lib/utils";

/**
 * Tabs by login: everyone gets Account & security; a basic doctor then only
 * Subscription and Contact us (Clinic Management is Pro); a front desk sees the
 * clinic tabs but not the plan.
 */
export function SettingsLayout() {
  const { user } = useAuth();
  const isDesk = user?.role === "receptionist";
  const clinicTabs = isDesk || !!user?.plan?.isPro;

  const tabs = [
    { to: "/settings/account", label: "Account & security" },
    ...(clinicTabs ? [{ to: "/settings/clinic", label: "Clinic" }, { to: "/settings/doctors", label: "Doctors" }] : []),
    ...(clinicTabs && !isDesk ? [{ to: "/settings/staff", label: "Front desk" }] : []),
    ...(!isDesk ? [{ to: "/settings/subscription", label: "Subscription" }] : []),
    { to: "/settings/contact", label: "Contact us" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                "border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
