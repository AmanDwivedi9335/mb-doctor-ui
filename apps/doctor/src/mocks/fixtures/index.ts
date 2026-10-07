import type {
  DoctorUser,
  Patient,
  Diagnosis,
  Procedure,
  Report,
  Vital,
  FollowUp,
  Appointment,
  WalkIn,
  Clinic,
  ClinicDoctor,
  Staff,
  Plan,
  Subscription,
  SubscriptionEvent,
  Faq,
  Invoice,
  SupportTicket,
  Notification,
  PatientAnalytics,
  BillingAnalytics,
  DashboardOverview,
  SummaryKind,
  SummaryRow,
  Session,
} from "@/types";

/** The signed-in doctor (matches the prototype's test account). */
export const doctor: DoctorUser = {
  id: "6a1b6721c40e0c471b4f5aad",
  name: "Dr. Anand Mehta",
  email: "dr.mehta@test.com",
  role: "doctor",
  specialization: "General Medicine",
  clinicName: "Mehta Medical Centre",
  avatarUrl: null,
};

export const MOCK_PASSWORD = "doctor123";

/** What /auth/login and /doctor/me answer in the mock: an approved, paid Pro doctor with one clinic. */
export const session: Session = {
  id: doctor.id,
  email: doctor.email,
  name: doctor.name,
  role: "doctor",
  username: "dr.mehta",
  doctorId: doctor.id,
  needsOnboarding: false,
  doctorNo: "MB-DR-000001",
  specialization: doctor.specialization ?? null,
  avatarUrl: null,
  reviewStatus: "approved",
  reviewNote: null,
  suspendedAt: null,
  mobile: null,
  deletionScheduledFor: null,
  plan: { code: "pro", name: "Pro", active: true, endsAt: "2026-09-30", isPro: true, enforced: true },
  clinics: [{ id: "c1", name: "Mehta Medical Centre", role: "owner", memberCount: 3 }],
  practice: { name: "Mehta Medical Centre", address: null, phone: null, email: null },
};

/** A patient who HAS granted consent to this doctor. */
export const consentedMid = "22052661001002";
/** A patient who exists but has NOT granted consent. */
export const noConsentMid = "M012561001001";

export const patients: Record<string, Patient> = {
  [consentedMid]: {
    mid: consentedMid,
    name: "Priya Sharma",
    gender: "Female",
    dateOfBirth: "1984-07-19",
    bloodGroup: "O+",
    phone: "+91 90400 12345",
    city: "Hyderabad",
    email: "priya.sharma@example.com",
    address: "12 Jubilee Hills, Hyderabad, TS 500033",
    allergies: ["Penicillin"],
    consentGranted: true,
  },
  [noConsentMid]: {
    mid: noConsentMid,
    name: "Arjun Rao",
    gender: "Male",
    dateOfBirth: "1991-02-03",
    allergies: [],
    consentGranted: false,
  },
};

export const diagnoses: Diagnosis[] = [
  { id: "d1", mid: consentedMid, name: "Type 2 Diabetes Mellitus", code: "E11.9", status: "Confirmed", notes: "HbA1c 7.8%. Continue metformin, review in 3 months.", doctorNotes: "Poor diet adherence. Counsel again next visit.", medications: [{ name: "Metformin", amount: "500", unit: "Mg", times: ["Morning", "Night"], duration: "90 Days", instructions: "After Food" }], tests: [{ name: "HbA1c", notes: "Repeat in 3 months" }, { name: "Lipid Profile" }], vitals: { temperature: "36.9", heartRate: "76", respRate: "16", bloodPressure: "138/86", spo2: "98", weight: "68" }, date: "2026-05-24", recordedBy: "Dr. Mehta" },
  { id: "d2", mid: consentedMid, name: "Essential Hypertension", code: "I10", status: "Confirmed", notes: "BP 138/86 on amlodipine.", date: "2026-05-24", recordedBy: "Dr. Mehta" },
  { id: "d3", mid: consentedMid, name: "Vitamin D deficiency", code: "E55.9", status: "Suspected", notes: "Awaiting serum 25-OH-D.", date: "2026-03-11", recordedBy: "Dr. Mehta" },
  { id: "d4", mid: consentedMid, name: "Iron deficiency anaemia", code: "D50.9", status: "To Rule Out", date: "2026-01-08", recordedBy: "Dr. Iyer" },
];

