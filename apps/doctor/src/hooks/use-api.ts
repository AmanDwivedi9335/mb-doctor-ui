import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, authApi } from "@/lib/api";
import { ApiError } from "@myanodex/shared/api-client";
import type {
  Patient,
  Diagnosis,
  DiagnosisInput,
  Procedure,
  Report,
  Vital,
  FollowUp,
  Appointment,
  AppointmentInput,
  AppointmentLookup,
  WalkIn,
  ConsultationEntry,
  Clinic,
  ClinicSummary,
  ClinicDoctor,
  Invite,
  FrontDesk,
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
  DoctorUser,
  SummaryKind,
  SummaryRow,
  ApiErrorBody,
} from "@/types";

/**
 * React-query hooks. Keys are namespaced under 'doctor'. Each queryFn calls the
 * api client exactly as production does; the X-Clinic-Id header is added by
 * the client, and switching clinic clears the cache (DoctorAuthContext).
 * List endpoints that key on a patient take a `mid` and stay disabled until one
 * is present, so selecting a patient drives the fetch.
 */

export interface FeatureFlags {
  version: string;
  flags: Record<string, boolean>;
}

const errorState = (e: unknown) => (e instanceof ApiError ? (e.data as ApiErrorBody | undefined)?.state : undefined);

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["doctor", "feature-flags"],
    queryFn: () => api.get<FeatureFlags>("/config/feature-flags"),
    staleTime: 60 * 60 * 1000,
  });
}

interface DashboardStats {
  todayAppointments: number;
  pendingReports: number;
  followupsDue: number;
  patientsSeenToday: number;
}
export function useDashboard() {
  return useQuery({
    queryKey: ["doctor", "dashboard"],
    queryFn: () => api.get<DashboardStats>("/dashboard/stats"),
  });
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["doctor", "dashboard", "overview"],
    queryFn: () => api.get<DashboardOverview>("/dashboard/overview"),
  });
}

/**
 * The patient behind a MID. A 403 with state 'pending' means the patient has
 * been asked and has not answered yet: keep polling every 5s so the workspace
 * opens by itself the moment they tap Approve.
 */
export function usePatient(mid: string | null) {
  return useQuery({
    queryKey: ["doctor", "patient", mid],
    queryFn: () => api.get<{ patient: Patient }>(`/patients?mid=${encodeURIComponent(mid!)}`),
    enabled: !!mid,
    // Retrying keeps the query "pending" (skeleton forever); an errored query
    // that refetches surfaces the "Waiting for the patient" screen instead.
    retry: false,
    refetchInterval: (query) => (errorState(query.state.error) === "pending" ? 5000 : false),
  });
}

export function useDiagnoses(mid: string | null) {
  return useQuery({
    queryKey: ["doctor", "diagnoses", mid],
    queryFn: () => api.get<{ diagnoses: Diagnosis[] }>(`/diagnosis?mid=${encodeURIComponent(mid!)}`),
    enabled: !!mid,
    retry: false,
  });
}

export function useCreateDiagnosis(mid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DiagnosisInput) => api.post<Diagnosis>("/diagnosis", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "diagnoses", mid] });
      qc.invalidateQueries({ queryKey: ["doctor", "vitals", mid] });
      qc.invalidateQueries({ queryKey: ["doctor", "summary", "medications", mid] });
      qc.invalidateQueries({ queryKey: ["doctor", "history"] });
    },
  });
}

export function useCreateProcedure(mid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Procedure, "id" | "recordedBy">) => api.post<Procedure>("/procedures", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "procedures", mid] }),
  });
}

/** Multipart: `mid`, `title`, `category`, `date` fields plus the `file`. */
export function useCreateReport(mid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => api.upload<Report>("/reports", form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "reports", mid] }),
  });
}

export function useVerifyReport(mid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => api.put<Report>(`/reports/${reportId}/verify`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "reports", mid] }),
  });
}

export function useCreateVital(mid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Vital, "id">) => api.post<Vital>("/health-data", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "vitals", mid] }),
  });
}

export function useCreateFollowUp(mid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { mid: string; reason?: string; dueOn: string; patientName?: string; status?: string }) => api.post<FollowUp>("/followups", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "followups"] }),
  });
}

