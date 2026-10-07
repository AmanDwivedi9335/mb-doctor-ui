import { http, HttpResponse } from "msw";
import * as fx from "./fixtures";
import { ageFrom } from "@/lib/dates";
import type {
  Diagnosis,
  Procedure,
  FollowUp,
  WalkIn,
  ConsultationEntry,
  Vital,
  Report,
  ClinicDoctor,
  Staff,
  Invoice,
  SupportTicket,
  SummaryKind,
  SummaryRow,
} from "@/types";

// Mock backend base, origin-agnostic so it matches whatever host vite serves on.
const B = "*/api/v1/doctor";
const A = "*/api/v1/auth";

// A cross-reload session flag. The real backend uses an httpOnly refresh cookie;
// in the mock we keep a marker in sessionStorage so a page reload stays logged in.
const SESSION_KEY = "doctor-mock-session";
const hasSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};
const setSession = (on: boolean) => {
  try {
    on ? sessionStorage.setItem(SESSION_KEY, "1") : sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode: session simply will not persist across reload */
  }
};

const TOKEN = "mock.doctor.token";
const uid = (p: string) => `${p}-${Date.now()}-${Math.round(performance.now())}`;

// Mutable working copies so writes during a session are visible.
const diagnoses: Diagnosis[] = [...fx.diagnoses];
const procedures: Procedure[] = [...fx.procedures];
const followups: FollowUp[] = [...fx.followups];
const walkIns: WalkIn[] = [...fx.walkIns];
const vitals: Vital[] = [...fx.vitals];
const reports: Report[] = [...fx.reports];
const summary = Object.fromEntries(
  Object.entries(fx.summary).map(([k, v]) => [k, [...v]])
) as Record<SummaryKind, SummaryRow[]>;
const clinicDoctors: ClinicDoctor[] = fx.clinicDoctors.map((d) => ({ ...d }));
const staff: Staff[] = fx.staff.map((s) => ({ ...s }));
const invoices: Invoice[] = [...fx.invoices];
const tickets: SupportTicket[] = fx.supportTickets.map((t) => ({ ...t }));
const notifications = fx.notifications.map((n) => ({ ...n }));
let clinic = { ...fx.clinic };
let subscription = { ...fx.subscription };

const denied = (mid: string) =>
  fx.patients[mid] && !fx.patients[mid].consentGranted
    ? HttpResponse.json({ message: "Patient has not granted access to this doctor" }, { status: 403 })
    : null;
const notFound = (mid: string) =>
  !fx.patients[mid] ? HttpResponse.json({ message: "No patient found with that MID" }, { status: 404 }) : null;

/** Gate a per-patient endpoint: needs a mid, an existing patient, and consent. */
function gate(url: URL): { mid: string } | HttpResponse<any> {
  const mid = url.searchParams.get("mid");
  if (!mid) return HttpResponse.json({ message: "mid query parameter is required" }, { status: 400 });
  return notFound(mid) || denied(mid) || { mid };
}

