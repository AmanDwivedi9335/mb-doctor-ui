import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { Button } from "@/components/ui/button";
import { KeepAccount } from "@/pages/settings/Account";

/**
 * Gate for authenticated routes. Waits for the mount-time revalidation to
 * finish before deciding, so a real session never bounces to /login on reload.
 *
 *   stage "session"  any signed-in user (application screens, payment result)
 *   stage "portal"   approved AND paid (when enforced), the shell itself
 *
 * The backend answers 403 application_pending / 402 subscription_required on
 * every gated call anyway; this only decides which screen the user lands on.
 */
export function ProtectedRoute({ children, stage = "portal" }: { children: React.ReactNode; stage?: "session" | "portal" }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // A pending closure replaces the whole portal until they keep it or leave.
  if (stage === "portal" && user.role === "doctor" && user.deletionScheduledFor) {
    return <KeepAccount closesOn={user.deletionScheduledFor} />;
  }

  if (stage === "portal" && user.role === "doctor") {
    if (user.reviewStatus === "submitted") return <Navigate to="/apply/pending" replace />;
    if (user.reviewStatus === "draft" || user.reviewStatus === "rejected") return <Navigate to="/apply/onboarding" replace />;
    const unpaid = !!user.plan?.enforced && !user.plan.active;
    // Account settings stay open without a plan: a lapsed doctor can still close the account or fix their sign-in.
    const allowed = ["/settings/subscription", "/settings/account", "/settings/security-questions", "/change-password"].includes(location.pathname);
    if (unpaid && !allowed) return <Navigate to="/settings/subscription" replace />;
  }

  if (stage === "portal" && user.role === "receptionist" && user.plan?.enforced && !user.plan.isPro) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md rounded-lg border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">The front desk needs a Pro plan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This login belongs to a doctor whose Pro plan has ended. Ask them to renew it from their portal, then sign in again.
          </p>
          <Button asChild className="mt-5" variant="outline">
            <a href="/login">Back to sign in</a>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
