import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClinicOperatingDay } from "@/types";
import { WeeklyHoursTable } from "./WeeklyHoursTable";
import { Button } from "@/components/ui/button";
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
  inline = false,
}: {
  clinicId: string;
  doctorId: string;
  doctorName: string;
  canEdit: boolean;
  inline?: boolean;
}) {
  const qc = useQueryClient();
  const path = `/clinics/${clinicId}/doctors/${doctorId}/hours`;
  const { data, error } = useQuery({
    queryKey: ["doctor", "working-hours", clinicId, doctorId],
    queryFn: () => api.get<{ hours: ClinicOperatingDay[] }>(path),
  });
  const [hours, setHours] = useState<ClinicOperatingDay[]>([]);
  const [editing, setEditing] = useState(false);
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
      <p role="alert" className="text-xs text-destructive">
        Could not load working hours.
      </p>
    );
  if (!data) return <p className="text-xs">Loading working hours…</p>;
  const content = (
    <div className="space-y-3">
      {editing ? (
        <>
          <WeeklyHoursTable
            hours={hours}
            onChange={setHours}
            label={`${doctorName} working hours`}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              Save timings
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
      ) : (
        <>
          {data.hours.length ? (
            <WeeklyHoursTable
              hours={data.hours}
              label={`${doctorName} working hours`}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              No working hours set.
            </p>
          )}
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Set timings
            </Button>
          )}
        </>
      )}
    </div>
  );
  return inline ? (
    content
  ) : (
    <details className="mt-3 border-t pt-3">
      <summary className="mb-3 cursor-pointer text-sm font-medium">
        Working hours
      </summary>
      {content}
    </details>
  );
}