export function useRequestConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mid: string) => api.post<{ requested: boolean; state: "pending" | "approved"; message: string }>("/patients/consent-request", { mid }),
    onSuccess: (_d, mid) => qc.invalidateQueries({ queryKey: ["doctor", "patient", mid] }),
  });
}

export function useProcedures(mid: string | null) {
  return useQuery({
    queryKey: ["doctor", "procedures", mid],
    queryFn: () => api.get<{ procedures: Procedure[] }>(`/procedures?mid=${encodeURIComponent(mid!)}`),
    enabled: !!mid,
    retry: false,
  });
}

export function useReports(mid: string | null) {
  return useQuery({
    queryKey: ["doctor", "reports", mid],
    queryFn: () => api.get<{ reports: Report[] }>(`/reports?mid=${encodeURIComponent(mid!)}`),
    enabled: !!mid,
    retry: false,
  });
}

export function useVitals(mid: string | null) {
  return useQuery({
    queryKey: ["doctor", "vitals", mid],
    queryFn: () => api.get<{ vitals: Vital[] }>(`/health-data?mid=${encodeURIComponent(mid!)}`),
    enabled: !!mid,
    retry: false,
  });
}

export function useFollowUps(mid: string | null) {
  return useQuery({
    queryKey: ["doctor", "followups", mid],
    queryFn: () => api.get<{ followups: FollowUp[] }>(`/followups?mid=${encodeURIComponent(mid!)}`),
    enabled: !!mid,
    retry: false,
  });
}

/** Every follow-up the doctor has scheduled, across patients (current scope). */
export function useAllFollowUps() {
  return useQuery({
    queryKey: ["doctor", "followups", "all"],
    queryFn: () => api.get<{ followups: FollowUp[] }>("/followups"),
  });
}

export function useHistory() {
  return useQuery({ queryKey: ["doctor", "history"], queryFn: () => api.get<{ entries: ConsultationEntry[] }>("/history") });
}

export function useCreateWalkIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { patient: Pick<WalkIn["patient"], "name" | "gender"> & { dob: string; phone: string }; diagnosis: Omit<DiagnosisInput, "mid"> }) => api.post<WalkIn>("/walk-ins", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "history"] }),
  });
}

export function useAppointments(date?: string) {
  return useQuery({
    queryKey: ["doctor", "appointments", date ?? "today"],
    queryFn: () => api.get<{ appointments: Appointment[] }>(`/appointments${date ? `?date=${date}` : ""}`),
  });
}

/** Booking autofill. `q` is a valid phone or MID, or null to stay idle. */
export function useAppointmentLookup(q: string | null) {
  return useQuery({
    queryKey: ["doctor", "appointments", "lookup", q],
    queryFn: () => api.get<{ patient: AppointmentLookup | null }>(`/appointments/lookup?q=${encodeURIComponent(q!)}`),
    enabled: !!q,
    staleTime: 60_000,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AppointmentInput) => api.post<Appointment>("/appointments", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      qc.invalidateQueries({ queryKey: ["doctor", "dashboard"] });
    },
  });
}

// ------------------------------------------------------------- account & security
export interface SecurityQuestionsState {
  questions: { id: number; text: string }[];
  answered: number[];
  minimum: number;
}
export function useSecurityQuestions(enabled = true) {
  return useQuery({ queryKey: ["doctor", "security-questions"], queryFn: () => authApi.get<SecurityQuestionsState>("/auth/me/security-questions"), enabled, retry: false });
}
/** Answers are write-only: the reply says which are answered, never what. */
export function useSaveSecurityAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { currentPassword: string; answers: { id: number; answer: string }[] }) =>
      authApi.put<{ answered: number[]; minimum: number }>("/auth/me/security-answers", body),
    onSuccess: (r) => qc.setQueryData<SecurityQuestionsState>(["doctor", "security-questions"], (old) => (old ? { ...old, answered: r.answered } : old)),
  });
}

