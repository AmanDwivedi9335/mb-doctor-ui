import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Send } from "lucide-react";
import { useCreateTicket } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";

export function ContactUs() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const create = useCreateTicket();
  const whatsapp = import.meta.env.VITE_SUPPORT_WHATSAPP?.replace(/\D/g, "");
  const email = import.meta.env.VITE_SUPPORT_EMAIL?.trim();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error("Subject and message are required.");
    try {
      await create.mutateAsync({ subject: subject.trim(), text: message.trim() });
      setSubject("");
      setMessage("");
      toast.success("Message sent. You can follow replies in Support.");
    } catch {
      toast.error("Could not send your message. Please try again.");
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader><CardTitle>Contact us</CardTitle><p className="text-sm text-muted-foreground">Send the MediBank team a question or tell us how we can help.</p></CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form onSubmit={send} className="flex flex-col gap-3">
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <TextAreaField label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/support" className="text-sm text-primary hover:underline">View messages and replies</Link>
            <Button type="submit" disabled={create.isPending}><Send />{create.isPending ? "Sending..." : "Send"}</Button>
          </div>
        </form>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {whatsapp ? <Button asChild variant="outline"><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle />WhatsApp support</a></Button> : <Button variant="outline" disabled><MessageCircle />WhatsApp support</Button>}
          {email ? <Button asChild variant="outline"><a href={`mailto:${email}`}><Mail />Email support</a></Button> : <Button variant="outline" disabled><Mail />Email support</Button>}
        </div>
        {(!whatsapp || !email) && <p className="text-xs text-muted-foreground">Direct support contact details will be available soon. You can send a message using the form above.</p>}
      </CardContent>
    </Card>
  );
}
