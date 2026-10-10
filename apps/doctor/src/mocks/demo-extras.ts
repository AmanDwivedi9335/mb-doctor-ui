import { local as http, LocalResponse as R } from "@/lib/local-data";
import * as fx from "./fixtures";
import type { Appointment, FrontDesk } from "@/types";
const B = "/api/v1/doctor";
const A = "/api/v1/auth";
const id = () => `demo-${crypto.randomUUID()}`;
const today = () => new Date().toLocaleDateString("sv-SE");
const appointments: Appointment[] = fx.appointments.map((a, i) => ({ ...a, time: `${today()}T${a.time.split("T")[1]}`, tokenNumber: i + 1, bookedBy: "MediBank app", doctorName: fx.doctor.name }));
let frontDesk: FrontDesk | null = { id: "desk1", username: "reception.mehta", name: "Neha Patel", createdAt: "2026-01-15", lastLogin: new Date().toISOString() };
const questions = [{ id: 1, text: "What was the name of your first school?" }, { id: 2, text: "What city were you born in?" }, { id: 3, text: "What is your favourite book?" }];
let answered = [1, 2];
const files = new Map<string, Blob>();
export function demoFile(path: string): Blob {
  const reportId = path.match(/\/reports\/([^/]+)\/file/)?.[1];
  if (reportId && files.has(reportId)) return files.get(reportId)!;
  const title = reportId ? fx.reports.find((r) => r.id === reportId)?.title ?? "Sample report" : "Clinic payment QR preview";
  return new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#f0fdfa"/><text x="45" y="75" font-size="28" fill="#0f766e">MediBank — Demo document</text><text x="45" y="145" font-size="22">${title.replace(/[<>&"]/g, "")}</text><text x="45" y="210" font-size="18">Priya Sharma · Sample data for presentation</text><text x="45" y="270" font-size="18">This preview contains no real clinical or payment information.</text></svg>`], { type: "image/svg+xml" });
}
export const extraHandlers = [
  http.get(`${B}/appointments`, ({ request }) => { const date = new URL(request.url).searchParams.get("date") ?? today(); return R.json({ appointments: appointments.map((a) => ({ ...a, time: `${date}T${a.time.split("T")[1]}` })) }); }),
  http.post(`${B}/appointments`, async ({ request }) => { const b = await request.json(); const a: Appointment = { id: id(), mid: b.mid, patientName: b.patient?.name ?? fx.patients[b.mid]?.name ?? "Demo patient", time: b.date, patient: b.patient, vitals: b.vitals, payment: b.payment, bookedBy: fx.doctor.name, reason: b.reason ?? "Consultation", status: "waiting", tokenNumber: appointments.length + 1, doctorName: fx.doctor.name }; appointments.push(a); return R.json(a); }),
  http.patch(`${B}/appointments/:id`, async ({ params, request }) => { const a = appointments.find((a) => a.id === params.id)!; Object.assign(a, await request.json()); return R.json(a); }),
  http.get(`${B}/appointments/lookup`, ({ request }) => { const q = new URL(request.url).searchParams.get("q"); const p = Object.values(fx.patients).find((p) => p.mid === q || p.phone?.replace(/\D/g, "").endsWith(q ?? "unknown")); const asLookup = (person: typeof p & {}) => ({ chartId: `chart-${person.mid}`, doctorId: fx.doctor.id, name: person.name, phone: person.phone ?? "", gender: person.gender, mid: person.mid }); const family = p?.phone ? Object.values(fx.patients).filter((person) => person.mid !== p.mid && person.phone === p.phone).map(asLookup) : []; return R.json({ patient: p ? asLookup(p) : null, family }); }),
  http.get(`${B}/front-desk`, () => R.json({ frontDesk })),
  http.post(`${B}/front-desk`, async ({ request }) => { const b = await request.json(); frontDesk = { id: id(), username: b.username, name: b.name, createdAt: new Date().toISOString(), lastLogin: null }; return R.json(frontDesk); }),
  http.delete(`${B}/front-desk`, () => { frontDesk = null; return R.json(null); }),
  http.post(`${B}/reports`, async ({ request }) => { const b = await request.json(); const report = { ...b, file: undefined, id: id(), fileName: b.file?.name, status: "pending" as const }; if (b.file instanceof Blob) files.set(report.id, b.file); fx.reports.push(report); return R.json(report); }),
  http.post(`${A}/login`, async ({ request }) => { const b = await request.json(); sessionStorage.setItem("doctor-mock-session", "1"); return R.json({ accessToken: "demo-token", refreshToken: "demo-session", user: { ...fx.session, role: b.role ?? "doctor" } }); }),
  http.get(`${A}/me/security-questions`, () => R.json({ questions, answered, minimum: 2 })),
  http.put(`${A}/me/security-answers`, async ({ request }) => { const b = await request.json(); answered = b.answers.map((a: { id: number }) => a.id); return R.json({ answered, minimum: 2 }); }),
  http.post(`${A}/recover/questions`, () => R.json({ questions })),
  http.post(`${A}/recover/verify`, () => R.json({ recoveryToken: "demo-recovery" })),
  http.post(`${A}/recover/send-code`, () => R.json({ devOtp: "123456" })),
  http.post(`${A}/recover/confirm`, () => R.json({ message: "Demo account recovered" })),
  http.post(`${A}/apply/send-code`, () => R.json({ message: "Demo code ready", devOtp: "123456" })),
  http.post(`${A}/apply`, async ({ request }) => {
    const body = await request.json();
    const { password: _password, code: _code, ...details } = body;
    Object.assign(fx.doctor, details);
    Object.assign(fx.session, { name: details.name, email: details.email, mobile: details.mobile, username: details.username, avatarUrl: details.avatarUrl, specialization: details.specialization });
    sessionStorage.setItem("doctor-mock-session", "1");
    return R.json({ accessToken: "demo-token", refreshToken: "demo-session", user: fx.session });
  }),
  http.get(`${A}/onboarding`, () => R.json({ ...fx.doctor, qualification: fx.doctor.education?.map((entry) => entry.qualification).join(", ") ?? "", registrationNo: fx.doctor.registrationIds?.join(", ") ?? "", documents: { degreeCertificate: false, registrationCertificate: false, govIdProof: false }, reviewStatus: fx.session.reviewStatus, reviewNote: fx.session.reviewNote })),
  http.patch(`${A}/onboarding`, async ({ request }) => { Object.assign(fx.session, await request.json()); return R.json(fx.session); }),
  http.post(`${A}/onboarding/documents`, () => R.json({ uploaded: true })),
  http.post(`${A}/apply/submit`, () => R.json({ submitted: true })),
  ...["email", "mobile"].flatMap((kind) => [http.post(`${A}/me/${kind}/send-code`, () => R.json({ devOtp: "123456" })), http.post(`${A}/me/${kind}/verify`, async ({ request }) => { Object.assign(fx.session, await request.json()); return R.json(fx.session); })]),
  http.post(`${A}/me/close`, () => { fx.session.deletionScheduledFor = "2026-11-07"; return R.json(fx.session); }),
  http.post(`${A}/me/keep`, () => { fx.session.deletionScheduledFor = null; return R.json(fx.session); }),
  http.post(`${B}/me/invites/:clinicId/:decision`, ({ params }) => R.json({ clinicId: params.clinicId, status: params.decision })),
];

