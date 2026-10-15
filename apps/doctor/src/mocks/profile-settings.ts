import { addMonths } from "date-fns";
import { getActiveClinicId } from "@/lib/api";
import {
  readDemoState,
  writeDemoState,
  adoptDemoSession,
  revokeDemoSessions,
} from "@/lib/demo-storage";
import type {
  Clinic,
  ClinicDoctor,
  ClinicOperatingDay,
  DoctorUser,
  Session,
} from "@/types";
import {
  local as http,
  LocalResponse as R,
  registerLocalPersistence,
} from "@/lib/local-data";
import * as fx from "./fixtures";
import type {
  LinkedClinic,
  ClinicRequest,
  AccountPreferencesData,
} from "@/lib/profile-settings";
const B = "/api/v1/doctor";
const A = "/api/v1/auth";
const locations: Record<string, { city: string; state: string }> = {
  c1: { city: "Hyderabad", state: "Telangana" },
  c2: { city: "Pune", state: "Maharashtra" },
  c3: { city: "Pune", state: "Maharashtra" },
};
const directory = [
  {
    id: "c1",
    name: fx.clinic.name,
    address: fx.clinic.address,
    principal: fx.doctor.name,
    city: "Hyderabad",
    state: "Telangana",
  },
  {
    id: "c2",
    name: "City Care Clinic",
    address: "MG Road, Pune",
    principal: "Dr. Priya Shah",
    city: "Pune",
    state: "Maharashtra",
  },
  {
    id: "c3",
    name: "Community Health Centre",
    address: "Baner, Pune",
    principal: "Dr. Ravi Kumar",
    city: "Pune",
    state: "Maharashtra",
  },
];
const memberships: (LinkedClinic & { doctorId: string })[] = [
  {
    ...directory[0],
    doctorId: fx.session.id,
    role: "owner",
    status: "approved",
    hours: [
      { day: "monday", opens: "10:00", closes: "14:00", closed: false },
      { day: "wednesday", opens: "10:00", closes: "14:00", closed: false },
    ],
  },
];
let requests: ClinicRequest[] = [
  {
    id: "request-demo",
    clinicId: "c1",
    clinicName: directory[0].name,
    doctorId: "doctor-demo-applicant",
    doctorName: "Dr. Kavita Rao",
  },
];
const baseSession = structuredClone(fx.session);
const accountProfiles: Record<string, DoctorUser> = {
  [fx.doctor.id]: structuredClone(fx.doctor),
  "principal-city-care": {
    ...fx.doctor,
    id: "principal-city-care",
    name: "Dr. Priya Shah",
    email: "dr.shah@test.com",
    clinicName: "City Care Clinic",
  },
  "principal-community": {
    ...fx.doctor,
    id: "principal-community",
    name: "Dr. Ravi Kumar",
    email: "dr.kumar@test.com",
    clinicName: "Community Health Centre",
  },
  "doctor-demo-applicant": {
    ...fx.doctor,
    id: "doctor-demo-applicant",
    name: "Dr. Kavita Rao",
    email: "dr.rao@test.com",
  },
};
for (const [clinicId, doctorId] of [
  ["c2", "principal-city-care"],
  ["c3", "principal-community"],
]) {
  memberships.push({
    ...directory.find((c) => c.id === clinicId)!,
    doctorId,
    role: "owner",
    status: "approved",
    hours: [],
  });
}
const rows: Record<string, ClinicDoctor[]> = {
  c1: fx.clinicDoctors.map((d, i) => ({
    ...d,
    id: i === 0 ? fx.doctor.id : d.id,
    role: i === 0 ? "owner" : "member",
    status: "accepted",
  })),
  c2: [],
  c3: [],
};
for (const d of rows.c1.filter((d) => d.role !== "owner"))
  memberships.push({
    ...directory[0],
    doctorId: d.id,
    role: "member",
    status: "approved",
    hours: [],
  });
