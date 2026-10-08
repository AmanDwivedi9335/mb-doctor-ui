/**
 * Doctor-portal view types. These describe the shapes the UI renders and the
 * backend (/api/v1/doctor) returns. Where a shared enum already exists we
 * reuse it from @myanodex/shared so the doctor app and backend stay in lockstep.
 */
import type {
  BloodGroup,
  Gender,
  DiagnosisStatus,
  Severity,
} from "@myanodex/shared/constants";

export type { BloodGroup, Gender, DiagnosisStatus, Severity };

/** Login roles. A front desk is one login per pro doctor account. */
export type Role = "doctor" | "receptionist" | "admin";

export type ReviewStatus = "draft" | "submitted" | "approved" | "rejected";

/** The doctor's plan as the backend reports it. `enforced=false` = every gate open. */
export interface PlanInfo {
  code: string | null;
  name: string | null;
  active: boolean;
  endsAt: string | null;
  isPro: boolean;
  enforced: boolean;
}

/** A clinic this login can switch to. */
export interface ClinicSummary {
  id: string;
  name: string;
  role: "owner" | "member";
  memberCount: number;
}

/** The whole session, as /auth/login and /doctor/me answer. */
export interface Session {
  id: string;
  email: string;
  name: string;
  role: Role;
  username: string | null;
  doctorId: string | null;
  needsOnboarding: boolean;
  /** MB-DR-000123, what a clinic types to invite this doctor. */
  doctorNo: string | null;
  specialization: string | null;
  avatarUrl: string | null;
  reviewStatus: ReviewStatus | null;
  reviewNote: string | null;
  suspendedAt: string | null;
  mobile: string | null;
  /** Set while a "close my account" request is inside its 30-day grace. */
  deletionScheduledFor: string | null;
  plan: PlanInfo | null;
  clinics: ClinicSummary[];
  /** Practice details printed on a personal-scope prescription. Not a clinic. */
  practice: { name: string | null; address: string | null; phone: string | null; email: string | null } | null;
}

export interface DoctorUser {
  preferredName?: string;
  dateOfBirth?: string;
  mobile?: string;
  emergencyMobile?: string;
  registrationNo?: string;
  registrationIds?: string[];
  education?: { qualification: string; college: string; city: string; state: string; country: string }[];
  adminPortalRequested?: boolean;
  id: string;
  name: string;
  email: string;
  role: Role;
  username?: string | null;
  doctorNo?: string | null;
  specialization?: string;
  clinicName?: string;
  avatarUrl?: string | null;
}

/** A patient as the doctor sees them once consent is granted. */
export interface Patient {
  mid: string; // 14-digit MediBank ID
  chartId?: string;
  name: string;
  gender: Gender;
  dateOfBirth: string | null; // ISO date
  bloodGroup?: BloodGroup;
  phone?: string;
  city?: string;
  email?: string;
  address?: string | null;
  allergies: string[];
  consentGranted: boolean;
  accessExpiresAt?: string | null;
}

export interface DiagnosisMedication {
  name: string;
  form?: string; // TAB / CAP / GEL ...
  amount: string;
  unit: string;
  frequency?: string; // Once / Twice / Thrice a day
  times: string[]; // Morning / Afternoon / Evening / Night
  duration: string;
  instructions: string; // meal relation
  special?: string; // SOS / Till required / To continue
}

export interface DiagnosisTest {
  name: string;
  notes?: string;
}

/** Kept as typed ("36.9", "120/80"); the backend parses them. */
export interface DiagnosisVitals {
  temperature?: string;
  heartRate?: string;
  respRate?: string;
  bloodPressure?: string;
  spo2?: string;
  weight?: string;
}

export interface Diagnosis {
  id: string;
  mid: string;
  name: string; // chief complaint
  code?: string; // ICD-10
  status: DiagnosisStatus;
  notes?: string; // clinical notes
  doctorNotes?: string; // doctor-only reference, never shown to the patient
  medications?: DiagnosisMedication[];
  tests?: DiagnosisTest[];
  vitals?: DiagnosisVitals;
  date: string; // ISO date
  followUpDate?: string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" (time optional)
  recordedBy: string;
  doctorId?: string;
  clinicId?: string | null;
}

