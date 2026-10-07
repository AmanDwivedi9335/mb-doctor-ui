import assert from "node:assert/strict";
import { api, authApi, apiBlob } from "./api";
import { consentedMid } from "@/mocks/fixtures";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", { value: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) } });
globalThis.fetch = async () => { throw new Error("Demo attempted a network request"); };

for (const path of ["/me", "/config/feature-flags", "/dashboard/stats", "/dashboard/overview", "/dashboard/analytics/patients", "/dashboard/analytics/billing", "/history", "/appointments", "/clinics", "/me/invites", "/front-desk", "/clinic/profile", "/clinic/doctors", "/clinic/staff", "/clinic/faqs", "/clinic/billing", "/billing/me", "/billing/plans", "/billing/history", "/billing/orders/DEMO", "/support/messages", "/notifications", "/profile"]) {
  assert.ok(await api.get(path), path);
}
for (const path of ["/patients", "/diagnosis", "/procedures", "/reports", "/health-data", "/followups", "/summary/medications", "/summary/allergies"]) {
  assert.ok(await api.get(`${path}?mid=${consentedMid}`), path);
}
const session = await authApi.post<{ user: { name: string } }>("/auth/login", { identifier: "demo", password: "demo", role: "doctor" });
assert.ok(session.user.name);
const appointment = await api.post<{ id: string }>("/appointments", { date: "2026-10-07", patient: { name: "Demo visitor" } });
await api.patch(`/appointments/${appointment.id}`, { status: "completed" });
assert.ok((await api.get<{ appointments: { id: string; status: string }[] }>("/appointments")).appointments.some((a) => a.id === appointment.id && a.status === "completed"));
const file = new FormData();
file.append("file", new Blob(["demo report"], { type: "text/plain" }), "demo.txt");
file.append("mid", consentedMid);
file.append("title", "Uploaded demo");
const report = await api.upload<{ id: string }>("/reports", file);
assert.equal(await (await apiBlob(`/reports/${report.id}/file`)).text(), "demo report");
assert.ok((await api.get<{ reports: { id: string }[] }>(`/reports?mid=${consentedMid}`)).reports.some((r) => r.id === report.id));
const answers = await authApi.put<{ answered: number[] }>("/auth/me/security-answers", { answers: [{ id: 1, answer: "Demo" }] });
assert.deepEqual(answers.answered, [1]);
console.log("Demo reads, local mutations, file previews and authentication pass without fetch.");