/** Done, or back to waiting after a mis-tap. The server decides who may. */
export function useSetAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "completed" | "waiting" }) => api.patch<{ id: string; status: Appointment["status"] }>(`/appointments/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      qc.invalidateQueries({ queryKey: ["doctor", "dashboard"] });
    },
  });
}

// ------------------------------------------------------------- clinics
export function useClinics() {
  return useQuery({ queryKey: ["doctor", "clinics"], queryFn: () => api.get<{ clinics: ClinicSummary[] }>("/clinics") });
}
export function useCreateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Clinic> & { name: string }) => api.post<Clinic>("/clinics", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "clinics"] }),
  });
}
export function useInvites() {
  return useQuery({ queryKey: ["doctor", "invites"], queryFn: () => api.get<{ invites: Invite[] }>("/me/invites"), refetchInterval: 60_000 });
}
export function useRespondInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clinicId, decision }: { clinicId: string; decision: "accept" | "decline" }) =>
      api.post<{ clinicId: string; status: string }>(`/me/invites/${clinicId}/${decision}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "invites"] });
      qc.invalidateQueries({ queryKey: ["doctor", "clinics"] });
      qc.invalidateQueries({ queryKey: ["doctor", "notifications"] });
    },
  });
}
export function useInviteDoctor(clinicId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string) => api.post<{ clinicId: string; doctorId: string; status: string }>(`/clinics/${clinicId}/invites`, { identifier }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "clinic", "doctors"] }),
  });
}

// ------------------------------------------------------------- clinic: profile
export function useClinicProfile(enabled = true) {
  return useQuery({ queryKey: ["doctor", "clinic", "profile"], queryFn: () => api.get<Clinic>("/clinic/profile"), enabled, retry: false });
}
export function useUpdateClinicProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Clinic>) => api.put<Clinic>("/clinic/profile", body),
    onSuccess: (data) => {
      qc.setQueryData(["doctor", "clinic", "profile"], data);
      qc.invalidateQueries({ queryKey: ["doctor", "clinics"] });
    },
  });
}
export function useUploadClinicImage(kind: "logo" | "qr-code") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => api.upload<{ logoUrl?: string; qrUrl?: string }>(`/clinic/profile/${kind}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "clinic", "profile"] });
      qc.invalidateQueries({ queryKey: ["doctor", "clinic", "qr"] });
    },
  });
}

/**
 * The clinic's payment QR as an object URL. The image route needs the bearer
 * token, so a plain <img src> cannot load it. Pass `enabled` = profile.qrUrl
 * so a clinic without one does not 404.
 */
export function useClinicQr(clinicId: string | null, enabled: boolean) {
  const { data: blob } = useQuery({
    queryKey: ["doctor", "clinic", "qr", clinicId],
    queryFn: () => apiBlob(`/clinics/${clinicId}/qr`),
    enabled: enabled && !!clinicId,
    retry: false,
  });
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return setSrc(null);
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return src;
}

// ------------------------------------------------------------- clinic: doctors
export function useClinicDoctors(enabled = true) {
  return useQuery({ queryKey: ["doctor", "clinic", "doctors"], queryFn: () => api.get<{ doctors: ClinicDoctor[] }>("/clinic/doctors"), enabled, retry: false });
}
export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/clinic/doctors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "clinic", "doctors"] }),
  });
}

// --------------------------------------------------------------- front desk
export function useStaff() {
  return useQuery({ queryKey: ["doctor", "clinic", "staff"], queryFn: () => api.get<{ staff: Staff[] }>("/clinic/staff"), retry: false });
}
export function useFrontDesk() {
  return useQuery({ queryKey: ["doctor", "front-desk"], queryFn: () => api.get<{ frontDesk: FrontDesk | null }>("/front-desk") });
}
export function useUpsertFrontDesk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string; password: string; name: string }) => api.post<Staff>("/front-desk", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "front-desk"] });
      qc.invalidateQueries({ queryKey: ["doctor", "clinic", "staff"] });
    },
  });
}
export function useDeleteFrontDesk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>("/front-desk"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "front-desk"] });
      qc.invalidateQueries({ queryKey: ["doctor", "clinic", "staff"] });
    },
  });
}

// ---------------------------------------------------- billing: plans / checkout
export function useSubscription() {
  return useQuery({ queryKey: ["doctor", "billing", "me"], queryFn: () => api.get<Subscription>("/billing/me") });
}
export function useSubscriptionHistory() {
  return useQuery({ queryKey: ["doctor", "billing", "history"], queryFn: () => api.get<{ history: SubscriptionEvent[] }>("/billing/history") });
}
export function usePlans() {
  return useQuery({ queryKey: ["doctor", "billing", "plans"], queryFn: () => api.get<{ plans: Plan[] }>("/billing/plans") });
}
/** Starts a purchase; the caller sends the browser to `paymentUrl`. */
export function useCheckout() {
  return useMutation({
    mutationFn: (plan: string) => api.post<{ paymentUrl: string; merchantTxnNo: string }>("/billing/checkout", { plan }),
  });
}
export interface OrderStatus {
  status: "success" | "failed" | "pending";
  entitlement: { active: boolean; planCode: string | null; isPro: boolean; endsAt: string | null };
}
/** The result screen: polls until the gateway has answered. */
export function useOrderStatus(ref: string | null) {
  return useQuery({
    queryKey: ["doctor", "billing", "order", ref],
    queryFn: () => api.get<OrderStatus>(`/billing/orders/${encodeURIComponent(ref!)}`),
    enabled: !!ref,
    refetchInterval: (q) => (q.state.data?.status === "pending" || !q.state.data ? 3000 : false),
    retry: false,
  });
}
export function useFaqs() {
  return useQuery({ queryKey: ["doctor", "clinic", "faqs"], queryFn: () => api.get<{ faqs: Faq[] }>("/clinic/faqs") });
}

// ------------------------------------------------------------------- billing
export function useInvoices() {
  return useQuery({ queryKey: ["doctor", "billing", "invoices"], queryFn: () => api.get<{ invoices: Invoice[] }>("/clinic/billing"), retry: false });
}
export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { patientName?: string; mid?: string; doctorId?: string; date: string; items: { description: string; amount: number; quantity?: number }[]; paid: number; mode?: Invoice["mode"]; total?: number; status?: Invoice["status"] }) =>
      api.post<Invoice>("/clinic/billing", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "billing", "invoices"] });
      qc.invalidateQueries({ queryKey: ["doctor", "dashboard"] });
    },
  });
}

// ------------------------------------------------------------------- support
export function useTickets() {
  return useQuery({ queryKey: ["doctor", "support"], queryFn: () => api.get<{ tickets: SupportTicket[] }>("/support/messages") });
}
export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { subject: string; text: string }) => api.post<SupportTicket>("/support/message", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "support"] }),
  });
}
export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => api.post<SupportTicket>(`/support/messages/${id}/reply`, { text }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "support"] }),
  });
}
export function useMarkTicketRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<void>(`/support/messages/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "support"] }),
  });
}

