import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEMO_STORAGE_PREFIX, readDemoState, writeDemoState } from "@/lib/demo-storage";

/** Browser-only preferences, shared between mounted screens and browser tabs. No API transport. */
export function useBrowserSetting<T>(key: string, fallback: T) {
  const qc = useQueryClient();
  const queryKey = ["browser-ui", key];
  const { data } = useQuery({
    queryKey,
    queryFn: () => readDemoState(key, fallback),
    initialData: () => readDemoState(key, fallback),
    staleTime: Infinity,
  });
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === DEMO_STORAGE_PREFIX + key || event.key === null)
        qc.setQueryData(["browser-ui", key], readDemoState(key, fallback));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key, qc, fallback]);
  function save(value: T) {
    if (typeof localStorage === "undefined") throw new Error("Browser storage is unavailable.");
    writeDemoState(key, value); // Surface quota/access failures; never report a server save.
    qc.setQueryData(queryKey, value);
  }
  return [data, save] as const;
}
