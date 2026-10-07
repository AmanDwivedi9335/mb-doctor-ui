import { useState, useCallback } from "react";

/**
 * Minimal form state: current values, a setter, a re-seed, and a dirty flag so
 * Save/Cancel can appear only after a change. Same pattern the patient app uses
 * instead of react-hook-form; a full form library is not worth its weight here.
 */
export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [seedValue, setSeedValue] = useState<T>(initial);
  const [f, setForm] = useState<T>(initial);

  const setF = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const seed = useCallback((next: T) => {
    setSeedValue(next);
    setForm(next);
  }, []);

  const dirty = JSON.stringify(f) !== JSON.stringify(seedValue);

  return { f, setF, setForm, seed, dirty };
}
