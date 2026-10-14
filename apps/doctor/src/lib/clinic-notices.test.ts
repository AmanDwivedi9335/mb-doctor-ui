import assert from "node:assert/strict";
import { api } from "./api";
import {
  activeClinicNotices,
  clinicToday,
  validClinicNotices,
  clinicHoursOn,
} from "./profile-settings";
import { DEMO_STORAGE_PREFIX } from "./demo-storage";
import type { Clinic, ClinicDoctor, ClinicNotice } from "@/types";
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
globalThis.fetch = async () => {
  throw new Error("Unexpected network request");
};

const notice: ClinicNotice = {
  id: "notice1",
  start: "2026-10-14",
  end: "2026-10-16",
  note: "Vaccination service available on the first floor.\nPlease contact reception.",
};
assert.equal(validClinicNotices([notice]), true);
assert.equal(validClinicNotices([{ ...notice, end: "2026-10-13" }]), false);
assert.equal(validClinicNotices([{ ...notice, note: "   " }]), false);
assert.equal(validClinicNotices([{ ...notice, start: "2026-02-29" }]), false);
assert.equal(validClinicNotices([notice, notice]), false);
assert.equal(activeClinicNotices([notice], "2026-10-13").length, 0);
assert.deepEqual(activeClinicNotices([notice], "2026-10-14"), [notice]);
assert.deepEqual(activeClinicNotices([notice], "2026-10-16"), [notice]);
assert.equal(activeClinicNotices([notice], "2026-10-17").length, 0);
assert.equal(clinicToday(new Date("2026-10-13T18:29:59Z")), "2026-10-13");
assert.equal(clinicToday(new Date("2026-10-13T18:30:00Z")), "2026-10-14");
assert.equal(
  activeClinicNotices([notice, { ...notice, id: "notice2" }], "2026-10-15")
    .length,
  2,
);

const before = await api.get<Clinic>("/clinic/profile");
await api.put("/clinic/profile", { notices: [notice] });
const after = await api.get<Clinic>("/clinic/profile");
assert.deepEqual(after.notices, [notice]);
assert.deepEqual(
  clinicHoursOn(after, notice.start),
  clinicHoursOn(before, notice.start),
);
assert.deepEqual(after.temporaryHours, before.temporaryHours);
assert.deepEqual(
  (
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.find((c) => c.id === before.id)?.notices,
  [notice],
);
assert.deepEqual(
  (
    await api.get<{ clinics: { id: string; notices: ClinicNotice[] }[] }>(
      "/clinic-directory",
    )
  ).clinics.find((c) => c.id === before.id)?.notices,
  [notice],
);
const doctors = (await api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors"))
  .doctors;
assert.ok(doctors.length > 0);
assert.ok(
  doctors.every((d) => JSON.stringify(d.notices) === JSON.stringify([notice])),
);
assert.deepEqual(
  JSON.parse(shared.get(DEMO_STORAGE_PREFIX + "profile-settings")!).clinics[
    before.id
  ].notices,
  [notice],
);
await assert.rejects(() =>
  api.put("/clinic/profile", { notices: [{ ...notice, note: "" }] }),
);
await assert.rejects(() => api.put("/clinic/profile", { notices: [null] }));
const revised = { ...notice, note: "Updated clinic message" };
await api.put("/clinic/profile", { notices: [revised] });
assert.ok(
  (await api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors")).doctors.every(
    (d) => d.notices?.[0].note === revised.note,
  ),
);
await api.put("/clinic/profile", { notices: [] });
assert.ok(
  (
    await api.get<{ clinics: LinkedClinic[] }>("/me/linked-clinics")
  ).clinics.find((c) => c.id === before.id)?.notices?.length === 0,
);
assert.ok(
  (await api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors")).doctors.every(
    (d) => d.notices?.length === 0,
  ),
);
console.log(
  "Clinic notice date boundaries, timezone, persistence, listing synchronization and independent hours pass.",
);
