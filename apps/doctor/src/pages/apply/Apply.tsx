import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { authApi } from "@/lib/api";
import { ApiError } from "@myanodex/shared/api-client";
import { useAuth, type LoginResponse } from "@/contexts/DoctorAuthContext";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";

/**
 * Apply for a doctor account: prove the email with a code, then choose a
 * username and password. The account exists from here on, but the portal
 * stays closed until an admin approves the application and a plan is bought.
 */
export function Apply() {
  const navigate = useNavigate();
  const { adopt } = useAuth();
  const [step, setStep] = useState<"email" | "details">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const r = await authApi.post<{ message: string; devOtp?: string }>("/auth/apply/send-code", { email: email.trim() });
      if (r.devOtp) setCode(r.devOtp);
      toast.success("Check your email for the code.");
      setStep("details");
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await authApi.post<LoginResponse>("/auth/apply", {
        email: email.trim(),
        code: code.trim(),
        name: name.trim(),
        mobile: mobile.trim(),
        username: username.trim().toLowerCase(),
        password,
      });
      adopt(res);
      navigate("/apply/onboarding", { replace: true });
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Logo className="h-9" suffix="for Doctors" />
        </div>

        <h1 className="text-xl font-semibold">Apply for a doctor account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three steps: verify your email, fill in your registration details and documents, then choose a plan once the
          application is approved.
        </p>

        {step === "email" && (
          <form onSubmit={sendCode} className="mt-5 flex flex-col gap-3">
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.in" required autoFocus />
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send verification code"}</Button>
          </form>
        )}

        {step === "details" && (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
            <TextField label="Verification code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code from your email" required />
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr Anand Mehta" required />
            <TextField label="Mobile" inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" required />
            <TextField
              label="Username"
              hint="4 to 32 characters: letters, numbers, dots or underscores. Clinics invite you by this."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="dr.mehta"
              required
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters with a letter, a number and a symbol."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Creating..." : "Create account"}</Button>
            <button type="button" onClick={() => setStep("email")} className="text-[13px] text-muted-foreground hover:underline">
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-6 text-[13px] text-muted-foreground">
          Already applied?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
