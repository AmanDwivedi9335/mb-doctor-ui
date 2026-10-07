import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const KEY = "doctor-portal:selected-patient-mid";
const NAME_KEY = "doctor-portal:selected-patient-name";

/**
 * The patient currently in context. The Consultation menu items (Summary,
 * Diagnosis, Procedure, Report) point at this patient and stay muted until one
 * is picked via Search MID. Persisted to sessionStorage so it survives a reload
 * but not a new tab; cleared on logout.
 */
interface Value {
  mid: string | null;
  name: string | null;
  select: (mid: string, name?: string) => void;
  clear: () => void;
}

const Ctx = createContext<Value | undefined>(undefined);

const read = (k: string) => {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
};

export function SelectedPatientProvider({ children }: { children: ReactNode }) {
  const [mid, setMid] = useState<string | null>(() => read(KEY));
  const [name, setName] = useState<string | null>(() => read(NAME_KEY));

  const select = useCallback((m: string, n?: string) => {
    setMid(m);
    setName(n ?? null);
    try {
      sessionStorage.setItem(KEY, m);
      if (n) sessionStorage.setItem(NAME_KEY, n);
    } catch {
      /* private mode */
    }
  }, []);

  const clear = useCallback(() => {
    setMid(null);
    setName(null);
    try {
      sessionStorage.removeItem(KEY);
      sessionStorage.removeItem(NAME_KEY);
    } catch {
      /* private mode */
    }
  }, []);

  return <Ctx.Provider value={{ mid, name, select, clear }}>{children}</Ctx.Provider>;
}

export function useSelectedPatient(): Value {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSelectedPatient must be used within SelectedPatientProvider");
  return c;
}
