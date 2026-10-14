import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClinicOperatingDay } from "@/types";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/FormKit";
import { toast } from "@/components/ui/sonner";

const DAYS: ClinicOperatingDay["day"][] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
export function DoctorWorkingHours({
  clinicId,
  doctorId,
  doctorName,
  canEdit,
}: {
  clinicId: string;
  doctorId: string;
  doctorName: string;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const path = `/clinics/${clinicId}/doctors/${doctorId}/hours`;
  const { data, error } = useQuery({
    queryKey: ["doctor", "working-hours", clinicId, doctorId],
    queryFn: () => api.get<{ hours: ClinicOperatingDay[] }>(path),
  });
  const [hours, setHours] = useState<ClinicOperatingDay[]>([]);
  const [editing, setEditing] = useState(false);
  const change = (index: number, patch: Partial<ClinicOperatingDay>) =>
    setHours((previous) =>
      previous.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  useEffect(() => {
    if (data && !editing)
      setHours(
        DAYS.map(
          (day) =>
            data.hours.find((h) => h.day === day) ?? {
              day,
              closed: true,
              opens: "09:00",
              closes: "17:00",
            },
        ),
      );
  }, [data, editing]);
  const save = useMutation({
    mutationFn: () => api.put(path, { hours }),
    onSuccess: async () => {
      setEditing(false);
      await qc.invalidateQueries({ queryKey: ["doctor"] });
      toast.success("Working hours saved.");
    },
    onError: (e) => toast.error(e.message),
  });
  if (error)
    return (
      <p className="text-xs text-destructive">
        Could not load this doctor’s working hours.
      </p>
    );
  if (!data) return <p className="text-xs">Loading working hours…</p>;
  return (
    <details className="mt-3 border-t pt-3">
      <summary className="cursor-pointer text-sm font-medium">
        Working hours
      </summary>
      <div className="mt-3 space-y-3">
        {!editing && (
          <>
            {data.hours.length ? (
              data.hours.map((h) => (
                <p key={h.day} className="text-xs capitalize">
                  {h.day}: {h.closed ? "Not working" : `${h.opens}–${h.closes}`}
                </p>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No working hours assigned.
              </p>
            )}
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Assign working hours
              </Button>
            )}
          </>
        )}
        {editing && (
          <>
            <p className="text-xs text-muted-foreground">
              These are this doctor’s hours at this clinic, separate from clinic
              opening hours.
            </p>
            {hours.map((h, index) => (
              <div key={h.day} className="space-y-2 rounded-lg border p-2">
                <label className="flex items-center gap-2 text-xs capitalize">
                  <input
                    type="checkbox"
                    checked={!h.closed}
                    onChange={(e) =>
                      change(index, { closed: !e.target.checked })
                    }
                  />
                  {h.day}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="From"
                    type="time"
                    aria-label={`${doctorName} ${h.day} from`}
                    value={h.opens}
                    disabled={h.closed}
                    onInput={(e) =>
                      change(index, { opens: e.currentTarget.value })
                    }
                    onChange={(e) => change(index, { opens: e.target.value })}
                  />
                  <TextField
                    label="To"
                    type="time"
                    aria-label={`${doctorName} ${h.day} to`}
                    value={h.closes}
                    disabled={h.closed}
                    onInput={(e) =>
                      change(index, { closes: e.currentTarget.value })
                    }
                    onChange={(e) => change(index, { closes: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                Save hours
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={save.isPending}
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