const savedClinicProfiles: Record<string, Clinic> = Object.fromEntries(
  directory.map((c) => [
    c.id,
    {
      ...fx.clinic,
      id: c.id,
      name: c.name,
      address: c.address,
      city: c.city,
      state: c.state,
      qrUrl: c.id === fx.clinic.id ? fx.clinic.qrUrl : null,
      upiId: c.id === fx.clinic.id ? fx.clinic.upiId : "",
    },
  ]),
);
const toDoctorRow = (
  membership: LinkedClinic & { doctorId: string },
): ClinicDoctor => {
  const p = accountProfiles[membership.doctorId];
  return {
    id: membership.doctorId,
    name: p?.name ?? "Doctor",
    email: p?.email ?? "",
    specialization: p?.specializations?.join(", ") ?? p?.specialization ?? "",
    role: membership.role,
    status: "accepted",
    active: true,
    qualifications: [],
  };
};
function syncDoctorRows() {
  for (const m of memberships.filter((m) => m.status === "approved")) {
    const list = (rows[m.id] ??= []);
    const existing = list.find((d) => d.id === m.doctorId);
    if (existing) {
      existing.role = m.role;
      existing.status = "accepted";
      if (accountProfiles[m.doctorId])
        Object.assign(existing, {
          name: accountProfiles[m.doctorId].name,
          email: accountProfiles[m.doctorId].email,
          specialization: accountProfiles[m.doctorId].specialization ?? "",
        });
    } else list.push(toDoctorRow(m));
  }
}
function selectDemoAccount(id: string, role: Session["role"] = "doctor") {
  const profile = accountProfiles[id];
  if (!profile) return;
  Object.keys(fx.doctor).forEach(
    (key) => delete (fx.doctor as unknown as Record<string, unknown>)[key],
  );
  Object.assign(fx.doctor, profile);
  preferences = preferencesByAccount[id] ?? {
    mfaEnabled: false,
    inactivityMinutes: 30,
    language: "en",
    referralLink: "",
  };
  subscription = subscriptionsByAccount[id] ?? { ...fx.subscription };
  Object.assign(fx.session, {
    ...baseSession,
    id,
    doctorId: id,
    name: profile.name,
    email: profile.email,
    specialization: profile.specialization ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    role,
    doctorNo: id === baseSession.id ? baseSession.doctorNo : `MB-DR-${id}`,
    plan: {
      ...baseSession.plan!,
      code: subscription.plan,
      name: subscription.planName,
      isPro: !!subscription.isPro,
      endsAt: subscription.renewsAt,
      active: subscription.status === "active",
    },
    clinics: [],
  });
  syncLinkedClinics();
  sessionStorage.setItem("medibank-demo:account", id);
  sessionStorage.setItem("medibank-demo:role", role);
}
let restoredAccount = false;
const owns = (clinicId: string) =>
  fx.session.role === "doctor" &&
  memberships.some(
    (m) =>
      m.id === clinicId &&
      m.doctorId === fx.session.id &&
      m.role === "owner" &&
      m.status === "approved",
  ) &&
  fx.session.clinics.some((c) => c.id === clinicId && c.role === "owner");
export function syncLinkedClinics() {
  fx.session.clinics = fx.session.clinics.filter((c) =>
    memberships.some(
      (m) =>
        m.id === c.id &&
        m.doctorId === fx.session.id &&
        m.status === "approved",
    ),
  );
  for (const membership of memberships.filter(
    (c) => c.doctorId === fx.session.id && c.status === "approved",
  )) {
    const summary = {
      id: membership.id,
      name: membership.name,
      role: membership.role,
      memberCount: memberships.filter(
        (m) => m.id === membership.id && m.status === "approved",
      ).length,
    };
    const existing = fx.session.clinics.find((c) => c.id === membership.id);
    if (existing) Object.assign(existing, summary);
    else fx.session.clinics.push(summary);
  }
}
let preferences: AccountPreferencesData = {
  mfaEnabled: false,
  inactivityMinutes: 30,
  language: "en",
  referralLink: "https://medibank.in/apply?ref=MB-DR-000001",
};
const preferencesByAccount: Record<string, AccountPreferencesData> = {};
function accountPreferences() {
  const origin =
    typeof location === "undefined" ? "http://demo.local" : location.origin;
  return {
    ...preferences,
    referralLink: `${origin}/apply?ref=${encodeURIComponent(fx.session.doctorNo ?? fx.session.id)}`,
  };
}
let mfaChallenge = false;
// Orders are session-local demo payments. Durations and receipts are retained per order.
const orders = new Map<
  string,
  {
    doctorId: string;
    status: "success";
    entitlement: {
      active: boolean;
      planCode: string;
      isPro: boolean;
      endsAt: string;
    };
  }
