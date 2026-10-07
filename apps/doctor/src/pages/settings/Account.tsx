import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Mail, Phone, ShieldQuestion, LogOut, Trash2, AtSign } from "lucide-react";
import { format } from "date-fns";
import { useAuth, ApiError } from "@/contexts/DoctorAuthContext";
import { authApi } from "@/lib/api";
import { useSecurityQuestions } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

/** One setting: icon, what it is, where it stands, and the action. */
function Row({ icon: Icon, label, sub, children }: { icon: typeof Mail; label: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b py-3 last:border-0">
      <Icon className="size-[18px] shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium">{label}</div>
        {sub && <div className="truncate text-[12.5px] text-muted-foreground">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

/**
 * Settings > Account & security. The doctor-portal version of the patient
 * app's account screens: sign-in details, password, security questions,
 * closing the account. A front desk gets its password and Log out only: its
 * other details belong to the doctor who created it.
 */
export function AccountSecurity() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDoctor = user?.role === "doctor";
  const { data: questions } = useSecurityQuestions(isDoctor);
  const [dialog, setDialog] = useState<"email" | "mobile" | "close" | null>(null);
  if (!user) return null;

  const answered = questions?.answered.length ?? 0;
  const minimum = questions?.minimum ?? 5;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {isDoctor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px]">Sign-in details</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <Row icon={Mail} label="Email" sub={user.email}>
              <Button size="sm" variant="outline" onClick={() => setDialog("email")}>Change</Button>
            </Row>
            <Row icon={Phone} label="Mobile number" sub={user.mobile ?? "Not set"}>
              <Button size="sm" variant="outline" onClick={() => setDialog("mobile")}>{user.mobile ? "Change" : "Add"}</Button>
            </Row>
            <Row icon={AtSign} label="Username" sub={user.username ?? "Not set"}>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/profile">Edit in profile</Link>
              </Button>
            </Row>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Security</CardTitle>
        </CardHeader>
        <CardContent className="py-0">
          <Row icon={KeyRound} label="Password" sub="Changing it signs you out everywhere.">
            <Button size="sm" variant="outline" onClick={() => navigate("/change-password")}>Change</Button>
          </Row>
          {isDoctor && (
            <Row
              icon={ShieldQuestion}
              label="Security questions"
              sub={
                answered >= minimum
                  ? `${answered} answered. You can get back in with them if you lose your email and password.`
                  : `${answered} answered. Answer at least ${minimum} to turn on recovery.`
              }
            >
              <Button size="sm" variant="outline" onClick={() => navigate("/settings/security-questions")}>
                {answered ? "Update" : "Set up"}
              </Button>
            </Row>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Account</CardTitle>
        </CardHeader>
        <CardContent className="py-0">
          <Row icon={LogOut} label="Log out" sub="End this session on this device.">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              Log out
            </Button>
          </Row>
          {isDoctor ? (
            <Row icon={Trash2} label="Close account" sub="Closes 30 days after you ask. Sign in before then to keep it.">
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDialog("close")}>
                Close account
              </Button>
            </Row>
          ) : (
            <p className="pb-3 text-[12.5px] text-muted-foreground">
              This front desk login belongs to your doctor. They can change its username or remove it.
            </p>
          )}
        </CardContent>
      </Card>

      {(dialog === "email" || dialog === "mobile") && <ContactDialog kind={dialog} onClose={() => setDialog(null)} />}
      {dialog === "close" && <CloseAccountDialog onClose={() => setDialog(null)} />}
    </div>
  );
}

/**
 * New email or mobile: the current password, then a code sent to the NEW
 * address or number. Nothing changes until that code is entered.
 */
function ContactDialog({ kind, onClose }: { kind: "email" | "mobile"; onClose: () => void }) {
  const { refreshSession } = useAuth();
  const noun = kind === "email" ? "email" : "mobile number";
  const [step, setStep] = useState<"form" | "code">("form");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || !password) return toast.error(`Enter the new ${noun} and your current password.`);
    setBusy(true);
    try {
      const r = await authApi.post<{ devOtp?: string }>(`/auth/me/${kind}/send-code`, { [kind]: value.trim(), currentPassword: password });
      setDevOtp(r.devOtp);
      setStep("code");
    } catch (err) {
      toast.error(errorText(err, "Could not send the code."));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return toast.error("Enter the code.");
    setBusy(true);
    try {
      await authApi.post(`/auth/me/${kind}/verify`, { [kind]: value.trim(), otp: otp.trim() });
      await refreshSession();
      toast.success(kind === "email" ? "Email updated. Sign in with it from now on." : "Mobile number updated.");
      onClose();
    } catch (err) {
      toast.error(errorText(err, "Could not verify the code."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "email" ? "Change email" : "Change mobile number"}</DialogTitle>
          <DialogDescription>
            {step === "form"
              ? `We send a code to the new ${noun}. Nothing changes until you enter it.`
              : `Enter the code sent to ${value.trim()}.`}
          </DialogDescription>
        </DialogHeader>
        {step === "form" ? (
          <form onSubmit={send} className="flex flex-col gap-3">
            <TextField
              label={kind === "email" ? "New email" : "New mobile number"}
              type={kind === "email" ? "email" : "tel"}
              inputMode={kind === "email" ? "email" : "tel"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={kind === "email" ? "you@clinic.in" : "10-digit mobile"}
              autoFocus
            />
            <TextField label="Current password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send code"}</Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={verify} className="flex flex-col gap-3">
            <TextField
              label="Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              hint={devOtp ? `Test server code: ${devOtp}` : undefined}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("form")}>Back</Button>
              <Button type="submit" disabled={busy}>{busy ? "Checking..." : "Confirm"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Two warnings, then the password. The account closes after 30 days, not now. */
function CloseAccountDialog({ onClose }: { onClose: () => void }) {
  const { refreshSession } = useAuth();
  const [step, setStep] = useState<"warn" | "confirm">("warn");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function close(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return toast.error("Enter your password.");
    setBusy(true);
    try {
      await authApi.post("/auth/me/close", { currentPassword: password });
      // The session now carries the date; the portal swaps to the Keep screen.
      await refreshSession();
    } catch (err) {
      toast.error(errorText(err, "Could not close the account."));
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close your account?</DialogTitle>
        </DialogHeader>
        {step === "warn" ? (
          <>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13.5px]">
              <li>It closes 30 days from today. Until then you can sign in and keep it.</li>
              <li>After that you cannot sign in, your front desk login stops working and your clinics close.</li>
              <li>The prescriptions and records you wrote are kept, as the law requires. Patients keep their copies.</li>
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Keep my account</Button>
              <Button variant="destructive" onClick={() => setStep("confirm")}>Continue</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={close} className="flex flex-col gap-3">
            <p className="text-[13.5px]">This is the last step. Enter your password to schedule the closure.</p>
            <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Keep my account</Button>
              <Button type="submit" variant="destructive" disabled={busy}>{busy ? "Closing..." : "Close my account"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Shown instead of the portal while a closure is pending. */
export function KeepAccount({ closesOn }: { closesOn: string }) {
  const { logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function keep() {
    setBusy(true);
    try {
      await authApi.post("/auth/me/keep");
      await refreshSession();
      toast.success("Your account will be kept.");
    } catch (err) {
      toast.error(errorText(err, "Could not keep the account. Try again."));
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center">
        <div className="mb-5 flex justify-center">
          <Logo className="h-8" />
        </div>
        <h2 className="text-lg font-semibold">Your account is closing</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          It closes on <span className="font-medium text-foreground">{format(new Date(closesOn), "d MMM yyyy")}</span>. Keep it and
          everything carries on as before.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={keep} disabled={busy}>{busy ? "Keeping..." : "Keep my account"}</Button>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
