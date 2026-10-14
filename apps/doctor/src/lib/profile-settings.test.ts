import assert from "node:assert/strict";
import { addMonths } from "date-fns";
import { api, authApi } from "./api";
import { session, clinic, plans } from "@/mocks/fixtures";
import {
  validTemporaryHours,
  clinicHoursOn,
  type LinkedClinic,
  type ClinicRequest,
  type AccountPreferencesData,
} from "./profile-settings";
import type { DoctorUser, Subscription, SubscriptionEvent } from "@/types";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
});
globalThis.fetch = async () => {
  throw new Error("Unexpected network request");
};

const changes = [
  {
    id: "hours",
    start: "2026-12-24",
    end: "2026-12-26",
    closed: true,
    opens: "",
    closes: "",
    note: "Holiday",
  },
];
assert.equal(validTemporaryHours(changes), true);
assert.equal(
  validTemporaryHours([...changes, { ...changes[0], id: "overlap" }]),
  false,
);
assert.equal(
  validTemporaryHours([{ ...changes[0], start: "2026-12-27" }]),
  false,
);
assert.equal(validTemporaryHours([{ ...changes[0], closed: false }]), false);
assert.equal(
  clinicHoursOn({ ...clinic, temporaryHours: changes }, "2026-12-25").closed,
  true,
);
assert.equal(
  clinicHoursOn({ ...clinic, temporaryHours: changes }, "2026-12-27").opens,
  clinic.operatingHoursStart,
);
await api.put("/clinic/profile", { temporaryHours: changes });
await assert.rejects(() =>
  api.put("/clinic/profile", { temporaryHours: [...changes, changes[0]] }),
);

await api.put("/profile", {
  specializations: ["General Medicine", "Cardiology"],
  education: [
    {
      qualification: "MBBS",
      college: "Medical college",
      city: "Pune",
      state: "MH",
      country: "India",
      year: "2010",
    },
  ],
  experience: [
    {
      title: "Consultant",
      organisation: "Mehta Medical",
      from: "2015-01-01",
      to: "",
    },
  ],
});
const saved = await api.get<DoctorUser>("/profile");
assert.equal(saved.specializations?.length, 2);
assert.equal(saved.education?.[0].year, "2010");
assert.equal(saved.experience?.[0].to, "");

await api.post("/me/linked-clinics", { clinicId: "c2" });
assert.equal(
  (
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.find((c) => c.id === "c2")?.status,
  "pending",
);
assert.ok(!session.clinics.some((c) => c.id === "c2"));
await assert.rejects(() => api.post("/me/linked-clinics", { clinicId: "c2" }));
await assert.rejects(() => api.delete("/me/linked-clinics/c1"));
const original = {
  id: session.id,
  name: session.name,
  clinics: [...session.clinics],
};
session.id = "principal-city-care";
session.name = "Dr. Priya Shah";
session.clinics = [
  { id: "c2", name: "City Care Clinic", role: "owner", memberCount: 1 },
];
const pending = (
  await api.get<{ requests: ClinicRequest[] }>("/clinic-requests")
).requests.find((r) => r.clinicId === "c2")!;
assert.ok(pending);
session.clinics = [];
await assert.rejects(() => api.post(`/clinic-requests/${pending.id}/approve`));
session.clinics = [
  { id: "c2", name: "City Care Clinic", role: "owner", memberCount: 1 },
];
await api.post(`/clinic-requests/${pending.id}/approve`);
Object.assign(session, original);
assert.equal(
  (
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.find((c) => c.id === "c2")?.status,
  "approved",
);
await api.delete("/me/linked-clinics/c2");
assert.ok(
  !(
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.some((c) => c.id === "c2"),
);

await authApi.put("/auth/me/preferences", {
  inactivityMinutes: 15,
  language: "en",
});
assert.equal(
  (await authApi.get<AccountPreferencesData>("/auth/me/preferences"))
    .inactivityMinutes,
  15,
);
await assert.rejects(() =>
  authApi.put("/auth/me/preferences", { inactivityMinutes: 0, language: "en" }),
);
await authApi.post("/auth/me/mfa/send-code");
await assert.rejects(() =>
  authApi.post("/auth/me/mfa/verify", { code: "000000", enabled: true }),
);
await authApi.post("/auth/me/mfa/verify", { code: "123456", enabled: true });
await assert.rejects(() => authApi.post("/auth/login", { role: "doctor" }));
await authApi.post("/auth/login", { role: "doctor", mfaCode: "123456" });
await authApi.post("/auth/me/mfa/send-code");
await authApi.post("/auth/me/mfa/verify", { code: "123456", enabled: false });

await assert.rejects(() =>
  api.post("/billing/checkout", { plan: "pro", months: 1 }),
);
const before = await api.get<Subscription>("/billing/me");
const order = await api.post<{ merchantTxnNo: string }>("/billing/checkout", {
  plan: "pro",
  months: 6,
});
const after = await api.get<Subscription>("/billing/me");
assert.equal(
  after.renewsAt,
  addMonths(new Date(before.renewsAt!), 6).toISOString(),
);
await api.get(`/billing/orders/${order.merchantTxnNo}`);
const history = await api.get<{ history: SubscriptionEvent[] }>(
  "/billing/history",
);
assert.equal(
  history.history[0].amount,
  plans.find((p) => p.code === "pro")!.priceSixMonths,
);
await api.post("/billing/checkout", { plan: "pro", months: 12 });
assert.equal(
  (await api.get<Subscription>("/billing/me")).renewsAt,
  addMonths(new Date(after.renewsAt!), 12).toISOString(),
);
await assert.rejects(() => api.get("/billing/orders/missing"));
await authApi.post("/auth/me/logout-everywhere");
await assert.rejects(() => api.get("/me"));
console.log(
  "Profile fields, temporary hours, clinic approval permissions, security and subscription periods pass.",
);