export const procedures: Procedure[] = [
  { id: "p1", mid: consentedMid, name: "ECG (12-lead)", notes: "Normal sinus rhythm.", date: "2026-05-24", recordedBy: "Dr. Mehta" },
  { id: "p2", mid: consentedMid, name: "Fundus examination", notes: "No diabetic retinopathy.", date: "2026-02-15", recordedBy: "Dr. Mehta" },
];

export const reports: Report[] = [
  { id: "r1", mid: consentedMid, title: "HbA1c + Fasting glucose", category: "Pathology", date: "2026-05-22", status: "verified", fileName: "hba1c-2026-05.pdf", verifiedBy: "Dr. Mehta" },
  { id: "r2", mid: consentedMid, title: "Lipid profile", category: "Pathology", date: "2026-05-22", status: "pending", fileName: "lipid-2026-05.pdf" },
  { id: "r3", mid: consentedMid, title: "Chest X-ray PA", category: "Imaging", date: "2026-04-30", status: "verified", fileName: "cxr-2026-04.pdf", verifiedBy: "Dr. Iyer" },
];

export const vitals: Vital[] = [
  { id: "v1", mid: consentedMid, type: "blood_pressure", value: { systolic: 138, diastolic: 86 }, unit: "mmHg", recordDate: "2026-05-24" },
  { id: "v2", mid: consentedMid, type: "blood_glucose", value: 118, unit: "mg/dL", recordDate: "2026-05-24" },
  { id: "v3", mid: consentedMid, type: "heart_rate", value: 76, unit: "bpm", recordDate: "2026-05-24" },
  { id: "v4", mid: consentedMid, type: "weight", value: 68, unit: "kg", recordDate: "2026-05-24" },
];

export const followups: FollowUp[] = [
  { id: "f1", mid: consentedMid, patientName: "Priya Sharma", reason: "Diabetes review + repeat HbA1c", dueOn: "2026-08-24", status: "upcoming" },
  { id: "f2", mid: consentedMid, patientName: "Priya Sharma", reason: "BP check", dueOn: "2026-08-10", status: "overdue" },
];

export const appointments: Appointment[] = [
  { id: "a1", mid: consentedMid, patientName: "Priya Sharma", time: "2026-08-23T09:30:00", reason: "Diabetes review", status: "waiting" },
  { id: "a2", patientName: "Rahul Verma", time: "2026-08-23T10:00:00", reason: "New consult", status: "waiting" },
  { id: "a3", patientName: "Sunita Devi", time: "2026-08-23T10:30:00", reason: "Follow-up", status: "in-progress" },
  { id: "a4", patientName: "Imran Khan", time: "2026-08-23T11:15:00", reason: "Report review", status: "completed" },
];

export const walkIns: WalkIn[] = [
  {
    id: "w-1001",
    patient: { name: "Meena Rao", age: "30", gender: "Female", phone: "9812345678" },
    diagnosis: {
      name: "Migraine",
      code: "G43.9",
      status: "Suspected",
      date: "2026-08-22",
      notes: "Recurrent unilateral headache, photophobia.",
      medications: [{ name: "Ibuprofen", amount: "400", unit: "Mg", times: ["Morning", "Night"], duration: "3 Days", instructions: "After Food" }],
      tests: [],
      vitals: { bloodPressure: "118/76" },
    },
    recordedBy: doctor.name,
    createdAt: "2026-08-22T11:20:00",
  },
  {
    id: "w-1002",
    patient: { name: "Arjun S", age: "8", gender: "Male" },
    diagnosis: {
      name: "Fever with cough",
      status: "Confirmed",
      date: "2026-08-21",
      medications: [{ name: "Paracetamol", amount: "250", unit: "Mg", times: ["Morning", "Afternoon", "Night"], duration: "3 Days", instructions: "After Food" }],
      tests: [{ name: "Complete Blood Count (CBC)" }],
      vitals: { temperature: "38.9" },
    },
    recordedBy: doctor.name,
    createdAt: "2026-08-21T16:05:00",
  },
];

export const featureFlags = {
  version: "1.0",
  flags: {
    search_mid: true,
    patient_summary: true,
    diagnosis: true,
    procedures: true,
    reports: true,
    report_verification: true,
    health_graph: true,
    clinic_appointments: true,
    clinic_billing: true,
    analytics: true,
    clinic_support: true,
    clinic_settings: true,
  } as Record<string, boolean>,
};

export const dashboardStats = {
  todayAppointments: 4,
  pendingReports: 1,
  followupsDue: 2,
  patientsSeenToday: 3,
};

// --- Clinic management ---

