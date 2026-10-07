import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidMid, normalizeMid } from "@/lib/mid";
import { cn } from "@/lib/utils";

/** The spine of the app: type a MID, land in that patient's workspace. Shared by
 *  the dashboard and the Find-patient page so the lookup behaves identically. */
export function MidSearch({ size = "default", autoFocus, appearance = "default" }: { appearance?: "default" | "reference"; size?: "default" | "lg"; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const mid = normalizeMid(value);
    if (!isValidMid(mid)) {
      setError("Enter a valid MID (12 to 14 letters or digits).");
      return;
    }
    setError(null);
    navigate(`/patients/${mid}`);
  }

  return (
    <form onSubmit={submit} className={cn("w-full", appearance === "reference" && "mid-search-bar")}>
      <div className={cn("flex gap-2", size === "lg" && "gap-2.5")}>
        <div className="relative flex-1">
          <Search className={cn(appearance === "reference" && "hidden", "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground")} />
          <Input
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Please enter MID…"
            className={cn("pl-9 font-mono tabular-nums", size === "lg" && "h-11 text-base", appearance === "reference" && "border-0 pl-2 font-sans shadow-none")}
            aria-label="Patient MID"
          />
        </div>
        <Button type="submit" aria-label="Look up patient" className={appearance === "reference" ? "size-11 rounded-full p-0" : undefined} size={appearance === "reference" ? "icon" : size === "lg" ? "lg" : "default"}>
          {appearance === "reference" ? <Search /> : "Look up"}
        </Button>
      </div>
      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
    </form>
  );
}
