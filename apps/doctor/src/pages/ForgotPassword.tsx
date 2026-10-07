import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { authApi } from "@/lib/api";
import { ApiError } from "@myanodex/shared/api-client";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";

type Step = "email" | "otp" | "reset";

/**
 * Password recovery: email -> code -> new password. One page, three steps, so
 * the user keeps context instead of bouncing between routes. The code is
 * exchanged for a short-lived reset token, which the last step sends back.
 */
export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await authApi.post("/auth/forgot-password", { email: email.trim() });
      toast.success("If that email is registered, a code is on its way.");
      setStep("otp");
    });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const r = await authApi.post<{ verified: boolean; resetToken: string }>("/auth/verify-otp", { email: email.trim(), otp: otp.trim() });
      setResetToken(r.resetToken);
      setStep("reset");
    });
  };

  const reset = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    run(async () => {
      await authApi.post("/auth/reset-password", { email: email.trim(), password: pw, resetToken });
      toast.success("Password reset. Please sign in.");
      navigate("/login");
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Logo className="h-9" suffix="for Doctors" />
        </div>

        <h1 className="text-xl font-semibold">Reset your password</h1>

        {step === "email" && (
          <form onSubmit={sendOtp} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Enter your email and we will send a verification code.</p>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.in" required />
            <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send code"}</Button>
            <Link to="/recover" className="text-center text-[13px] text-muted-foreground hover:underline">
              Lost access to your email? Use your security questions
            </Link>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verify} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Enter the 6-digit code we emailed to {email}.</p>
            <TextField label="Code" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required />
            <Button type="submit" disabled={busy}>{busy ? "Checking..." : "Verify"}</Button>
            <button type="button" onClick={() => setStep("email")} className="text-[13px] text-muted-foreground hover:underline">
              Use a different email
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={reset} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Choose a new password: at least 8 characters with a letter, a number and a symbol.</p>
            <TextField label="New password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Set password"}</Button>
          </form>
        )}

        <p className="mt-6 text-[13px] text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
