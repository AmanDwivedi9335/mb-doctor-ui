import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { FileText, CalendarDays, ShieldCheck, Bell, Mail, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/DoctorAuthContext";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useInvites, useRespondInvite } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Notification, NotificationKind } from "@/types";

const icons: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  invite: Mail,
  report: FileText,
  appointment: CalendarDays,
  consent: ShieldCheck,
  system: Bell,
};

export function Notifications() {
  const { user, refreshSession } = useAuth();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const isDoctor = user?.role === "doctor";
  const { data: inviteData } = useInvites();
  const respond = useRespondInvite();
  const navigate = useNavigate();

  const items = data?.notifications ?? [];
  const unread = items.filter((n) => !n.read).length;
  const invites = isDoctor ? inviteData?.invites ?? [] : [];

  const answer = (clinicId: string, decision: "accept" | "decline") =>
    respond.mutate(
      { clinicId, decision },
      {
        onSuccess: async () => {
          toast.success(decision === "accept" ? "You joined the clinic. Switch to it from the top bar." : "Invite declined.");
          await refreshSession();
        },
        onError: () => toast.error("Could not answer the invite."),
      }
    );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notifications</h2>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      {invites.length > 0 && (
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Needs your answer</div>
          {invites.map((i) => (
            <div key={i.clinicId} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
              <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{i.clinicName} invited you to join</div>
                <div className="text-[13px] text-muted-foreground">Sent by Dr {i.ownerName}, {formatDistanceToNow(new Date(i.invitedAt), { addSuffix: true })}. You can leave at any time.</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" disabled={respond.isPending} onClick={() => answer(i.clinicId, "accept")}>Accept</Button>
                  <Button size="sm" variant="outline" disabled={respond.isPending} onClick={() => answer(i.clinicId, "decline")}>Decline</Button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : items.length === 0 && invites.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          You are all caught up.
        </div>
      ) : items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          {items.map((n) => (
            <Row
              key={n.id}
              n={n}
              onOpen={() => {
                if (!n.read) markRead.mutate(n.id);
                if (n.href && n.href.startsWith("/")) navigate(n.href);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Row({ n, onOpen }: { n: Notification; onOpen: () => void }) {
  const Icon = icons[n.kind] ?? Bell;
  return (
    <button
      onClick={onOpen}
      className={cn("flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-secondary/60", !n.read && "bg-accent/40")}
    >
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{n.title}</span>
          {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
        </div>
        <div className="text-[13px] text-muted-foreground">{n.body}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(n.at), { addSuffix: true })}</div>
      </div>
    </button>
  );
}