/** What POST /diagnosis takes: the card minus what the server fills in. */
export type DiagnosisInput = Omit<Diagnosis, "id" | "recordedBy" | "doctorId" | "clinicId"> & {
  /** Also add each medicine to the patient's Medications summary tab. */
  copyMedicationsToSummary?: boolean;
};

export interface Procedure {
  id: string;
  mid: string;
  name: string;
  notes?: string;
  date: string;
  recordedBy: string;
}

export type ReportStatus = "pending" | "verified";

export interface Report {
  id: string;
  mid: string;
  title: string;
  category: "Pathology" | "Imaging" | "Prescription" | "Other";
  date: string;
  status: ReportStatus;
  fileName?: string;
  verifiedBy?: string;
}

export interface Vital {
  id: string;
  mid: string;
  type: "blood_pressure" | "blood_glucose" | "heart_rate" | "spo2" | "weight" | "temperature" | "resp_rate";
  value: number | { systolic: number; diastolic: number };
  unit: string;
  recordDate: string; // ISO date
}

export interface FollowUp {
  id: string;
  mid: string;
  patientName: string;
  reason: string;
  dueOn: string; // ISO date
  status: "upcoming" | "overdue" | "done";
}

export interface Appointment {
  id: string;
  mid?: string;
  patientName: string;
  time: string; // ISO datetime
  reason: string;
  status: "waiting" | "in-progress" | "completed" | "cancelled";
  tokenNumber?: number | null;
  doctorName?: string;
}

/** What POST /appointments takes (owner or front desk, in a clinic). */
export interface AppointmentInput {
  doctorId?: string;
  mid?: string;
  chartId?: string;
  patient?: { name: string; age?: string; gender?: Gender; phone?: string };
  date: string;
  reason?: string;
  payment?: { amount: number; mode: "UPI" | "Cash"; paid: boolean };
}

/** GET /appointments/lookup: the newest chart this clinic has already seen for a phone or MID. */
export interface AppointmentLookup {
  chartId: string;
  doctorId: string;
  name: string;
  phone: string;
  gender: Gender | null;
  mid: string | null;
}

/** A patient seen without a MediBank ID. Nothing is stored against a MID;
 *  the visit exists only so the doctor can hand over a printed prescription. */
export interface WalkInPatient {
  name: string;
  age: string; // worked out from dob by the server
  dob?: string;
  gender: Gender;
  phone?: string;
}

export interface WalkIn {
  id: string;
  patient: WalkInPatient;
  diagnosis: Omit<Diagnosis, "id" | "mid" | "recordedBy">;
  recordedBy: string;
  createdAt: string; // ISO datetime
}

/** One row of the clinic's consultation history: a MID patient's diagnosis or
 *  a walk-in, flattened to what the list shows. The server does the join. */
export interface ConsultationEntry {
  id: string;
  date: string; // ISO date
  patientName: string;
  patientMeta: string; // "42 / Female"
  phone?: string;
  mid?: string; // set for MID patients
  walkIn?: WalkIn; // set for walk-ins, so the Rx can be reprinted
  complaint: string;
  medications: string[]; // drug names
  recordedBy: string;
}

/** Standard error body shape from the backend. */
export interface ApiErrorBody {
  message?: string;
  code?: string;
  /** On a 403 from a patient route: none | pending | expired | rejected. */
  state?: "none" | "pending" | "approved" | "expired" | "rejected";
  field?: string;
  missing?: string[];
}

// --- Clinic management ---

export interface ClinicOperatingDay {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  opens: string;
  closes: string;
  closed: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string;
  receptionMobile?: string;
  upiId?: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  operatingHours?: ClinicOperatingDay[];
  logoUrl?: string | null;
  qrUrl?: string | null;
}

export interface Qualification {
  id: string;
  degree: string;
  institution: string;
  year: number;
}

export interface ClinicDoctor {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  doctorNo?: string | null;
  specialization: string;
  phone?: string;
  registrationNo?: string;
  qualifications: Qualification[];
  role?: "owner" | "member";
  status?: "pending" | "accepted";
  active: boolean;
}