export const clinic: Clinic = {
  id: "6a1b6e79925acc278c7ab2e2",
  name: "Mehta Medical Centre",
  address: "45 MG Road, Gachibowli Circle, Hyderabad, TS 500032",
  website: "www.mehtamedical.in",
  receptionMobile: "+91 90400 01234",
  upiId: "mehtamedical@upi",
  operatingHoursStart: "09:00",
  operatingHoursEnd: "20:00",
  logoUrl: null,
  qrUrl: null,
};

export const clinicDoctors: ClinicDoctor[] = [
  {
    id: "cd1",
    name: "Dr. Anand Mehta",
    email: "dr.mehta@test.com",
    specialization: "General Medicine",
    phone: "+91 90400 01234",
    registrationNo: "TSMC/2011/45231",
    active: true,
    qualifications: [
      { id: "q1", degree: "MBBS", institution: "Osmania Medical College", year: 2008 },
      { id: "q2", degree: "MD (General Medicine)", institution: "NIMS Hyderabad", year: 2012 },
    ],
  },
  {
    id: "cd2",
    name: "Dr. Kavya Iyer",
    email: "dr.iyer@test.com",
    specialization: "Endocrinology",
    phone: "+91 90400 05678",
    registrationNo: "TSMC/2015/61092",
    active: true,
    qualifications: [{ id: "q3", degree: "MBBS", institution: "Kasturba Medical College", year: 2011 }],
  },
];

export const staff: Staff[] = [
  { id: "s1", name: "Ramesh Kumar", role: "receptionist", phone: "+91 90400 22001", email: "reception@mehtamedical.in", active: true },
  { id: "s2", name: "Sister Anitha", role: "nurse", phone: "+91 90400 22002", active: true },
  { id: "s3", name: "Vijay Menon", role: "manager", phone: "+91 90400 22003", email: "vijay@mehtamedical.in", active: true },
];

export const plans: Plan[] = [
  { code: "basic", name: "Basic", priceMonthly: 200, seats: 1, pro: false, features: ["Patient lookup by MID, with the patient's consent", "Diagnosis, procedures, reports and follow-ups", "Consultation history"] },
  { code: "pro", name: "Pro", priceMonthly: 500, seats: 1, pro: true, features: ["Everything in Basic", "Clinic management: appointments, invoices, analytics", "Multiple clinics with one switch", "One front-desk account", "Invite doctors to your clinics"] },
];

export const subscription: Subscription = {
  plan: "pro",
  planName: "Pro",
  status: "active",
  startedAt: "2026-08-30",
  renewsAt: "2026-09-30",
  seats: 1,
  isPro: true,
  enforced: true,
  suspendedAt: null,
};

export const subscriptionHistory: SubscriptionEvent[] = [
  { id: "se1", date: "2026-08-30", description: "Pro plan renewal", amount: 2499 },
  { id: "se2", date: "2026-05-30", description: "Upgraded Starter to Pro", amount: 2499 },
  { id: "se3", date: "2026-05-30", description: "Starter plan started", amount: 999 },
];

export const faqs: Faq[] = [
  { id: "faq1", question: "How does a patient share records with me?", answer: "The patient grants consent from their MediBank app using your clinic MID. Once granted, their records appear in the patient workspace." },
  { id: "faq2", question: "What is a MID?", answer: "A MediBank ID: a unique identifier every patient has. Type it on the Find patient screen to open their record." },
  { id: "faq3", question: "Can I add another doctor to my clinic?", answer: "Yes, under Settings > Doctors, if your plan has spare seats. The Pro plan includes 3 seats." },
  { id: "faq4", question: "How do I verify a lab report?", answer: "Open the patient's Reports tab and use Verify on a pending report. Verified reports show your name against them." },
];

// --- Billing ---

export const invoices: Invoice[] = [
  { id: "inv1", number: "INV-2026-0042", patientName: "Priya Sharma", mid: consentedMid, date: "2026-08-23", items: [{ description: "Consultation", amount: 600 }, { description: "ECG", amount: 300 }], total: 900, paid: 900, status: "paid", mode: "UPI" },
  { id: "inv2", number: "INV-2026-0041", patientName: "Rahul Verma", date: "2026-08-22", items: [{ description: "Consultation", amount: 600 }], total: 600, paid: 0, status: "unpaid" },
  { id: "inv3", number: "INV-2026-0040", patientName: "Sunita Devi", date: "2026-08-21", items: [{ description: "Consultation", amount: 600 }, { description: "Dressing", amount: 250 }], total: 850, paid: 500, status: "partial", mode: "Cash" },
];

