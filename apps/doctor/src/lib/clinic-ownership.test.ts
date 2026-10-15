import assert from "node:assert/strict";
import { api, authApi, setActiveClinicId } from "./api";
import { session } from "@/mocks/fixtures";
import type { Clinic, ClinicDoctor, DoctorUser } from "@/types";
import type { LinkedClinic } from "./profile-settings";

const shared = new Map<string, string>();
const tab = new Map<string, string>();
const storage = (map: Map<string, string>) => ({
  getItem: (k: string) => map.get(k) ?? null,
  setItem: (k: string, v: string) => map.set(k, v),
  removeItem: (k: string) => map.delete(k),
});
Object.defineProperty(globalThis, "localStorage", { value: storage(shared) });
Object.defineProperty(globalThis, "sessionStorage", { value: storage(tab) });
const login = (email: string) =>
  authApi.post("/auth/login", { identifier: email, role: "doctor" });
await login("dr.mehta@test.com");
setActiveClinicId("c1");
const oldOwnerId = session.id;
const before = await api.get<Clinic>("/clinic/profile");
const doctors = await api.get<{ doctors: DoctorUser[] }>("/registered-doctors");
const successor = doctors.doctors.find((d) => d.email === "dr.shah@test.com")!;
assert.ok(successor);
const directory = await api.get<{ clinics: LinkedClinic[] }>(
  "/clinic-directory",
);
assert.equal(directory.clinics.find((c) => c.id === "c2")?.city, "Pune");
assert.equal(
  directory.clinics.find((c) => c.id === "c2")?.state,
  "Maharashtra",
);
await assert.rejects(() =>
  api.post("/clinics/c1/transfer-ownership", { doctorId: "unknown" }),
);
await assert.rejects(() =>
  api.post("/clinics/c1/transfer-ownership", { doctorId: oldOwnerId }),
);
await api.post("/clinics/c1/transfer-ownership", { doctorId: successor.id });
assert.equal(session.clinics.find((c) => c.id === "c1")?.role, "member");
assert.deepEqual(await api.get<Clinic>("/clinic/profile"), before);
const list = await api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors");
assert.equal(list.doctors.filter((d) => d.role === "owner").length, 1);
assert.equal(list.doctors.find((d) => d.id === successor.id)?.role, "owner");
await assert.rejects(() =>
  api.post("/clinics/c1/transfer-ownership", { doctorId: oldOwnerId }),
);
await assert.rejects(() => api.delete(`/clinic/doctors/${successor.id}`));
const hours = [
  { day: "friday", opens: "10:00", closes: "16:00", closed: false },
];
await api.put(`/clinics/c1/doctors/${oldOwnerId}/hours`, { hours });
await assert.rejects(() =>
  api.put(`/clinics/c1/doctors/${successor.id}/hours`, { hours }),
);
await login("dr.shah@test.com");
setActiveClinicId("c1");
const links = (await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics"))
  .clinics;
assert.equal(links.find((c) => c.id === "c1")?.role, "owner");
assert.equal(links.find((c) => c.id === "c2")?.role, "owner");
await assert.rejects(() => api.delete("/me/linked-clinics/c1"));
await api.put(`/clinics/c1/doctors/${oldOwnerId}/hours`, { hours });
await login("dr.mehta@test.com");
await api.delete("/me/linked-clinics/c1");
assert.ok(!session.clinics.some((c) => c.id === "c1"));
await assert.rejects(() =>
  api.put(`/clinics/c1/doctors/${oldOwnerId}/hours`, { hours }),
);
await api.post("/me/linked-clinics", { clinicId: "c3" });
assert.equal(
  (
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.find((c) => c.id === "c3")?.status,
  "pending",
);
await assert.rejects(() =>
  api.put(`/clinics/c3/doctors/${oldOwnerId}/hours`, { hours }),
);
await login("dr.shah@test.com");
setActiveClinicId("c1");
assert.ok(
  !(await api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors")).doctors.some(
    (d) => d.id === oldOwnerId,
  ),
);
// Members cannot delete clinics; deletion removes every link/request and stays deleted.
await login("dr.mehta@test.com");
await assert.rejects(() => api.delete("/clinics/c1"));
await api.post("/me/linked-clinics", { clinicId: "c1" });
await login("dr.shah@test.com");
await api.delete("/clinics/c1");
assert.ok(
  !(
    await api.get<{ clinics: LinkedClinic[] }>("/clinic-directory")
  ).clinics.some((c) => c.id === "c1"),
);
assert.ok(
  !(
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.some((c) => c.id === "c1"),
);
await assert.rejects(() => api.get("/clinic/profile"));
await assert.rejects(() => api.post("/me/linked-clinics", { clinicId: "c1" }));
await login("dr.mehta@test.com");
assert.ok(
  !(
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.some((c) => c.id === "c1"),
);
await login("dr.shah@test.com");
setActiveClinicId("c2");
assert.equal((await api.get<Clinic>("/clinic/profile")).id, "c2");
console.log(
  "Registered-doctor ownership transfer, unique owner, old-owner permissions, own timings, pending membership and clinic locations pass.",
);
