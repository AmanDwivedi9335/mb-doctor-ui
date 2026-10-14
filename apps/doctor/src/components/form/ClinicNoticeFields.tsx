import { Plus, Trash2 } from "lucide-react";
import type { ClinicNotice } from "@/types";
import { activeClinicNotices, clinicToday } from "@/lib/profile-settings";
import { TextField, TextAreaField } from "./FormKit";
import { Button } from "@/components/ui/button";

export function ClinicNoticeFields({
  value,
  onChange,
}: {
  value: ClinicNotice[];
  onChange: (notices: ClinicNotice[]) => void;
}) {
  const today = clinicToday();
  return (
    <section
      className="mt-5 space-y-3 border-t pt-4"
      aria-label="Clinic noticeboard editor"
    >
      <h3 className="text-sm font-semibold">Clinic noticeboard</h3>
      <p className="text-xs text-muted-foreground">
        Choose a date range and write a notice. It appears in clinic and doctor
        listings from the start date through the end date. Notices do not change
        opening hours or appointments.
      </p>
      {value.map((notice, index) => {
        const change = (patch: Partial<ClinicNotice>) =>
          onChange(value.map((n, i) => (i === index ? { ...n, ...patch } : n)));
        const status = activeClinicNotices([notice], today).length
          ? "Active"
          : notice.end && notice.end < today
            ? "Expired"
            : "Scheduled";
        return (
          <div key={notice.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Notice {index + 1} · {status}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove notice ${index + 1}`}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </div>
            <div
              role="group"
              aria-label={`Notice ${index + 1} date range`}
              className="grid gap-3 sm:grid-cols-2"
            >
              <TextField
                label="Start date"
                aria-label={`Notice ${index + 1} start date`}
                type="date"
                value={notice.start}
                required
                onInput={(e) => change({ start: e.currentTarget.value })}
                onChange={(e) => change({ start: e.target.value })}
              />
              <TextField
                label="End date"
                aria-label={`Notice ${index + 1} end date`}
                type="date"
                min={notice.start}
                value={notice.end}
                required
                onInput={(e) => change({ end: e.currentTarget.value })}
                onChange={(e) => change({ end: e.target.value })}
              />
            </div>
            <TextAreaField
              label="Notice"
              aria-label={`Notice ${index + 1} note`}
              rows={3}
              value={notice.note}
              required
              onChange={(e) => change({ note: e.target.value })}
            />
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...value,
            { id: crypto.randomUUID(), start: today, end: today, note: "" },
          ])
        }
      >
        <Plus />
        Add notice
      </Button>
    </section>
  );
}
