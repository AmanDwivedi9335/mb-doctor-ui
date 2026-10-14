import { addMonths } from "date-fns";
import { local as http, LocalResponse as R } from "@/lib/local-data";
import * as fx from "./fixtures";
import type {
  LinkedClinic,
  ClinicRequest,
  AccountPreferencesData,
} from "@/lib/profile-settings";
const B = "/api/v1/doctor";
const A = "/api/v1/auth";
const directory = [
  {
    id: "c1",
    name: fx.clinic.name,
    address: fx.clinic.address,
    principal: fx.doctor.name,
  },
  {
    id: "c2",
    name: "City Care Clinic",
    address: "MG Road, Pune",
    principal: "Dr. Priya Shah",
  },
  {
    id: "c3",
    name: "Community Health Centre",
    address: "Baner, Pune",
    principal: "Dr. Ravi Kumar",
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
const owns = (clinicId: string) =>
  fx.session.role === "doctor" &&
  fx.session.clinics.some((c) => c.id === clinicId && c.role === "owner");
export function syncLinkedClinics() {
  for (const membership of memberships.filter(
    (c) => c.doctorId === fx.session.id && c.status === "approved",
  )) {
    if (!fx.session.clinics.some((c) => c.id === membership.id))
      fx.session.clinics.push({
        id: membership.id,
        name: membership.name,
        role: membership.role,
        memberCount: 1,
      });
  }
}
const preferences: AccountPreferencesData = {
  mfaEnabled: false,
  inactivityMinutes: 30,
  language: "en",
  referralLink: "https://medibank.in/apply?ref=MB-DR-000001",
};
let mfaChallenge = false;
// Orders are session-local demo payments. Durations and receipts are retained per order.
const orders = new Map<
  string,
  {
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
export const profileSettingsHandlers = [
  http.post(`${A}/login`, async ({ request }) => {
    const body = await request.json();
    if (preferences.mfaEnabled && body.mfaCode !== "123456")
      return R.json(
        { message: "Enter your MFA code. Demo code: 123456." },
        { status: 428 },
      );
    sessionStorage.setItem("doctor-mock-session", "1");
    fx.session.role = body.role === "receptionist" ? "receptionist" : "doctor";
    return R.json({
      accessToken: "demo-token",
      refreshToken: "demo-session",
      user: fx.session,
    });
  }),
  http.get(`${B}/clinic-directory`, () => R.json({ clinics: directory })),
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
    requests = requests.filter((r) => r.id !== item.id);
    return R.json({ status: params.decision });
  }),
  http.get(`${A}/me/preferences`, () => R.json(preferences)),
  http.put(`${A}/me/preferences`, async ({ request }) => {
    const body = await request.json();
    if (
      ![5, 15, 30, 60].includes(body.inactivityMinutes) ||
      body.language !== "en"
    )
      return R.json({ message: "Unsupported preference." }, { status: 400 });
    preferences.inactivityMinutes = body.inactivityMinutes;
    preferences.language = body.language;
    return R.json(preferences);
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
    return R.json(preferences);
  }),
  http.post(`${A}/me/logout-everywhere`, () => {
    sessionStorage.setItem("doctor-mock-session", "0");
    if (typeof localStorage !== "undefined")
      localStorage.setItem("medibank-session-revoked", crypto.randomUUID());
    return R.json({ revoked: true });
  }),
  http.get(`${B}/billing/me`, () => R.json(subscription)),
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
      status: "success",
      entitlement: {
        active: true,
        planCode: code,
        isPro: !!plan.pro,
        endsAt: end,
      },
    });
    fx.subscriptionHistory.unshift({
      id: ref,
      date: now.toISOString(),
      description: `${plan.name} — ${months === 6 ? "6 months" : "Annual"} (demo payment)`,
      amount: months === 6 ? plan.priceSixMonths : plan.priceAnnual,
    });
    return R.json({ paymentUrl: `/payment?ref=${ref}`, merchantTxnNo: ref });
  }),
  http.get(`${B}/billing/orders/:ref`, ({ params }) =>
    orders.has(params.ref)
      ? R.json(orders.get(params.ref))
      : R.json({ message: "Order not found." }, { status: 404 }),
  ),
];