>();
let subscription = { ...fx.subscription };
const subscriptionsByAccount: Record<string, typeof subscription> = {};
const paymentHistoryByAccount: Record<string, typeof fx.subscriptionHistory> = {
  [baseSession.id]: structuredClone(fx.subscriptionHistory),
};
export const profileSettingsHandlers = [
  http.delete(`${B}/clinics/:clinicId`, ({ params }) => {
    const clinicId = params.clinicId;
    if (!owns(clinicId))
      return R.json(
        { message: "Only the principal doctor can delete this clinic." },
        { status: 403 },
      );
    const index = directory.findIndex((c) => c.id === clinicId);
    if (index < 0)
      return R.json({ message: "Clinic not found." }, { status: 404 });
    directory.splice(index, 1);
    for (let i = memberships.length - 1; i >= 0; i--)
      if (memberships[i].id === clinicId) memberships.splice(i, 1);
    requests = requests.filter((r) => r.clinicId !== clinicId);
    delete rows[clinicId];
    delete savedClinicProfiles[clinicId];
    syncLinkedClinics();
    return R.json({ deleted: true });
  }),
  http.post(`${A}/login`, async ({ request }) => {
    const body = await request.json();
    const requested = Object.values(accountProfiles).find(
      (p) =>
        p.email.toLowerCase() === String(body.identifier ?? "").toLowerCase(),
    );
    // Named demo accounts make both sides of the approval flow reviewable.
    const requestedPreferences = requested
      ? preferencesByAccount[requested.id]
      : preferences;
    if (requestedPreferences?.mfaEnabled && body.mfaCode !== "123456")
      return R.json(
        { message: "Enter your MFA code. Demo code: 123456." },
        { status: 428 },
      );
    if (requested)
      selectDemoAccount(
        requested.id,
        body.role === "receptionist" ? "receptionist" : "doctor",
      );
    adoptDemoSession();
    fx.session.role = body.role === "receptionist" ? "receptionist" : "doctor";
    return R.json({
      accessToken: "demo-token",
      refreshToken: "demo-session",
      user: fx.session,
    });
  }),
  http.get(`${B}/registered-doctors`, () => {
    for (const d of Object.values(rows)
      .flat()
      .filter((d) => d.active)) {
      if (!accountProfiles[d.id])
        accountProfiles[d.id] = {
          id: d.id,
          name: d.name,
          email: d.email,
          role: "doctor",
          specialization: d.specialization,
          doctorNo: d.doctorNo,
        };
    }
    return R.json({
      doctors: Object.values(accountProfiles)
        .filter((d) => d.role === "doctor")
        .map(({ id, name, email, specialization, doctorNo }) => ({
          id,
          name,
          email,
          specialization,
          doctorNo,
          role: "doctor",
        })),
    });
  }),
  http.post(
    `${B}/clinics/:clinicId/transfer-ownership`,
    async ({ params, request }) => {
      if (!owns(params.clinicId))
        return R.json(
          {
            message:
              "Only the current principal doctor can transfer ownership.",
          },
          { status: 403 },
        );
      const { doctorId } = await request.json();
      const registered =
        Object.values(accountProfiles).find(
          (d) => d.id === doctorId && d.role === "doctor",
        ) ??
        Object.values(rows)
          .flat()
          .find((d) => d.id === doctorId && d.active);
      if (!registered)
        return R.json(
          { message: "Select a registered doctor." },
          { status: 400 },
        );
      if (doctorId === fx.session.id)
        return R.json(
          { message: "Select a different doctor." },
          { status: 400 },
        );
      const clinic = directory.find((c) => c.id === params.clinicId);
      if (!clinic)
        return R.json({ message: "Clinic not found." }, { status: 404 });
      if (!accountProfiles[doctorId])
        accountProfiles[doctorId] = {
          id: registered.id,
          name: registered.name,
          email: registered.email,
          role: "doctor",
          specialization: registered.specialization,
        };
      memberships
        .filter((m) => m.id === clinic.id && m.role === "owner")
        .forEach((m) => {
          m.role = "member";
        });
      const successor = memberships.find(
        (m) => m.id === clinic.id && m.doctorId === doctorId,
      );
      if (successor) {
        successor.role = "owner";
        successor.status = "approved";
      } else
        memberships.push({
          ...clinic,
          doctorId,
          role: "owner",
          status: "approved",
          hours: [],
        });
      clinic.principal = registered.name;
      memberships
        .filter((m) => m.id === clinic.id)
        .forEach((m) => {
          m.principal = registered.name;
        });
      requests = requests.filter(
        (r) => r.clinicId !== clinic.id || r.doctorId !== doctorId,
      );
      syncDoctorRows();
      syncLinkedClinics();
      return R.json({ clinicId: clinic.id, ownerId: doctorId });
    },
  ),
  http.get(`${B}/clinic-directory`, () =>
    R.json({
      clinics: directory.map((c) => ({
        ...c,
        city:
          savedClinicProfiles[c.id]?.city ||
          c.city ||
          locations[c.id]?.city ||
          "",
        state:
          savedClinicProfiles[c.id]?.state ||
          c.state ||
          locations[c.id]?.state ||
          "",
        notices: savedClinicProfiles[c.id]?.notices ?? [],
      })),
    }),
  ),
  http.get(`${B}/clinic/doctors`, () => {
    syncDoctorRows();
    const clinicId = getActiveClinicId() ?? "";
    return R.json({
      doctors: (rows[clinicId] ?? []).map((d) => ({
        ...d,
        notices: savedClinicProfiles[clinicId]?.notices ?? [],
      })),
    });
  }),
  http.get(`${B}/clinics/:clinicId/doctors/:doctorId/hours`, ({ params }) => {
    const m = memberships.find(
      (m) =>
        m.id === params.clinicId &&
        m.doctorId === params.doctorId &&
        m.status === "approved",
    );
    if (!m)
      return R.json(
        { message: "Approved membership not found." },
        { status: 404 },
      );
    if (
      params.doctorId !== fx.session.id &&
      !owns(params.clinicId) &&
      fx.session.role !== "receptionist"
    )
      return R.json(
        { message: "You cannot view this schedule." },
        { status: 403 },
      );
    return R.json({ hours: m.hours });
  }),
  http.put(
    `${B}/clinics/:clinicId/doctors/:doctorId/hours`,
    async ({ params, request }) => {
      if (
        !owns(params.clinicId) &&
        !(fx.session.role === "doctor" && params.doctorId === fx.session.id)
      )
        return R.json(
          {
            message:
              "You can set your own timings; only the principal can edit another doctor’s timings.",
          },
          { status: 403 },
        );
      const m = memberships.find(
        (m) =>
          m.id === params.clinicId &&
          m.doctorId === params.doctorId &&
          m.status === "approved",
      );
      if (!m)
        return R.json(
          { message: "Approved membership not found." },
          { status: 404 },
        );
      const { hours } = await request.json();
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      if (
        !Array.isArray(hours) ||
        new Set(hours.map((h) => h.day)).size !== hours.length ||
        hours.some(
          (h) =>
            !days.includes(h.day) ||
            typeof h.closed !== "boolean" ||
            (!h.closed &&
              (!/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens) ||
                !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.closes) ||
                h.opens >= h.closes)),
        )
      )
        return R.json(
          { message: "Provide a valid weekly working schedule." },
          { status: 400 },
        );
      m.hours = hours as ClinicOperatingDay[];
      return R.json({ hours: m.hours });
    },
  ),
  http.delete(`${B}/clinic/doctors/:id`, ({ params }) => {
    const clinicId = getActiveClinicId();
    if (!clinicId || !owns(clinicId))
      return R.json(
        { message: "Only the principal doctor can remove a member." },
        { status: 403 },
      );
    const index = memberships.findIndex(
      (m) => m.id === clinicId && m.doctorId === params.id,
    );
    if (index < 0)
      return R.json({ message: "Member not found." }, { status: 404 });
    if (memberships[index].role === "owner")
      return R.json(
        { message: "The principal doctor cannot be removed." },
        { status: 409 },
      );
    memberships.splice(index, 1);
    rows[clinicId] = (rows[clinicId] ?? []).filter((d) => d.id !== params.id);
    return R.json({ removed: true });
  }),
  http.get(`${B}/me/linked-clinics`, () => {
    syncLinkedClinics();
    for (const clinic of fx.session.clinics) {
      const existing = memberships.find(
        (m) => m.id === clinic.id && m.doctorId === fx.session.id,
      );
      if (existing) existing.status = "approved";
      else
        memberships.push({
          id: clinic.id,
          name: clinic.name,
          address: "",
          principal:
            clinic.role === "owner" ? fx.session.name : "Clinic principal",
          role: clinic.role,
          status: "approved",
          doctorId: fx.session.id,
          hours: [],
        });
    }
    return R.json({
      clinics: memberships
        .filter((c) => c.doctorId === fx.session.id)
        .map((c) => ({
          ...c,
          name: fx.session.clinics.find((s) => s.id === c.id)?.name ?? c.name,
          city:
            savedClinicProfiles[c.id]?.city ||
            c.city ||
            locations[c.id]?.city ||
            "",
          state:
            savedClinicProfiles[c.id]?.state ||
            c.state ||
            locations[c.id]?.state ||
            "",
          notices: savedClinicProfiles[c.id]?.notices ?? [],
        })),
    });
  }),
  http.post(`${B}/me/linked-clinics`, async ({ request }) => {
    const { clinicId } = await request.json();
    const clinic = directory.find((c) => c.id === clinicId);
    if (!clinic)
      return R.json({ message: "Clinic not found." }, { status: 404 });
    if (
      memberships.some((c) => c.id === clinicId && c.doctorId === fx.session.id)
    )
      return R.json(
        { message: "You already have a membership or pending request." },
        { status: 409 },
      );
    memberships.push({
      ...clinic,
      doctorId: fx.session.id,
      role: "member",
      status: "pending",
      hours: [],
    });
    requests.push({
      id: crypto.randomUUID(),
      clinicId,
      clinicName: clinic.name,
      doctorId: fx.session.id,
      doctorName: fx.session.name,
    });
    return R.json({ status: "pending" });
  }),
  http.delete(`${B}/me/linked-clinics/:clinicId`, ({ params }) => {
    const index = memberships.findIndex(
      (c) => c.id === params.clinicId && c.doctorId === fx.session.id,
    );
    if (index < 0)
      return R.json({ message: "Membership not found." }, { status: 404 });
    if (memberships[index].role === "owner")
      return R.json(
        { message: "Transfer ownership before leaving your clinic." },
        { status: 409 },
      );
    rows[params.clinicId] = (rows[params.clinicId] ?? []).filter(
      (d) => d.id !== fx.session.id,
    );
    memberships.splice(index, 1);
    requests = requests.filter(
      (r) => r.clinicId !== params.clinicId || r.doctorId !== fx.session.id,
    );
    fx.session.clinics = fx.session.clinics.filter(
      (c) => c.id !== params.clinicId,
    );
    return R.json({ removed: true });
  }),
  http.get(`${B}/clinic-requests`, () =>
    R.json({ requests: requests.filter((r) => owns(r.clinicId)) }),
  ),
  http.post(`${B}/clinic-requests/:id/:decision`, ({ params }) => {
    const item = requests.find((r) => r.id === params.id);
    if (!item)
      return R.json({ message: "Request not found." }, { status: 404 });
    if (!owns(item.clinicId))
      return R.json(
        { message: "Only the principal doctor can review this request." },
        { status: 403 },
      );
    if (!["approve", "reject"].includes(params.decision))
      return R.json({ message: "Invalid decision." }, { status: 400 });
    const membership = memberships.find(
      (c) => c.id === item.clinicId && c.doctorId === item.doctorId,
    );
    if (params.decision === "approve") {
      if (membership) membership.status = "approved";
      else
        memberships.push({
          ...directory.find((c) => c.id === item.clinicId)!,
          doctorId: item.doctorId,
          role: "member",
          status: "approved",
          hours: [],
        });
      if (
        item.doctorId === fx.session.id &&
        !fx.session.clinics.some((c) => c.id === item.clinicId)
      )
        fx.session.clinics.push({
          id: item.clinicId,
          name: item.clinicName,
          role: "member",
          memberCount: 1,
        });
    } else {
      const index = memberships.indexOf(membership!);
      if (index >= 0) memberships.splice(index, 1);
    }
    syncDoctorRows();
    requests = requests.filter((r) => r.id !== item.id);
    return R.json({ status: params.decision });
  }),
  http.get(`${A}/me/preferences`, () => {
    return R.json(accountPreferences());
  }),
  http.put(`${A}/me/preferences`, async ({ request }) => {
    const body = await request.json();
    if (
      ![5, 15, 30, 60].includes(body.inactivityMinutes) ||
      body.language !== "en"
    )
      return R.json({ message: "Unsupported preference." }, { status: 400 });
    preferences.inactivityMinutes = body.inactivityMinutes;
    preferences.language = body.language;
    return R.json(accountPreferences());
  }),
  http.post(`${A}/me/mfa/send-code`, () => {
    mfaChallenge = true;
    return R.json({ devOtp: "123456" });
  }),
  http.post(`${A}/me/mfa/verify`, async ({ request }) => {
    const body = await request.json();
    if (
      !mfaChallenge ||
      body.code !== "123456" ||
      typeof body.enabled !== "boolean"
    )
      return R.json(
        { message: "Enter the demo code 123456." },
        { status: 400 },
      );
    preferences.mfaEnabled = body.enabled;
    mfaChallenge = false;
    return R.json(accountPreferences());
  }),
  http.post(`${A}/me/logout-everywhere`, () => {
    revokeDemoSessions();
    return R.json({ revoked: true });
  }),
  http.get(`${B}/billing/me`, () => R.json(subscription)),
  http.get(`${B}/billing/history`, () =>
    R.json({ history: paymentHistoryByAccount[fx.session.id] ?? [] }),
  ),
  http.post(`${B}/billing/checkout`, async ({ request }) => {
    const { plan: code, months } = await request.json();
    const plan = fx.plans.find((p) => p.code === code);
    if (!plan || ![6, 12].includes(months))
      return R.json(
        { message: "Choose a six-month or annual plan." },
        { status: 400 },
      );
    if (
      fx.session.role !== "doctor" ||
      (subscription.status === "active" && subscription.isPro && !plan.pro)
    )
      return R.json(
        { message: "This plan change is unavailable." },
        { status: 403 },
      );
    const now = new Date();
    const currentEnd = subscription.renewsAt
      ? new Date(subscription.renewsAt)
      : now;
    const end = addMonths(
      currentEnd > now ? currentEnd : now,
      months,
    ).toISOString();
    subscription = {
      ...subscription,
      plan: code,
      planName: plan.name,
      isPro: !!plan.pro,
      status: "active",
      startedAt: subscription.startedAt ?? now.toISOString(),
      renewsAt: end,
    };
    fx.session.plan = {
      ...fx.session.plan!,
      code,
      name: plan.name,
      isPro: !!plan.pro,
      active: true,
      endsAt: end,
    };
    const ref = crypto.randomUUID();
    orders.set(ref, {
      doctorId: fx.session.id,
      status: "success",
      entitlement: {
        active: true,
        planCode: code,
        isPro: !!plan.pro,
        endsAt: end,
      },
    });
    (paymentHistoryByAccount[fx.session.id] ??= []).unshift({
      id: ref,
      date: now.toISOString(),
      description: `${plan.name} — ${months === 6 ? "6 months" : "Annual"} (demo payment)`,
      amount: months === 6 ? plan.priceSixMonths : plan.priceAnnual,
    });
    return R.json({ paymentUrl: `/payment?ref=${ref}`, merchantTxnNo: ref });
  }),
  http.get(`${B}/billing/orders/:ref`, ({ params }) =>
    orders.get(params.ref)?.doctorId === fx.session.id
      ? R.json(orders.get(params.ref))
      : R.json({ message: "Order not found." }, { status: 404 }),
  ),
];

