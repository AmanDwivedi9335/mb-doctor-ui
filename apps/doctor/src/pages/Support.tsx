import { useEffect, useState } from "react";
import { Plus, Send } from "lucide-react";
import { format } from "date-fns";
import { useTickets, useCreateTicket, useReplyTicket, useMarkTicketRead } from "@/hooks/use-api";
import { useForm } from "@/hooks/use-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TextField, TextAreaField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { SupportTicket } from "@/types";

const statusVariant = { open: "primary", pending: "warning", resolved: "success" } as const;

export function Support() {
  const { data, isLoading } = useTickets();
  const create = useCreateTicket();
  const reply = useReplyTicket();
  const markRead = useMarkTicketRead();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const nt = useForm({ subject: "", text: "" });

  const tickets = data?.tickets ?? [];
  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0] ?? null;

  useEffect(() => {
    if (selected?.unread) markRead.mutate(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!nt.f.subject.trim() || !nt.f.text.trim()) return toast.error("Subject and message are required.");
    try {
      const t = await create.mutateAsync({ subject: nt.f.subject.trim(), text: nt.f.text.trim() });
      toast.success("Ticket created.");
      nt.seed({ subject: "", text: "" });
      setNewOpen(false);
      setSelectedId(t.id);
    } catch {
      toast.error("Could not create ticket.");
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    try {
      await reply.mutateAsync({ id: selected.id, text: replyText.trim() });
      setReplyText("");
    } catch {
      toast.error("Could not send.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Support</h2>
        <Button onClick={() => setNewOpen(true)}>
          <Plus /> New ticket
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          No tickets yet. Open one and the MediBank team will reply here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          {/* Ticket list */}
          <div className="flex flex-col gap-1.5">
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} active={selected?.id === t.id} onClick={() => setSelectedId(t.id)} />
            ))}
          </div>

          {/* Thread */}
          {selected && (
            <div className="flex flex-col rounded-lg border bg-card">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{selected.subject}</div>
                  <div className="text-[12px] text-muted-foreground">Opened {format(new Date(selected.createdAt), "d MMM yyyy")}</div>
                </div>
                <Badge variant={statusVariant[selected.status]} className="capitalize">{selected.status}</Badge>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                {selected.messages.map((m) => (
                  <div key={m.id} className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", m.from === "doctor" ? "self-end bg-primary text-primary-foreground" : "self-start bg-secondary")}>
                    <div>{m.text}</div>
                    <div className={cn("mt-1 text-[11px]", m.from === "doctor" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {format(new Date(m.at), "d MMM, h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t p-3">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Write a reply"
                />
                <Button size="icon" onClick={sendReply} disabled={reply.isPending || !replyText.trim()} aria-label="Send">
                  <Send />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New support ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTicket} className="flex flex-col gap-3">
            <TextField label="Subject" value={nt.f.subject} onChange={(e) => nt.setF("subject", e.target.value)} autoFocus />
            <TextAreaField label="Message" value={nt.f.text} onChange={(e) => nt.setF("text", e.target.value)} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Sending..." : "Create ticket"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TicketRow({ ticket, active, onClick }: { ticket: SupportTicket; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-md border px-3 py-2.5 text-left transition-colors", active ? "border-primary bg-accent" : "bg-card hover:bg-secondary")}
    >
      <div className="flex items-center gap-2">
        {ticket.unread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
        <span className="truncate text-[13px] font-medium">{ticket.subject}</span>
      </div>
      <div className="mt-0.5 text-[11px] capitalize text-muted-foreground">{ticket.status}</div>
    </button>
  );
}
