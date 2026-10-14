import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { cn } from "@/lib/utils";

/**
 * Individual account tabs stay consistent on every route. Clinic management
 * remains available through the sidebar; front desk logins retain clinic tabs.
 */
export function SettingsLayout() {
  const { user } = useAuth();
  const isDesk = user?.role === "receptionist";
  const clinicTabs = isDesk;

  const tabs = [
    { to: "/settings/account", label: "Account & security" },
    ...(clinicTabs ? [{ to: "/settings/clinic", label: "Clinic" }, { to: "/settings/doctors", label: "Doctors" }] : []),
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
