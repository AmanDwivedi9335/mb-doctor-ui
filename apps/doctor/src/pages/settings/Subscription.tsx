import { Check } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useSubscription, useSubscriptionHistory, usePlans, useCheckout } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type Column } from "@/components/clinical/DataTable";
import { toast } from "@/components/ui/sonner";
import { ApiError } from "@myanodex/shared/api-client";
import { cn } from "@/lib/utils";
import type { SubscriptionEvent } from "@/types";

const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const day = (iso: string | null) => (iso ? format(new Date(iso), "d MMM yyyy") : "");

/**
 * Plans are monthly and paid through the ICICI gateway: Choose sends the
 * browser to the hosted page, which bounces back to /payment. Upgrade any
 * time (the month stacks on the current end); a downgrade waits for the Pro
 * month to end.
 */
export function Subscription() {
  const { user } = useAuth();
  const { data: sub, isLoading } = useSubscription();
  const { data: hist } = useSubscriptionHistory();
  const { data: plansData } = usePlans();
  const checkout = useCheckout();

  if (isLoading || !sub) return <Skeleton className="h-96" />;

  const plans = plansData?.plans ?? [];
  const live = sub.status === "active";
  const unpaid = !!sub.enforced && !live;

  const historyCols: Column<SubscriptionEvent>[] = [
    { key: "date", header: "Date", className: "tabular-nums whitespace-nowrap", render: (e) => day(e.date) },
    { key: "desc", header: "Payment", render: (e) => e.description },
    { key: "amount", header: "Amount", className: "tabular-nums text-right", render: (e) => (e.amount ? rupee(e.amount) : "") },
  ];

  const choose = (code: string, name: string) =>
    checkout.mutate(code, {
      onSuccess: ({ paymentUrl }) => {
        toast.message(`Taking you to the payment page for ${name}.`);
        window.location.assign(paymentUrl);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not start the payment."),
    });

  return (
    <div className="flex flex-col gap-5">
      {unpaid && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {sub.suspendedAt
            ? "This account is suspended. Buying a plan reactivates it right away."
            : sub.status === "expired"
              ? "Your plan has ended. Choose a plan to keep using the portal."
              : "Welcome, your application is approved. Choose a plan to open the portal."}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Current plan</CardTitle>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {live && sub.renewsAt ? `Runs until ${day(sub.renewsAt)}. Renew any time; the month is added on.` : "No active plan"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{sub.planName ?? "None"}</span>
            {live ? <Badge variant="success">Active</Badge> : sub.status === "expired" ? <Badge variant="warning">Ended</Badge> : null}
          </div>
        </CardHeader>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Plans</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((p) => {
            const current = live && p.code === sub.plan;
            const downgrade = live && !!sub.isPro && !p.pro;
            return (
              <Card key={p.code} className={cn(current && "border-primary ring-1 ring-primary")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px]">{p.name}</CardTitle>
                    {current && <Badge variant="primary">Current</Badge>}
                  </div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {rupee(p.priceMonthly)}
                    <span className="text-[12px] font-normal text-muted-foreground">/month, GST included</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <ul className="flex flex-col gap-1.5 text-[13px]">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={current ? "outline" : "default"}
                    disabled={checkout.isPending || downgrade || user?.role !== "doctor"}
                    onClick={() => choose(p.code, p.name)}
                  >
                    {current ? "Renew a month" : downgrade ? `After your Pro plan ends` : live ? `Switch to ${p.name}` : `Choose ${p.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Payments</h3>
        <DataTable columns={historyCols} rows={hist?.history ?? []} getRowKey={(e) => e.id} empty="No payments yet." />
      </div>
    </div>
  );
}
