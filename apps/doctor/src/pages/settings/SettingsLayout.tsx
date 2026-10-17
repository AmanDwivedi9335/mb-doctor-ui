import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Keep shared settings tabs in the account or clinic section they came from. */
export function SettingsLayout() {
  const { pathname, state } = useLocation();
  const isClinic = ["/settings/clinic", "/settings/doctors", "/settings/staff"].includes(pathname)
    || (["/settings/subscription", "/settings/contact"].includes(pathname)
      && state?.settingsSection === "clinic");
  const settingsSection = isClinic ? "clinic" : "account";

  const tabs = [
    isClinic
      ? { to: "/settings/clinic", label: "Clinic Details" }
      : { to: "/settings/account", label: "Account & security" },
    { to: "/settings/subscription", label: "Subscription" },
    { to: "/settings/contact", label: "Contact us" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold">Settings</h2>
      {!["/settings/doctors", "/settings/staff"].includes(pathname) && <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            state={{ settingsSection }}
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
      </div>}
      <Outlet />
    </div>
  );
}