type SharedState = {
  directory: typeof directory;
  memberships: typeof memberships;
  requests: typeof requests;
  rows: typeof rows;
  profiles: typeof accountProfiles;
  clinics: typeof savedClinicProfiles;
  preferences: typeof preferencesByAccount;
  subscription: typeof subscriptionsByAccount;
  orders: [string, ReturnType<typeof orders.get>][];
  history: typeof paymentHistoryByAccount;
};
const snapshot = (): SharedState => ({
  directory,
  memberships,
  requests,
  rows,
  profiles: accountProfiles,
  clinics: savedClinicProfiles,
  preferences: preferencesByAccount,
  subscription: subscriptionsByAccount,
  orders: [...orders],
  history: paymentHistoryByAccount,
});
registerLocalPersistence({
  load: () => {
    const saved = structuredClone(readDemoState<SharedState>("profile-settings", snapshot()));
    directory.splice(0, directory.length, ...saved.directory);
    memberships.splice(0, memberships.length, ...saved.memberships);
    requests = saved.requests;
    Object.keys(rows).forEach((key) => delete rows[key]);
    Object.assign(rows, saved.rows);
    Object.assign(accountProfiles, saved.profiles);
    Object.keys(savedClinicProfiles).forEach(
      (key) => delete savedClinicProfiles[key],
    );
    Object.assign(savedClinicProfiles, saved.clinics);
    const profile = accountProfiles[fx.session.id];
    if (profile) {
      Object.assign(fx.doctor, profile);
      Object.assign(fx.session, {
        name: profile.name,
        email: profile.email,
        specialization: profile.specialization ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        mobile: profile.mobile ?? null,
      });
    }
    Object.assign(preferencesByAccount, saved.preferences);
    Object.assign(subscriptionsByAccount, saved.subscription);
    preferences = preferencesByAccount[fx.session.id] ?? preferences;
    subscription = subscriptionsByAccount[fx.session.id] ?? subscription;
    if (subscriptionsByAccount[fx.session.id])
      fx.session.plan = {
        ...fx.session.plan!,
        code: subscription.plan,
        name: subscription.planName,
        isPro: !!subscription.isPro,
        active: subscription.status === "active",
        endsAt: subscription.renewsAt,
      };
    orders.clear();
    saved.orders.forEach(([key, order]) => {
      if (order) orders.set(key, order);
    });
    Object.assign(paymentHistoryByAccount, saved.history);
    if (!restoredAccount) {
      restoredAccount = true;
      const account =
        typeof sessionStorage === "undefined"
          ? null
          : sessionStorage.getItem("medibank-demo:account");
      const role =
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("medibank-demo:role") === "receptionist"
          ? "receptionist"
          : "doctor";
      selectDemoAccount(account ?? baseSession.id, role);
    }
  },
  save: () => {
    accountProfiles[fx.session.id] = structuredClone(fx.doctor);
    preferencesByAccount[fx.session.id] = structuredClone(preferences);
    subscriptionsByAccount[fx.session.id] = structuredClone(subscription);
    writeDemoState("profile-settings", snapshot());
  },
});
export function savedClinic(id: string) {
  const clinic = savedClinicProfiles[id];
  const entry = directory.find((c) => c.id === id);
  return clinic
    ? {
        ...clinic,
        city: clinic.city || entry?.city || locations[id]?.city || "",
        state: clinic.state || entry?.state || locations[id]?.state || "",
      }
    : undefined;
}
export function storeClinic(clinic: Clinic) {
  savedClinicProfiles[clinic.id] = clinic;
  const entry = directory.find((c) => c.id === clinic.id);
  if (entry)
    Object.assign(entry, {
      name: clinic.name,
      address: clinic.address,
      city: clinic.city ?? entry.city ?? "",
      state: clinic.state ?? entry.state ?? "",
    });
  else
    directory.push({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      principal: fx.session.name,
      city: clinic.city ?? "",
      state: clinic.state ?? "",
    });
  memberships
    .filter((m) => m.id === clinic.id)
    .forEach((m) => {
      m.name = clinic.name;
      m.address = clinic.address;
    });
  if (
    !memberships.some((m) => m.id === clinic.id && m.doctorId === fx.session.id)
  )
    memberships.push({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      principal: fx.session.name,
      doctorId: fx.session.id,
      role: "owner",
      status: "approved",
      hours: [],
    });
}
