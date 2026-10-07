import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth, ApiError } from "@/contexts/DoctorAuthContext";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const ROLES: Array<{ value: Role; label: string }> = [
  { value: "doctor", label: "Doctor" },
  { value: "receptionist", label: "Front desk" },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [role, setRole] = useState<Role>("doctor");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(identifier.trim(), password, role);
      // The route guard sends an applicant to their application and an unpaid
      // doctor to the plan page; everyone else lands where they were going.
      navigate(from === "/login" ? "/" : from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Logo className="h-10" suffix="for Doctors" />
        <div>
          <h2 className="max-w-sm text-2xl font-semibold leading-snug">
            Your window to a patient's health.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-sidebar-muted">
            Look up a patient by their MID, review records they have shared with you, and record
            care. Consent stays with the patient.
          </p>
        </div>
        <div className="text-[12px] text-sidebar-muted">MediBank for Doctors</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-background p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back. Enter your details.</p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  role === r.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <TextField
              label="Email or username"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={role === "doctor" ? "you@clinic.in or your username" : "Front desk username"}
              required
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-[13px] font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}

          <Button type="submit" className="mt-5 w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>

          {role === "doctor" && (
            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              New to MediBank?{" "}
              <Link to="/apply" className="font-medium text-primary hover:underline">
                Apply for a doctor account
              </Link>
            </p>
          )}

          {import.meta.env.VITE_ENABLE_MOCKS === "true" && (
            <aside className="mt-5 rounded-xl border border-primary/20 bg-accent p-4" aria-label="Demo login credentials">
              <h2 className="text-sm font-semibold text-primary">Demo login</h2>
              <p className="mt-1 text-xs text-muted-foreground">Select Doctor and sign in with:</p>
              <dl className="mt-3 space-y-2 text-[13px]">
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Email</dt><dd className="font-medium select-text">dr.mehta@test.com</dd></div>
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Password</dt><dd className="font-mono font-medium select-text">doctor123</dd></div>
              </dl>
            </aside>
          )}
        </form>
      </div>
    </div>
  );
}
