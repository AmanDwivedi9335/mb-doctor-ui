/** Page title shown in the topbar, derived from the current path. */
const TITLES: Record<string, string> = {
  "/": "Search MID",
  "/dashboard": "Dashboard",
  "/walk-in": "Walk-in Rx",
  "/history": "History",
  "/appointments": "Appointments",
  "/billing": "Billing",
  "/analytics/patients": "Patient analytics",
  "/analytics/billing": "Billing analytics",
  "/support": "Support",
  "/notifications": "Notifications",
  "/profile": "Doctor's Profile",
  "/help": "Help & Tutorial",
  "/change-password": "Change password",
  "/settings/clinic": "Clinic's Profile",
  "/settings/account": "Account & security",
  "/settings/security-questions": "Security questions",
  "/settings/subscription": "Subscription",
  "/settings/faqs": "FAQ's",
  "/settings/doctors": "Doctors",
  "/settings/staff": "Front desk",
  "/payment": "Payment",
};

export const titleForPath = (path: string): string => {
  if (path.startsWith("/patients/")) return "Patient";
  if (path === "/settings") return "Settings";
  return TITLES[path] ?? "MediBank for Doctors";
};