// --------------------------------------------------------------- notifications
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["doctor", "notifications"],
    queryFn: () => api.get<{ notifications: Notification[]; unreadCount: number }>("/notifications"),
    refetchInterval: 30_000,
    enabled,
  });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<void>(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "notifications"] }),
  });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor", "notifications"] }),
  });
}

// -------------------------------------------------------------------- profile
export function useProfile() {
  return useQuery({ queryKey: ["doctor", "profile"], queryFn: () => api.get<DoctorUser>("/profile") });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<DoctorUser>) => api.put<DoctorUser>("/profile", body),
    onSuccess: (data) => qc.setQueryData(["doctor", "profile"], data),
  });
}

// -------------------------------------------------------------------- analytics
/** Clinic analytics: every doctor added up, or one with `doctorId` (owner / desk only). */
const analyticsQuery = <T,>(page: "patients" | "billing", doctorId?: string) => ({
  queryKey: ["doctor", "analytics", page, doctorId ?? "all"],
  queryFn: () => api.get<T>(`/dashboard/analytics/${page}${doctorId ? `?doctorId=${doctorId}` : ""}`),
  retry: false,
});
export const usePatientAnalytics = (doctorId?: string) => useQuery(analyticsQuery<PatientAnalytics>("patients", doctorId));
export const useBillingAnalytics = (doctorId?: string) => useQuery(analyticsQuery<BillingAnalytics>("billing", doctorId));

// --- Patient Summary sub-tabs ---

export function useSummary(kind: SummaryKind, mid: string | null) {
  return useQuery({
    queryKey: ["doctor", "summary", kind, mid],
    queryFn: () => api.get<{ rows: SummaryRow[] }>(`/summary/${kind}?mid=${encodeURIComponent(mid!)}`),
    enabled: !!mid,
    retry: false,
  });
}

export function useCreateSummaryRow(kind: SummaryKind, mid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<SummaryRow, "id">) => api.post<SummaryRow>(`/summary/${kind}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "summary", kind, mid] });
      if (kind === "allergies") qc.invalidateQueries({ queryKey: ["doctor", "patient", mid] });
    },
  });
}