// --- Support ---

export const supportTickets: SupportTicket[] = [
  {
    id: "t1",
    subject: "Report upload stuck on large PDFs",
    status: "pending",
    createdAt: "2026-08-20",
    unread: true,
    messages: [
      { id: "m1", from: "doctor", text: "Uploading a 30MB scan fails silently. Smaller files work.", at: "2026-08-20T10:00:00" },
      { id: "m2", from: "support", text: "Thanks for flagging. The limit is 25MB; we are raising it. Meanwhile, please compress the scan.", at: "2026-08-20T12:30:00" },
    ],
  },
  {
    id: "t2",
    subject: "How to add a second clinic location?",
    status: "resolved",
    createdAt: "2026-08-12",
    unread: false,
    messages: [
      { id: "m3", from: "doctor", text: "Can I run two branches under one account?", at: "2026-08-12T09:00:00" },
      { id: "m4", from: "support", text: "Multi-branch is on the Clinic plan. I have shared a setup guide by email.", at: "2026-08-12T15:00:00" },
    ],
  },
];

// --- Global ---

export const notifications: Notification[] = [
  { id: "n1", title: "Lab report ready", body: "Lipid profile for Priya Sharma is ready to review.", at: "2026-08-23T08:15:00", read: false, kind: "report" },
  { id: "n2", title: "New appointment", body: "Rahul Verma booked a 10:00 AM slot today.", at: "2026-08-23T07:50:00", read: false, kind: "appointment" },
  { id: "n3", title: "Consent granted", body: "Priya Sharma granted you access to her records.", at: "2026-08-22T18:20:00", read: true, kind: "consent" },
  { id: "n4", title: "Subscription renews soon", body: "Your Pro plan renews on 30 Sep 2026.", at: "2026-08-21T09:00:00", read: true, kind: "system" },
];

export const dashboardOverview: DashboardOverview = {
  cards: [
    { label: "Total patients", value: "1,284", delta: "+1.2%", deltaTone: "up" },
    { label: "New patients", value: "3", hint: "today" },
    { label: "Time for appt", value: "42", unit: "min", delta: "+3.8%", deltaTone: "down" },
    { label: "Patients age", value: "26", unit: "yrs", hint: "median" },
    { label: "PSS", value: "4.98", delta: "+1.2%", deltaTone: "up", hint: "satisfaction" },
  ],
  diagnoses: [
    { label: "HTN", pct: 24 },
    { label: "Dyslipidemia", pct: 20 },
    { label: "CAD/Angina", pct: 16 },
    { label: "Arrhythmias", pct: 12 },
    { label: "Heart Failure", pct: 8 },
    { label: "Post-MI/PCI", pct: 6 },
    { label: "Other", pct: 14 },
  ],
  patientsByHour: [
    { time: "8:00", male: 3, female: 2 },
    { time: "10:00", male: 6, female: 5 },
    { time: "12:00", male: 9, female: 7 },
    { time: "14:00", male: 5, female: 8 },
    { time: "16:00", male: 8, female: 6 },
    { time: "18:00", male: 6, female: 9 },
    { time: "20:00", male: 4, female: 3 },
  ],
  lastVisit: {
    patientName: "Thompson Carter",
    code: "ECG-CD45-MK9",
    sex: "Male",
    age: 28,
    tags: ["Fever", "Cough", "Chest Pain"],
    lastChecked: "Dr. Patel on 18 Apr 2026",
    observation: "Elevated WBC and low oxygen saturation at rest",
    diagnosis: "Community-acquired pneumonia (right lower lobe), acute hypoxemic respiratory failure. ICD-10: J18.9 + J96.01",
    prescription: ["Ibuprofen — 2 times a day", "Amoxicillin — 3 times a day", "meal: Take 1 hour before food"],
    notes: "Patient reported improvement in symptoms but still experiencing fatigue.",
  },
  schedule: [
    { id: "ev1", title: "New Patient — Thompson", subtitle: "Room 305B, Clinic Wing B", start: "20:00", end: "20:45", kind: "patient", tag: "New Patient" },
    { id: "ev2", title: "Team daily planning", subtitle: "Conference Room A1", start: "21:00", end: "21:30", kind: "meeting" },
    { id: "ev3", title: "Blood Results Ready", subtitle: "Lab Center, Floor 2", start: "22:00", end: "22:30", kind: "lab" },
    { id: "ev4", title: "Patient Harris", subtitle: "West camp, Room 312", start: "22:30", end: "23:25", kind: "operation", tag: "Post-operation" },
    { id: "ev5", title: "Surgical Preparation", subtitle: "OR Prep, Ward 3B", start: "23:25", end: "00:45", kind: "prep" },
  ],
};

