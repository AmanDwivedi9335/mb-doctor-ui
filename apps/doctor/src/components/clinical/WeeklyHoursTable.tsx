import type { ClinicOperatingDay } from "@/types";

export function WeeklyHoursTable({
  hours,
  onChange,
  label = "Weekly opening hours",
}: {
  hours: ClinicOperatingDay[];
  onChange?: (hours: ClinicOperatingDay[]) => void;
  label?: string;
}) {
  const change = (index: number, patch: Partial<ClinicOperatingDay>) =>
    onChange?.(hours.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-secondary/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2">
              Day
            </th>
            <th scope="col" className="px-3 py-2">
              From
            </th>
            <th scope="col" className="px-3 py-2">
              To
            </th>
            <th scope="col" className="px-3 py-2">
              Closed
            </th>
          </tr>
        </thead>
        <tbody>
          {hours.map((h, index) => (
            <tr key={h.day} className="border-t">
              <th scope="row" className="px-3 py-2 font-medium capitalize">
                {h.day}
              </th>
              <td className="px-3 py-1.5">
                {onChange ? (
                  <input
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    type="time"
                    aria-label={`${label} ${h.day} from`}
                    value={h.opens}
                    disabled={h.closed}
                    required={!h.closed}
                    onInput={(e) =>
                      change(index, { opens: e.currentTarget.value })
                    }
                    onChange={(e) => change(index, { opens: e.target.value })}
                  />
                ) : h.closed ? (
                  "—"
                ) : (
                  h.opens
                )}
              </td>
              <td className="px-3 py-1.5">
                {onChange ? (
                  <input
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    type="time"
                    aria-label={`${label} ${h.day} to`}
                    value={h.closes}
                    disabled={h.closed}
                    required={!h.closed}
                    onInput={(e) =>
                      change(index, { closes: e.currentTarget.value })
                    }
                    onChange={(e) => change(index, { closes: e.target.value })}
                  />
                ) : h.closed ? (
                  "—"
                ) : (
                  h.closes
                )}
              </td>
              <td className="px-3 py-2">
                {onChange ? (
                  <input
                    type="checkbox"
                    aria-label={`${label} ${h.day} closed`}
                    checked={h.closed}
                    onChange={(e) =>
                      change(index, { closed: e.target.checked })
                    }
                  />
                ) : h.closed ? (
                  "Yes"
                ) : (
                  "No"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
