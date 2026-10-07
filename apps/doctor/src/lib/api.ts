import { createApiClient, ApiError } from "@myanodex/shared/api-client";

/**
 * Two clients over the real backend:
 *
 *   api      /api/v1/doctor  the portal contract (session, clinics, patients, ...)
 *   authApi  /api/v1         login / refresh / logout / apply / onboarding
 *
 * Session = the backend's "mobile" mode (`x-client-type: mobile`): the refresh
 * token comes back in the body and lives in sessionStorage, because this UI is
 * served from a different site than the API and a browser will not send the
 * httpOnly cookie across. The access token (15 min) stays in memory. Same
 * shape as the admin portal's client.
 *
 * `X-Clinic-Id` rides on every request when a clinic is selected; absent = the
 * doctor's own practice.
 */

const ORIGIN = (import.meta.env.VITE_API_ORIGIN ?? "").replace(/\/+$/, "");
const REFRESH_KEY = "doctor-portal:refresh";
const CLINIC_KEY = "doctor-portal:clinic";

let accessToken: string | null = null;
let activeClinicId: string | null = read(CLINIC_KEY);

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    /* private mode: the session just will not survive a reload */
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function readRefreshToken() {
  return read(REFRESH_KEY);
}
export function storeRefreshToken(token: string | null) {
  write(REFRESH_KEY, token);
}
export function getActiveClinicId() {
  return activeClinicId;
}
export function setActiveClinicId(id: string | null) {
  activeClinicId = id;
  write(CLINIC_KEY, id);
}
export function clearSession() {
  accessToken = null;
  storeRefreshToken(null);
  setActiveClinicId(null);
}

const headers = (): Record<string, string> => ({
  "x-client-type": "mobile",
  ...(activeClinicId ? { "X-Clinic-Id": activeClinicId } : {}),
});

const rawApi = createApiClient({ baseURL: `${ORIGIN}/api/v1/doctor`, getToken: () => accessToken, getHeaders: headers });
const rawAuth = createApiClient({ baseURL: `${ORIGIN}/api/v1`, getToken: () => accessToken, getHeaders: headers });

/**
 * Single-flight refresh: the backend ROTATES the refresh token and revokes
 * the old one, so two concurrent refreshes would race and one would store a
 * token that is already dead. Returns false when there is no session.
 */
let refreshing: Promise<boolean> | null = null;
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = readRefreshToken();
      if (!refreshToken) return false;
      try {
        const r = await rawAuth.post<{ accessToken: string; refreshToken?: string }>("/auth/refresh", { refreshToken });
        accessToken = r.accessToken;
        if (r.refreshToken) storeRefreshToken(r.refreshToken);
        return true;
      } catch (e) {
        // Only a 401 means the token is dead. A network blip keeps it so the
        // next attempt can still succeed.
        if (e instanceof ApiError && e.status === 401) clearSession();
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/** Run a request; on an expired access token, refresh once and retry once. */
async function retryOn401<R>(fn: () => Promise<R>): Promise<R> {
  try {
    return await fn();
  } catch (e) {
    // Refresh only when we HAD a token: a 401 from /auth/login with no session
    // is a wrong password, not an expiry.
    if (e instanceof ApiError && e.status === 401 && accessToken && (await refreshAccessToken())) {
      return fn();
    }
    throw e;
  }
}

type Client = ReturnType<typeof createApiClient>;

function withRefresh(client: Client): Client {
  return {
    get: <T,>(path: string) => retryOn401(() => client.get<T>(path)),
    post: <T,>(path: string, body?: unknown) => retryOn401(() => client.post<T>(path, body)),
    patch: <T,>(path: string, body?: unknown) => retryOn401(() => client.patch<T>(path, body)),
    put: <T,>(path: string, body?: unknown) => retryOn401(() => client.put<T>(path, body)),
    delete: <T,>(path: string) => retryOn401(() => client.delete<T>(path)),
    upload: <T,>(path: string, formData: FormData) => retryOn401(() => client.upload<T>(path, formData)),
  };
}

export const api = withRefresh(rawApi);
export const authApi = withRefresh(rawAuth);

/** A file behind the doctor API (report scans, clinic images), as a Blob. */
export function apiBlob(path: string): Promise<Blob> {
  return retryOn401(async () => {
    const res = await fetch(`${ORIGIN}/api/v1/doctor${path}`, {
      headers: { ...headers(), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, body.message || "Request failed", body);
    }
    return res.blob();
  });
}
