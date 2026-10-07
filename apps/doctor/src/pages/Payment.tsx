import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useOrderStatus } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { ApplyFrame } from "./apply/Pending";

/**
 * Where the gateway sends the browser back. The backend has probably already
 * settled the order by the time this renders; if the payment is still
 * confirming (UPI), the poll keeps asking every few seconds.
 */
export function Payment() {
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const { refreshSession } = useAuth();
  const { data, error } = useOrderStatus(ref);

  useEffect(() => {
    if (data?.status === "success") void refreshSession();
  }, [data?.status, refreshSession]);

  const state = !ref ? "missing" : error ? "error" : !data || data.status === "pending" ? "pending" : data.status;

  return (
    <ApplyFrame title="Payment">
      <div className="rounded-lg border bg-card p-8 text-center">
        {state === "pending" && (
          <>
            <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Confirming your payment with the bank. This can take a moment for UPI.</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 size-10 text-success" />
            <h2 className="text-lg font-semibold">Plan active</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.entitlement.planCode ? `${data.entitlement.planCode === "pro" ? "Pro" : "Basic"} plan` : "Your plan"} runs until{" "}
              {data?.entitlement.endsAt ? new Date(data.entitlement.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "next month"}.
              A receipt is on its way to your email.
            </p>
            <Button asChild className="mt-5">
              <Link to="/">Open the portal</Link>
            </Button>
          </>
        )}
        {(state === "failed" || state === "error" || state === "missing") && (
          <>
            <XCircle className="mx-auto mb-4 size-10 text-destructive" />
            <h2 className="text-lg font-semibold">{state === "failed" ? "Payment did not go through" : "We could not find that payment"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {state === "failed" ? "Nothing was charged. You can try again with another method." : "If money left your account, it is refunded automatically. Try again from the plan page."}
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link to="/settings/subscription">Back to plans</Link>
            </Button>
          </>
        )}
      </div>
    </ApplyFrame>
  );
}
