import { handlers } from "@/mocks/handlers";
import { resolveLocal } from "./local-data";
import { demoFile } from "@/mocks/demo-extras";

// Compatibility interface for UI hooks. Every operation resolves locally; no network transport exists.
const client = (base: string) => ({
  get: <T,>(path: string) => resolveLocal<T>(handlers, "GET", base + path),
  post: <T,>(path: string, body?: unknown) => resolveLocal<T>(handlers, "POST", base + path, body),
  put: <T,>(path: string, body?: unknown) => resolveLocal<T>(handlers, "PUT", base + path, body),
  patch: <T,>(path: string, body?: unknown) => resolveLocal<T>(handlers, "PATCH", base + path, body),
  delete: <T,>(path: string) => resolveLocal<T>(handlers, "DELETE", base + path),
  upload: <T,>(path: string, body: FormData) => resolveLocal<T>(handlers, "POST", base + path, body),
});
export const api = client("/api/v1/doctor");
export const authApi = client("/api/v1");
let token: string | null = "demo-token";
let clinicId: string | null = "c1";
export const getAccessToken = () => token;
export const setAccessToken = (value: string | null) => { token = value; };
export const getActiveClinicId = () => clinicId;
export const setActiveClinicId = (value: string | null) => { clinicId = value; };
export const readRefreshToken = () => "demo-session";
export const storeRefreshToken = (_value: string | null) => {};
export const refreshAccessToken = async () => true;
export const clearSession = () => { token = null; clinicId = null; };
export const apiBlob = async (path: string): Promise<Blob> => demoFile(path);
