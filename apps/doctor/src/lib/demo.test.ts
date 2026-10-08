import assert from "node:assert/strict";
import { api, authApi, apiBlob } from "./api";
import { consentedMid } from "@/mocks/fixtures";
import type { DoctorUser, Clinic, Session, SupportTicket } from "@/types";

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
const accountDetails = {
  name: "Dr Test", email: "test@example.com", preferredName: "Test", mobile: "9000000000", emergencyMobile: "9000000001",
  dateOfBirth: "1990-01-01", registrationIds: ["REG-001", "REG-002"],
  education: [{ qualification: "MBBS", college: "Test College", city: "Pune", state: "Maharashtra", country: "India" }],
};
await authApi.post("/auth/apply", { ...accountDetails, username: "test", password: "test-password", code: "123456" });
let profile = await api.get<DoctorUser>("/profile");
assert.equal(profile.preferredName, "Test");
assert.deepEqual(profile.registrationIds, accountDetails.registrationIds);
assert.deepEqual(profile.education, accountDetails.education);
assert.ok(!("password" in profile));
const onboarding = await authApi.get<{ qualification: string; registrationNo: string }>("/auth/onboarding");
assert.equal(onboarding.qualification, "MBBS");
assert.equal(onboarding.registrationNo, "REG-001, REG-002");
await api.put("/profile", { registrationIds: ["REG-002"], education: [] });
profile = await api.get<DoctorUser>("/profile");
assert.deepEqual(profile.registrationIds, ["REG-002"]);
assert.deepEqual(profile.education, []);
const createdClinic = await api.post<Clinic>("/clinics", { name: "New clinic", address: "Test address", phone: "9000000000" });
let clinics = await api.get<{ clinics: Session["clinics"] }>("/clinics");
assert.ok(clinics.clinics.some((entry) => entry.id === createdClinic.id && entry.name === "New clinic"));
assert.equal((await api.get<Clinic>("/clinic/profile")).name, "New clinic");
await api.put("/clinic/profile", { name: "Renamed clinic" });
clinics = await api.get<{ clinics: Session["clinics"] }>("/clinics");
assert.equal(clinics.clinics.find((entry) => entry.id === createdClinic.id)?.name, "Renamed clinic");
const ticket = await api.post<SupportTicket>("/support/message", { subject: "Test contact", text: "Test message" });
const tickets = await api.get<{ tickets: SupportTicket[] }>("/support/messages");
assert.ok(tickets.tickets.some((entry) => entry.id === ticket.id && entry.subject === "Test contact"));
console.log("Demo reads, mutations, account/profile fields, clinic naming, support and file previews pass without fetch.");