export const handlers = [
  // ---------------------------------------------------------------- auth
  http.post(`${B}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body?.email?.toLowerCase() === fx.doctor.email && body?.password === fx.MOCK_PASSWORD) {
      setSession(true);
      return HttpResponse.json({ user: fx.doctor, token: TOKEN });
    }
    return HttpResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }),
  http.get(`${B}/auth/me`, () =>
    hasSession()
      ? HttpResponse.json({ user: fx.doctor, token: TOKEN })
      : HttpResponse.json({ message: "Not authenticated" }, { status: 401 })
  ),
  http.post(`${B}/auth/logout`, () => {
    setSession(false);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${B}/auth/change-password`, async ({ request }) => {
    const body = (await request.json()) as { currentPassword?: string };
    return body?.currentPassword === fx.MOCK_PASSWORD
      ? new HttpResponse(null, { status: 204 })
      : HttpResponse.json({ message: "Current password is incorrect" }, { status: 400 });
  }),
  http.post(`${B}/auth/forgot-password`, () => HttpResponse.json({ sent: true })),
  http.post(`${B}/auth/verify-otp`, async ({ request }) => {
    const body = (await request.json()) as { otp?: string };
    return body?.otp === "123456"
      ? HttpResponse.json({ verified: true, resetToken: "mock-reset-token" })
      : HttpResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
  }),
  http.post(`${B}/auth/reset-password`, () => new HttpResponse(null, { status: 204 })),

  // ---------------------------------------------------------- config/dashboard
  http.get(`${B}/config/feature-flags`, () => HttpResponse.json(fx.featureFlags)),
  http.get(`${B}/dashboard/stats`, () => HttpResponse.json(fx.dashboardStats)),
  http.get(`${B}/dashboard/overview`, () => HttpResponse.json(fx.dashboardOverview)),
  http.get(`${B}/dashboard/analytics/patients`, () => HttpResponse.json(fx.patientAnalytics)),
  http.get(`${B}/dashboard/analytics/billing`, () => HttpResponse.json(fx.billingAnalytics)),
  http.get(`${B}/walk-ins`, () => HttpResponse.json({ walkIns })),
  // Consultation history: MID diagnoses joined to their patient, plus walk-ins,
  // newest first. This is the join a real backend would do server-side.
  http.get(`${B}/history`, () => {
    const fromMid: ConsultationEntry[] = diagnoses.map((d) => {
      const p = fx.patients[d.mid];
      const age = p ? ageFrom(p.dateOfBirth) : null;
      return {
        id: d.id,
        date: d.date,
        patientName: p?.name ?? d.mid,
        patientMeta: [age != null ? String(age) : null, p?.gender].filter(Boolean).join(" / "),
        phone: p?.phone,
        mid: d.mid,
        complaint: d.name,
        medications: (d.medications ?? []).map((m) => m.name),
        recordedBy: d.recordedBy,
      };
    });
    const fromWalkIns: ConsultationEntry[] = walkIns.map((w) => ({
      id: w.id,
      date: w.diagnosis.date,
      patientName: w.patient.name,
      patientMeta: `${w.patient.age} / ${w.patient.gender}`,
      phone: w.patient.phone,
      walkIn: w,
      complaint: w.diagnosis.name,
      medications: (w.diagnosis.medications ?? []).map((m) => m.name),
      recordedBy: w.recordedBy,
    }));
    const entries = [...fromMid, ...fromWalkIns].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return HttpResponse.json({ entries });
  }),
  http.post(`${B}/walk-ins`, async ({ request }) => {
    const body = (await request.json()) as Omit<WalkIn, "id" | "recordedBy" | "createdAt">;
    const patient = { ...body.patient, age: String(ageFrom(body.patient.dob ?? "") ?? "") };
    const created: WalkIn = { ...body, patient, id: uid("w"), recordedBy: fx.doctor.name, createdAt: new Date().toISOString() };
    walkIns.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(`${B}/appointments`, () => HttpResponse.json({ appointments: fx.appointments })),
  http.patch(`${B}/appointments/:id`, async ({ params, request }) => {
    const a = fx.appointments.find((x) => x.id === params.id);
    if (!a) return HttpResponse.json({ message: "Appointment not found" }, { status: 404 });
    a.status = ((await request.json()) as { status: typeof a.status }).status;
    return HttpResponse.json({ id: a.id, status: a.status });
  }),

  // ------------------------------------------------- patient + clinical reads
  http.get(`${B}/patients`, ({ request }) => {
    const g = gate(new URL(request.url));
    if (g instanceof HttpResponse) return g;
    return HttpResponse.json({ patient: fx.patients[g.mid] });
  }),
  http.post(`${B}/patients/consent-request`, () =>
    HttpResponse.json({ requested: true, message: "Consent request sent to the patient." })
  ),

  http.get(`${B}/summary/:kind`, ({ params, request }) => {
    const g = gate(new URL(request.url));
    if (g instanceof HttpResponse) return g;
    const rows = summary[params.kind as SummaryKind];
    if (!rows) return HttpResponse.json({ message: "Unknown summary kind" }, { status: 404 });
    return HttpResponse.json({ rows: rows.filter((r) => r.mid === g.mid) });
  }),
  http.post(`${B}/summary/:kind`, async ({ params, request }) => {
    const rows = summary[params.kind as SummaryKind];
    if (!rows) return HttpResponse.json({ message: "Unknown summary kind" }, { status: 404 });
    const body = (await request.json()) as SummaryRow; // id is server-assigned below
    const created: SummaryRow = { ...body, id: uid("s") };
    rows.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${B}/diagnosis`, ({ request }) => {
    const g = gate(new URL(request.url));
    if (g instanceof HttpResponse) return g;
    return HttpResponse.json({ diagnoses: diagnoses.filter((d) => d.mid === g.mid) });
  }),
  http.post(`${B}/diagnosis`, async ({ request }) => {
    const body = (await request.json()) as Omit<Diagnosis, "id" | "recordedBy">;
    const created: Diagnosis = { ...body, id: uid("d"), recordedBy: fx.doctor.name };
    diagnoses.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${B}/procedures`, ({ request }) => {
    const g = gate(new URL(request.url));
    if (g instanceof HttpResponse) return g;
    return HttpResponse.json({ procedures: procedures.filter((p) => p.mid === g.mid) });
  }),
  http.post(`${B}/procedures`, async ({ request }) => {
    const body = (await request.json()) as Omit<Procedure, "id" | "recordedBy">;
    const created: Procedure = { ...body, id: uid("p"), recordedBy: fx.doctor.name };
    procedures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${B}/reports`, ({ request }) => {
    const g = gate(new URL(request.url));
    if (g instanceof HttpResponse) return g;
    return HttpResponse.json({ reports: reports.filter((r) => r.mid === g.mid) });
  }),
  http.post(`${B}/reports`, async ({ request }) => {
    const body = (await request.json()) as Omit<Report, "id" | "status">;
    const created: Report = { ...body, id: uid("r"), status: "pending" };
    reports.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${B}/reports/:id/verify`, ({ params }) => {
    const r = reports.find((x) => x.id === params.id);
    if (!r) return HttpResponse.json({ message: "Report not found" }, { status: 404 });
    r.status = "verified";
    r.verifiedBy = fx.doctor.name;
    return HttpResponse.json(r);
  }),

  http.get(`${B}/health-data`, ({ request }) => {
    const g = gate(new URL(request.url));
    if (g instanceof HttpResponse) return g;
    return HttpResponse.json({ vitals: vitals.filter((v) => v.mid === g.mid) });
  }),
  http.post(`${B}/health-data`, async ({ request }) => {
    const body = (await request.json()) as Omit<Vital, "id">;
    const created: Vital = { ...body, id: uid("v") };
    vitals.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${B}/followups`, ({ request }) => {
    const url = new URL(request.url);
    // No mid = the doctor's own list across all patients they follow.
    if (!url.searchParams.get("mid")) return HttpResponse.json({ followups });
    const g = gate(url);
    if (g instanceof HttpResponse) return g;
    return HttpResponse.json({ followups: followups.filter((f) => f.mid === g.mid) });
  }),
  http.post(`${B}/followups`, async ({ request }) => {
    const body = (await request.json()) as Omit<FollowUp, "id">;
    const created: FollowUp = { ...body, id: uid("f") };
    followups.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // -------------------------------------------------------- clinic: profile
  http.get(`${B}/clinic/profile`, () => HttpResponse.json(clinic)),
  http.put(`${B}/clinic/profile`, async ({ request }) => {
    const body = (await request.json()) as Partial<typeof clinic>;
    clinic = { ...clinic, ...body };
    return HttpResponse.json(clinic);
  }),
  http.post(`${B}/clinic/profile/logo`, () => {
    clinic = { ...clinic, logoUrl: "mock://logo.png" };
    return HttpResponse.json({ logoUrl: clinic.logoUrl });
  }),
  http.post(`${B}/clinic/profile/qr-code`, () => {
    clinic = { ...clinic, qrUrl: "mock://qr.png" };
    return HttpResponse.json({ qrUrl: clinic.qrUrl });
  }),

  // -------------------------------------------------------- clinic: doctors
  http.get(`${B}/clinic/doctors`, () => HttpResponse.json({ doctors: clinicDoctors })),
  http.post(`${B}/clinic/doctors`, async ({ request }) => {
    const body = (await request.json()) as Omit<ClinicDoctor, "id" | "qualifications" | "active">;
    const created: ClinicDoctor = { ...body, id: uid("cd"), qualifications: [], active: true };
    clinicDoctors.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${B}/clinic/doctors/:id`, async ({ params, request }) => {
    const d = clinicDoctors.find((x) => x.id === params.id);
    if (!d) return HttpResponse.json({ message: "Doctor not found" }, { status: 404 });
    Object.assign(d, await request.json());
    return HttpResponse.json(d);
  }),
  http.delete(`${B}/clinic/doctors/:id`, ({ params }) => {
    const i = clinicDoctors.findIndex((x) => x.id === params.id);
    if (i >= 0) clinicDoctors.splice(i, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${B}/clinic/doctors/:id/qualifications`, async ({ params, request }) => {
    const d = clinicDoctors.find((x) => x.id === params.id);
    if (!d) return HttpResponse.json({ message: "Doctor not found" }, { status: 404 });
    const q = { ...(await request.json() as object), id: uid("q") } as ClinicDoctor["qualifications"][number];
    d.qualifications.push(q);
    return HttpResponse.json(q, { status: 201 });
  }),

  // --------------------------------------------------------- clinic: staff
  http.get(`${B}/clinic/staff`, () => HttpResponse.json({ staff })),
  http.post(`${B}/clinic/staff`, async ({ request }) => {
    const body = (await request.json()) as Omit<Staff, "id" | "active">;
    const created: Staff = { ...body, id: uid("s"), active: true };
    staff.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${B}/clinic/staff/:id`, async ({ params, request }) => {
    const s = staff.find((x) => x.id === params.id);
    if (!s) return HttpResponse.json({ message: "Staff not found" }, { status: 404 });
    Object.assign(s, await request.json());
    return HttpResponse.json(s);
  }),
  http.delete(`${B}/clinic/staff/:id`, ({ params }) => {
    const i = staff.findIndex((x) => x.id === params.id);
    if (i >= 0) staff.splice(i, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ------------------------------------------------- clinic: subscription/faqs
  http.get(`${B}/clinic/subscription`, () => HttpResponse.json(subscription)),
  http.get(`${B}/clinic/subscription/history`, () => HttpResponse.json({ history: fx.subscriptionHistory })),
  http.get(`${B}/clinic/plans`, () => HttpResponse.json({ plans: fx.plans })),
  http.post(`${B}/clinic/subscription`, async ({ request }) => {
    const body = (await request.json()) as { plan?: string };
    const plan = fx.plans.find((p) => p.code === body?.plan);
    if (plan) subscription = { ...subscription, plan: plan.code, planName: plan.name, seats: plan.seats, status: "active" };
    return HttpResponse.json(subscription);
  }),
  http.get(`${B}/clinic/faqs`, () => HttpResponse.json({ faqs: fx.faqs })),

  // ------------------------------------------------------------- billing
  http.get(`${B}/clinic/billing`, () => HttpResponse.json({ invoices })),
  http.post(`${B}/clinic/billing`, async ({ request }) => {
    const body = (await request.json()) as Omit<Invoice, "id" | "number">;
    const created: Invoice = { ...body, id: uid("inv"), number: `INV-2026-${String(1000 + invoices.length).slice(1)}` };
    invoices.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // ------------------------------------------------------------- support
  http.get(`${B}/support/messages`, () => HttpResponse.json({ tickets })),
  http.post(`${B}/support/message`, async ({ request }) => {
    const body = (await request.json()) as { subject?: string; text?: string };
    const created: SupportTicket = {
      id: uid("t"),
      subject: body?.subject ?? "Untitled",
      status: "open",
      createdAt: new Date().toISOString().slice(0, 10),
      unread: false,
      messages: [{ id: uid("m"), from: "doctor", text: body?.text ?? "", at: new Date().toISOString() }],
    };
    tickets.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.post(`${B}/support/messages/:id/reply`, async ({ params, request }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (!t) return HttpResponse.json({ message: "Ticket not found" }, { status: 404 });
    const body = (await request.json()) as { text?: string };
    t.messages.push({ id: uid("m"), from: "doctor", text: body?.text ?? "", at: new Date().toISOString() });
    t.status = "pending";
    return HttpResponse.json(t);
  }),
  http.patch(`${B}/support/messages/:id/read`, ({ params }) => {
    const t = tickets.find((x) => x.id === params.id);
    if (t) t.unread = false;
    return new HttpResponse(null, { status: 204 });
  }),

  // --------------------------------------------------------- notifications
  http.get(`${B}/notifications`, () => HttpResponse.json({ notifications })),
  http.patch(`${B}/notifications/:id/read`, ({ params }) => {
    const n = notifications.find((x) => x.id === params.id);
    if (n) n.read = true;
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${B}/notifications/read-all`, () => {
    notifications.forEach((n) => (n.read = true));
    return new HttpResponse(null, { status: 204 });
  }),

  // ------------------------------------------------------------- profile
  http.get(`${B}/profile`, () => HttpResponse.json(fx.doctor)),
  http.put(`${B}/profile`, async ({ request }) => {
    const body = (await request.json()) as Partial<typeof fx.doctor>;
    return HttpResponse.json({ ...fx.doctor, ...body });
  }),

  // ---------------------------------------------------------------- real-shape auth + session
  http.post(`${A}/login`, async ({ request }) => {
    const body = (await request.json()) as { identifier?: string; email?: string; password?: string };
    const id = (body?.identifier ?? body?.email ?? "").toLowerCase();
    if ((id === fx.doctor.email || id === fx.session.username) && body?.password === fx.MOCK_PASSWORD) {
      setSession(true);
      return HttpResponse.json({ accessToken: TOKEN, refreshToken: "mock.refresh", user: fx.session });
    }
    return HttpResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }),
  http.post(`${A}/refresh`, () =>
    hasSession() ? HttpResponse.json({ accessToken: TOKEN, refreshToken: "mock.refresh" }) : HttpResponse.json({ message: "Refresh token revoked" }, { status: 401 })
  ),
  http.post(`${A}/logout`, () => {
    setSession(false);
    return HttpResponse.json({ message: "Logged out" });
  }),
  http.post(`${A}/change-password`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${A}/forgot-password`, () => HttpResponse.json({ message: "If that email is registered, a code is on its way.", devOtp: "123456" })),
  http.post(`${A}/verify-otp`, () => HttpResponse.json({ verified: true, resetToken: "mock-reset-token" })),
  http.post(`${A}/reset-password`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${B}/me`, () => (hasSession() ? HttpResponse.json({ user: fx.session }) : HttpResponse.json({ message: "Authentication required" }, { status: 401 }))),

  // ---------------------------------------------------------------- billing (doctor plans)
  http.get(`${B}/billing/plans`, () => HttpResponse.json({ plans: fx.plans })),
  http.get(`${B}/billing/me`, () => HttpResponse.json(subscription)),
  http.get(`${B}/billing/history`, () => HttpResponse.json({ history: fx.subscriptionHistory })),
  http.post(`${B}/billing/checkout`, () => HttpResponse.json({ paymentUrl: "/payment?ref=MOCKORDER", merchantTxnNo: "MOCKORDER" })),
  http.get(`${B}/billing/orders/:ref`, () =>
    HttpResponse.json({ status: "success", entitlement: { active: true, planCode: "pro", isPro: true, endsAt: "2026-10-30" } })
  ),

  // ---------------------------------------------------------------- clinics, invites, front desk
  http.get(`${B}/clinics`, () => HttpResponse.json({ clinics: fx.session.clinics })),
  http.post(`${B}/clinics`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({ ...clinic, id: uid("clinic"), name: body.name }, { status: 201 });
  }),
  http.post(`${B}/clinics/:id/invites`, ({ params }) => HttpResponse.json({ clinicId: params.id, doctorId: uid("dr"), status: "pending" }, { status: 201 })),
  http.get(`${B}/me/invites`, () => HttpResponse.json({ invites: [] })),
  http.get(`${B}/front-desk`, () => HttpResponse.json({ frontDesk: null })),
  http.post(`${B}/front-desk`, async ({ request }) => {
    const body = (await request.json()) as { username: string; name: string };
    return HttpResponse.json({ id: uid("desk"), username: body.username, name: body.name, role: "receptionist", active: true }, { status: 201 });
  }),
  http.delete(`${B}/front-desk`, () => new HttpResponse(null, { status: 204 })),
];