export const patientAnalytics: PatientAnalytics = {
  months: [
    { month: "2026-04", new: 38, returning: 90 },
    { month: "2026-05", new: 41, returning: 100 },
    { month: "2026-06", new: 47, returning: 113 },
    { month: "2026-07", new: 36, returning: 116 },
    { month: "2026-08", new: 52, returning: 121 },
    { month: "2026-09", new: 29, returning: 89 },
  ],
  totals: { seen: 612, new: 243, returning: 369, withMid: 401, averageAge: 43 },
  gender: [
    { label: "Male", count: 318 },
    { label: "Female", count: 287 },
    { label: "Other", count: 7 },
  ],
  ageGroups: [
    { label: "0-12", count: 41 },
    { label: "13-17", count: 22 },
    { label: "18-30", count: 118 },
    { label: "31-45", count: 164 },
    { label: "46-60", count: 158 },
    { label: "60+", count: 109 },
  ],
  weekdays: [
    { day: "Mon", count: 142 },
    { day: "Tue", count: 118 },
    { day: "Wed", count: 121 },
    { day: "Thu", count: 109 },
    { day: "Fri", count: 126 },
    { day: "Sat", count: 151 },
    { day: "Sun", count: 18 },
  ],
  topMedicines: [
    { name: "Metformin", count: 96 },
    { name: "Amlodipine", count: 71 },
    { name: "Paracetamol", count: 64 },
    { name: "Pantoprazole", count: 52 },
    { name: "Atorvastatin", count: 47 },
  ],
};

export const billingAnalytics: BillingAnalytics = {
  months: [
    { month: "2026-04", billed: 96000, collected: 91500 },
    { month: "2026-05", billed: 109000, collected: 104000 },
    { month: "2026-06", billed: 103500, collected: 98500 },
    { month: "2026-07", billed: 118000, collected: 112000 },
    { month: "2026-08", billed: 81000, collected: 76000 },
    { month: "2026-09", billed: 54000, collected: 49500 },
  ],
  totals: { billedThisMonth: 54000, collectedThisMonth: 49500, outstanding: 23500, outstandingBills: 31, averageBill: 640, invoices: 882 },
  byMode: [
    { mode: "UPI", amount: 318000 },
    { mode: "Cash", amount: 171500 },
    { mode: "Card", amount: 42000 },
  ],
  byDoctor: [
    { doctorId: "d1", name: "Dr. Arjun Mehta", invoices: 604, billed: 389000, collected: 372500 },
    { doctorId: "d2", name: "Dr. Kavya Rao", invoices: 278, billed: 172500, collected: 159000 },
  ],
};

/** Patient Summary sub-tab rows, keyed by kind. Field names match SUMMARY_TABS. */
export const summary: Record<SummaryKind, SummaryRow[]> = {
  conditions: [
    { id: "c1", mid: consentedMid, name: "Type 2 Diabetes Mellitus", bodySite: "Endocrine", diagnosedOn: "2021-03-14" },
    { id: "c2", mid: consentedMid, name: "Essential Hypertension", bodySite: "Cardiovascular", diagnosedOn: "2022-08-02" },
  ],
  medications: [
    { id: "m1", mid: consentedMid, name: "Metformin", dose: "500mg", frequency: "BD", startedOn: "2021-03-20" },
    { id: "m2", mid: consentedMid, name: "Amlodipine", dose: "5mg", frequency: "OD", startedOn: "2022-08-10" },
  ],
  allergies: [
    { id: "al1", mid: consentedMid, allergen: "Penicillin", reaction: "Urticaria", severity: "Moderate", notedOn: "2015-06-01" },
  ],
  procedures: [
    { id: "mp1", mid: consentedMid, name: "Appendectomy", hospital: "Apollo Hospitals, Jubilee Hills", date: "2009-11-18" },
  ],
  history: [
    { id: "h1", mid: consentedMid, type: "Family", relation: "Father", details: "Type 2 diabetes, CAD at 58", notedOn: "2021-03-14" },
    { id: "h2", mid: consentedMid, type: "Social", relation: "Tobacco", details: "Never smoker", notedOn: "2021-03-14" },
  ],
};