/** A clinic asking this doctor to join. */
export interface Invite {
  clinicId: string;
  clinicName: string;
  ownerName: string;
  invitedAt: string;
}

export type StaffRole = "receptionist" | "nurse" | "manager" | "pharmacist";

/** The front desk login (one per pro doctor account). */
export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  username?: string | null;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface FrontDesk {
  id: string;
  username: string | null;
  name: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface Plan {
  code: string;
  name: string;
  priceMonthly: number;
  seats: number;
  pro?: boolean;
  features: string[];
}

export interface Subscription {
  plan: string | null;
  planName: string | null;
  status: "active" | "expired" | "none" | "trial";
  startedAt: string | null;
  renewsAt: string | null;
  seats: number;
  isPro?: boolean;
  enforced?: boolean;
  suspendedAt?: string | null;
}

export interface SubscriptionEvent {
  id: string;
  date: string;
  description: string;
  amount?: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

// --- Billing ---

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  patientName: string;
  mid?: string;
  date: string;
  items: InvoiceItem[];
  total: number;
  paid: number;
  status: "paid" | "partial" | "unpaid";
  mode?: "Cash" | "Card" | "UPI" | "Insurance";
}

// --- Support ---

export interface SupportMessage {
  id: string;
  from: "doctor" | "support";
  text: string;
  at: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  createdAt: string;
  unread: boolean;
  messages: SupportMessage[];
}

// --- Global ---

export type NotificationKind = "invite" | "report" | "appointment" | "consent" | "system";

export interface Notification {
  id: string;
  title: string;
  body: string;
  href?: string;
  at: string;
  read: boolean;
  kind: NotificationKind;
}

/** GET /dashboard/analytics/patients: last six months ("YYYY-MM"), zeros included. */
export interface PatientAnalytics {
  months: { month: string; new: number; returning: number }[];
  totals: { seen: number; new: number; returning: number; withMid: number; averageAge: number | null };
  gender: { label: string; count: number }[];
  ageGroups: { label: string; count: number }[];
  weekdays: { day: string; count: number }[];
  topMedicines: { name: string; count: number }[];
}

/** GET /dashboard/analytics/billing: rupees, last six months. Outstanding is all time. */
export interface BillingAnalytics {
  months: { month: string; billed: number; collected: number }[];
  totals: { billedThisMonth: number; collectedThisMonth: number; outstanding: number; outstandingBills: number; averageBill: number; invoices: number };
  byMode: { mode: string; amount: number }[];
  byDoctor: { doctorId: string; name: string; invoices: number; billed: number; collected: number }[];
}

// --- Dashboard overview (the reference home screen) ---

export interface StatCard {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: "up" | "down";
  hint?: string;
}
export interface DiagnosisShare {
  label: string;
  pct: number;
}
export interface HourPoint {
  time: string;
  male: number;
  female: number;
}
export interface LastVisit {
  patientName: string;
  code: string;
  sex: string;
  age: number;
  tags: string[];
  lastChecked: string;
  observation: string;
  diagnosis: string;
  prescription: string[];
  notes: string;
}
export type ScheduleKind = "patient" | "meeting" | "lab" | "operation" | "prep";
export interface ScheduleEvent {
  id: string;
  title: string;
  subtitle: string;
  start: string; // "20:00"
  end: string; // "20:45"
  kind: ScheduleKind;
  tag?: string;
}
export interface DashboardOverview {
  cards: StatCard[];
  diagnoses: DiagnosisShare[];
  patientsByHour: HourPoint[];
  lastVisit: LastVisit | null;
  schedule: ScheduleEvent[];
}

// --- Patient Summary sub-tabs ---

/** Active Conditions, Medications, Allergies, Major Procedures, Family / Social HX. */
export type SummaryKind = "conditions" | "medications" | "allergies" | "procedures" | "history";

/** One row of a summary sub-tab. Field names come from SUMMARY_TABS in lib/summary. */
export interface SummaryRow {
  id: string;
  mid: string;
  [field: string]: string;
}
