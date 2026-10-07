import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, XCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { Button } from "@/components/ui/button";

/** Standalone frame for the application screens (no portal shell yet). */
export function ApplyFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Logo className="h-7" suffix="for Doctors" />
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="hidden sm:inline">{user?.email}</span>
          <button
            className="font-medium text-primary hover:underline"
            onClick={() => {
              void logout().then(() => navigate("/login"));
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}

/**
 * Waiting for the admin. Re-reads the session every 30 seconds so an approval
 * moves the doctor on to the plan page without a manual reload.
 */
export function Pending() {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.reviewStatus === "approved") navigate("/settings/subscription", { replace: true });
    if (user?.reviewStatus === "draft") navigate("/apply/onboarding", { replace: true });
  }, [user?.reviewStatus, navigate]);

  useEffect(() => {
    const t = setInterval(() => void refreshSession(), 30_000);
    return () => clearInterval(t);
  }, [refreshSession]);

  const rejected = user?.reviewStatus === "rejected";

  return (
    <ApplyFrame title={rejected ? "Application not approved" : "Application under review"}>
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
          {rejected ? <XCircle className="size-5" /> : <Clock className="size-5" />}
        </div>
        {rejected ? (
          <>
            <p className="text-sm text-muted-foreground">The reviewer left this note:</p>
            <p className="mx-auto mt-2 max-w-md rounded-md bg-secondary px-4 py-3 text-sm">{user?.reviewNote ?? "No note was left."}</p>
            <Button asChild className="mt-5">
              <Link to="/apply/onboarding">Edit and resubmit</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Thanks, {user?.name}. We are checking your registration details and documents. You will get an email when it is
              decided, usually within two working days. This page updates by itself.
            </p>
            <Button variant="outline" className="mt-5" onClick={() => void refreshSession()}>
              Check again
            </Button>
          </>
        )}
      </div>
    </ApplyFrame>
  );
}
