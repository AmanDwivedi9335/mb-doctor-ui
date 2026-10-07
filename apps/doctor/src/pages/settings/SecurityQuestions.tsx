import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/contexts/DoctorAuthContext";
import { useSaveSecurityAnswers, useSecurityQuestions } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/**
 * The way back in when both the password and the email are gone: answer five
 * of these, prove a new email, set a new password. Answers are write-only: an
 * answered question shows a tick and an empty box that REPLACES the answer if
 * typed into. Same 15 questions and rules as the patient app.
 */
export function SecurityQuestions() {
  const { data, isLoading } = useSecurityQuestions();
  const save = useSaveSecurityAnswers();
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [password, setPassword] = useState("");

  const answered = new Set(data?.answered ?? []);
  const minimum = data?.minimum ?? 5;
  const typed = Object.entries(draft).filter(([, v]) => v.trim() !== "");
  const willHave = new Set([...answered, ...typed.map(([id]) => Number(id))]).size;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!typed.length) return toast.error("Type at least one answer.");
    if (typed.some(([, v]) => v.trim().length < 2)) return toast.error("Each answer needs at least 2 characters.");
    if (!password) return toast.error("Enter your password to save.");
    try {
      const r = await save.mutateAsync({ currentPassword: password, answers: typed.map(([id, answer]) => ({ id: Number(id), answer: answer.trim() })) });
      setDraft({});
      setPassword("");
      toast.success(r.answered.length >= minimum ? "Saved. Recovery by security questions is on." : "Answers saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Link to="/settings/account" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Account & security
      </Link>

      <div className={cn("rounded-lg px-4 py-3 text-[13px]", answered.size >= minimum ? "bg-emerald-50 text-emerald-900" : "bg-secondary")}>
        {isLoading
          ? "Loading..."
          : answered.size >= minimum
            ? `${answered.size} of ${data!.questions.length} answered. Recovery is on: if you lose your email and password, answer five of these to get back in.`
            : `Answer at least ${minimum} (${answered.size} so far). Pick ones only you would know and that will not change. Spelling, spaces and capital letters do not matter.`}
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-96" />
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-5">
              {data.questions.map((q) => (
                <label key={q.id} className="flex flex-col gap-1.5">
                  <span className="flex items-start gap-1.5 text-[13.5px] font-medium">
                    {answered.has(q.id) && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="Answered" />}
                    {q.text}
                  </span>
                  <Input
                    value={draft[q.id] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [q.id]: e.target.value }))}
                    placeholder={answered.has(q.id) ? "Answered. Type to replace it." : "Your answer"}
                    autoComplete="off"
                  />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 pt-5">
              <TextField
                label="Your password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-w-[220px] flex-1"
                hint={typed.length ? `After saving: ${willHave} answered.` : "Needed to save, so nobody else can set these."}
              />
              <Button type="submit" disabled={save.isPending || !typed.length}>{save.isPending ? "Saving..." : "Save answers"}</Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
