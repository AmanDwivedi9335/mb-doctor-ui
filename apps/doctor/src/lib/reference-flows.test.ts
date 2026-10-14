import assert from "node:assert/strict";
import { api, authApi, setActiveClinicId } from "./api";
import { session } from "@/mocks/fixtures";
import { DEMO_STORAGE_PREFIX, hasDemoSession } from "./demo-storage";
import type {
  LinkedClinic,
  ClinicRequest,
  AccountPreferencesData,
} from "./profile-settings";
import type {
  DoctorUser,
  ClinicDoctor,
  ClinicOperatingDay,
  Clinic,
} from "@/types";

const shared = new Map<string, string>();
let tab = new Map<string, string>();
const storage = (map: () => Map<string, string>) => ({
  getItem: (key: string) => map().get(key) ?? null,
  setItem: (key: string, value: string) => map().set(key, value),
  removeItem: (key: string) => map().delete(key),
});
Object.defineProperty(globalThis, "localStorage", {
  value: storage(() => shared),
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: storage(() => tab),
});
globalThis.fetch = async () => {
  throw new Error("Unexpected network request");
};
const login = (email: string, mfaCode?: string) =>
  authApi.post("/auth/login", { identifier: email, role: "doctor", mfaCode });
await login("dr.mehta@test.com");
const originalId = session.id;
await api.put("/profile", {
  preferredName: "Anand",
  specializations: ["General Medicine", "Cardiology"],
  specialization: "General Medicine, Cardiology",
});
await api.post("/me/linked-clinics", { clinicId: "c2" });
await authApi.put("/auth/me/preferences", {
  inactivityMinutes: 15,
  language: "en",
});
const mehtaTab = new Map(tab);
assert.ok(shared.get(DEMO_STORAGE_PREFIX + "profile-settings"));

// Principal reviews a request from a different account using the same shared data.
tab = new Map();
await login("dr.shah@test.com");
setActiveClinicId("c2");
assert.equal(session.name, "Dr. Priya Shah");
assert.equal(
  (await authApi.get<AccountPreferencesData>("/auth/me/preferences"))
    .inactivityMinutes,
  30,
);
const pending = (
  await api.get<{ requests: ClinicRequest[] }>("/clinic-requests")
).requests.find((r) => r.doctorId === originalId)!;
assert.ok(pending);
await api.post(`/clinic-requests/${pending.id}/approve`);
assert.ok(
  (await api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors")).doctors.some(
    (d) => d.id === originalId,
  ),
);
const hours: ClinicOperatingDay[] = [
  { day: "monday", opens: "10:00", closes: "14:00", closed: false },
];
await api.put(`/clinics/c2/doctors/${originalId}/hours`, { hours });
await assert.rejects(() =>
  api.put(`/clinics/c2/doctors/${originalId}/hours`, {
    hours: [...hours, ...hours],
  }),
);
const principalTab = new Map(tab);

tab = mehtaTab;
await login("dr.mehta@test.com");
setActiveClinicId("c2");
const linked = (
  await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
).clinics.find((c) => c.id === "c2")!;
assert.equal(linked.status, "approved");
assert.deepEqual(linked.hours, hours);
assert.equal((await api.get<DoctorUser>("/profile")).preferredName, "Anand");
assert.equal(
  (await authApi.get<AccountPreferencesData>("/auth/me/preferences"))
    .inactivityMinutes,
  15,
);
await assert.rejects(() =>
  api.put(`/clinics/c2/doctors/${originalId}/hours`, { hours }),
);
const ref = (await authApi.get<AccountPreferencesData>("/auth/me/preferences"))
  .referralLink;
assert.equal(new URL(ref).searchParams.get("ref"), session.doctorNo);
await api.delete("/me/linked-clinics/c2");
tab = principalTab;
await login("dr.shah@test.com");
assert.ok(
  !(await api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors")).doctors.some(
    (d) => d.id === originalId,
  ),
);

// New clinics and temporary hours enter the same persisted directory.
const created = await api.post<Clinic>("/clinics", {
  name: "Shah Second Clinic",
  address: "Pune",
});
assert.ok(
  (
    await api.get<{ clinics: { id: string }[] }>("/clinic-directory")
  ).clinics.some((c) => c.id === created.id),
);
const temporaryHours = [
  {
    id: "temporary",
    start: "2026-12-24",
    end: "2026-12-26",
    closed: true,
    opens: "",
    closes: "",
    note: "Closed for holiday",
  },
];
await api.put("/clinic/profile", { temporaryHours });
assert.deepEqual(
  (await api.get<Clinic>("/clinic/profile")).temporaryHours,
  temporaryHours,
);

// Revocation survives reload and is scoped to the account that requested it.
const unaffectedPrincipalTab = new Map(tab);
tab = mehtaTab;
await login("dr.mehta@test.com");
const sleepingTab = new Map(tab);
await authApi.post("/auth/me/logout-everywhere");
tab = sleepingTab;
assert.equal(hasDemoSession(), false);
await assert.rejects(() => api.get("/me"));
tab = new Map();
assert.equal(hasDemoSession(), false);
tab = unaffectedPrincipalTab;
assert.equal(hasDemoSession(), true);
await login("dr.mehta@test.com");
assert.equal(hasDemoSession(), true);
await authApi.post("/auth/me/mfa/send-code");
await authApi.post("/auth/me/mfa/verify", { code: "123456", enabled: true });
await assert.rejects(() => login("dr.mehta@test.com"));
await login("dr.mehta@test.com", "123456");
const persisted = shared.get(DEMO_STORAGE_PREFIX + "profile-settings")!;
const basicState = JSON.parse(persisted);
Object.assign(basicState.subscription[originalId], {
  isPro: false,
  plan: "basic",
  planName: "Basic",
});
shared.set(
  DEMO_STORAGE_PREFIX + "profile-settings",
  JSON.stringify(basicState),
);
await assert.rejects(() => api.get("/appointments"));
assert.ok(await api.get("/me/linked-clinics"));
shared.set(DEMO_STORAGE_PREFIX + "profile-settings", persisted);
console.log(
  "Shared clinic approvals, schedules, persisted profiles/preferences, referral links and account-scoped revocation pass.",
);
