import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { ApiError } from "@/contexts/DoctorAuthContext";
import { Logo } from "@/components/Logo";
import { TextField } from "@/components/form/FormKit";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

type Step = "who" | "answers" | "email" | "code";
const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

/**
 * Lost both the password and the email: answer five of your security
 * questions, prove a new email with a code, choose a new password. The email
 * route (Forgot password) is the normal way back; this is for when that inbox
 * is gone.
 */
export function Recover() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("who");
  const [identifier, setIdentifier] = useState("");
  const [questions, setQuestions] = useState<{ id: number; text: string }[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, fallback: string) {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(errorText(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  const findQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const r = await authApi.post<{ questions: { id: number; text: string }[] }>("/auth/recover/questions", { identifier: identifier.trim() });
      setQuestions(r.questions);
      setStep("answers");
    }, "Could not start recovery.");
  };

  const checkAnswers = (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.some((q) => !answers[q.id]?.trim())) return toast.error("Answer every question.");
    void run(async () => {
      const r = await authApi.post<{ recoveryToken: string }>("/auth/recover/verify", {
        identifier: identifier.trim(),
        answers: questions.map((q) => ({ id: q.id, answer: answers[q.id].trim() })),
      });
      setToken(r.recoveryToken);
      setStep("email");
    }, "Could not check the answers.");
  };

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const r = await authApi.post<{ devOtp?: string }>("/auth/recover/send-code", { recoveryToken: token, email: email.trim() });
      setDevOtp(r.devOtp);
      setStep("code");
    }, "Could not send the code.");
  };

  const confirm = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await authApi.post("/auth/recover/confirm", { recoveryToken: token, email: email.trim(), otp: otp.trim(), password: pw });
      toast.success("Account recovered. Sign in with your new email and password.");
      navigate("/login", { replace: true });
    }, "Could not recover the account.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Logo className="h-9" suffix="for Doctors" />
        </div>
        <h1 className="text-xl font-semibold">Recover your account</h1>

        {step === "who" && (
          <form onSubmit={findQuestions} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              For when you have lost your password and can no longer open your email. You need the security questions you set in
              Settings.
            </p>
            <TextField label="Email or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus required />
            <Button type="submit" disabled={busy}>{busy ? "Checking..." : "Continue"}</Button>
          </form>
        )}

        {step === "answers" && (
          <form onSubmit={checkAnswers} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Answer all five. Spelling, spaces and capital letters do not matter.</p>
            {questions.map((q) => (
              <TextField key={q.id} label={q.text} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} autoComplete="off" />
            ))}
            <Button type="submit" disabled={busy}>{busy ? "Checking..." : "Check answers"}</Button>
          </form>
        )}

        {step === "email" && (
          <form onSubmit={sendCode} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Answers match. Which email should your account use now? We send a code to it.</p>
            <TextField label="New email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.in" autoFocus required />
            <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send code"}</Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={confirm} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Enter the code sent to {email.trim()} and choose a new password.</p>
            <TextField
              label="Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              hint={devOtp ? `Test server code: ${devOtp}` : undefined}
              required
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              hint="At least 8 characters with a letter, a number and a symbol."
              required
            />
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Recover account"}</Button>
            <button type="button" onClick={() => setStep("email")} className="text-[13px] text-muted-foreground hover:underline">
              Use a different email
            </button>
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
