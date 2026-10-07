import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  api,
  authApi,
  clearSession,
  getActiveClinicId,
  readRefreshToken,
  refreshAccessToken,
  setAccessToken,
  setActiveClinicId,
  storeRefreshToken,
} from "@/lib/api";
import { ApiError } from "@myanodex/shared/api-client";
import type { Role, Session } from "@/types";

/** What /auth/login and /auth/apply answer with. */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: Session;
}

interface AuthValue {
  user: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string, role: Role) => Promise<Session>;
  /** Adopt a session minted elsewhere (the application flow). */
  adopt: (res: LoginResponse) => void;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Re-read /doctor/me (after paying, submitting, accepting an invite). */
  refreshSession: () => Promise<Session | null>;
  activeClinicId: string | null;
  setActiveClinic: (id: string | null) => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

/** Where a fresh login lands: a clinic for pro doctors and desks, else the personal practice. */
function defaultClinic(session: Session): string | null {
  const stored = getActiveClinicId();
  if (stored && session.clinics.some((c) => c.id === stored)) return stored;
  if (session.role === "receptionist" || session.plan?.isPro) return session.clinics[0]?.id ?? null;
  return null;
}

export function DoctorAuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [activeClinicId, setClinicState] = useState<string | null>(getActiveClinicId());

  const setActiveClinic = useCallback(
    (id: string | null) => {
      setActiveClinicId(id);
      setClinicState(id);
      // ponytail: every query is scoped by the header. resetQueries() (not clear())
      // also refetches what is on screen; clear() left mounted pages showing the
      // old clinic. Thread clinicId into the keys if the flicker ever matters.
      void qc.resetQueries();
    },
    [qc]
  );

  const settle = useCallback(
    (session: Session) => {
      setUser(session);
      const clinic = defaultClinic(session);
      if (clinic !== getActiveClinicId()) {
        setActiveClinicId(clinic);
        setClinicState(clinic);
      }
    },
    []
  );

  // Rebuild the session from the stored refresh token on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!readRefreshToken() || !(await refreshAccessToken())) return;
        const res = await api.get<{ user: Session }>("/me");
        if (alive) settle(res.user);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [settle]);

  const adopt = useCallback(
    (res: LoginResponse) => {
      setAccessToken(res.accessToken);
      storeRefreshToken(res.refreshToken ?? null);
      settle(res.user);
    },
    [settle]
  );

  const login = useCallback(
    async (identifier: string, password: string, role: Role) => {
      const res = await authApi.post<LoginResponse>("/auth/login", { identifier, password, role });
      adopt(res);
      return res.user;
    },
    [adopt]
  );

  const logout = useCallback(async () => {
    const refreshToken = readRefreshToken();
    try {
      await authApi.post("/auth/logout", { refreshToken });
    } catch {
      // Logging out is best-effort: clear the client side regardless.
    }
    clearSession();
    setUser(null);
    setClinicState(null);
    qc.clear();
    try {
      // Never reopen straight into the last patient after a logout.
      sessionStorage.removeItem("doctor-portal:selected-patient-mid");
      sessionStorage.removeItem("doctor-portal:selected-patient-name");
    } catch {
      /* private mode */
    }
  }, [qc]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authApi.post("/auth/change-password", { currentPassword, newPassword });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await api.get<{ user: Session }>("/me");
      settle(res.user);
      return res.user;
    } catch {
      return null;
    }
  }, [settle]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, adopt, logout, changePassword, refreshSession, activeClinicId, setActiveClinic }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within DoctorAuthProvider");
  return ctx;
}

export { ApiError };
