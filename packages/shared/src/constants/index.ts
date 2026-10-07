// Myanodex EMR — Shared Constants & Enums

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

export const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed"] as const;
export type MaritalStatus = (typeof MARITAL_STATUS_OPTIONS)[number];

export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export type BloodGroup = (typeof BLOOD_GROUP_OPTIONS)[number];

export const PATIENT_FLAG_OPTIONS = ["red", "yellow", "green", "none"] as const;
export type PatientFlag = (typeof PATIENT_FLAG_OPTIONS)[number];

export const VISIT_STATUS_OPTIONS = ["waiting", "in-progress", "completed", "cancelled"] as const;
export type VisitStatus = (typeof VISIT_STATUS_OPTIONS)[number];

export const MEDICINE_TYPE_OPTIONS = ["TAB", "CAP", "GEL", "ORA", "INJ", "SYR", "DRP", "CRM", "OIN"] as const;
export type MedicineType = (typeof MEDICINE_TYPE_OPTIONS)[number];

export const TIMING_OPTIONS = ["Once", "Twice", "Thrice", "4h", "6h", "8h", "12h", "48h"] as const;
export type Timing = (typeof TIMING_OPTIONS)[number];

export const MEAL_OPTIONS = ["Before Food", "After Food", "With Food", "Empty Stomach", "Bedtime"] as const;
export type Meal = (typeof MEAL_OPTIONS)[number];

export const DURATION_UNIT_OPTIONS = ["days", "weeks", "months", "years"] as const;
export type DurationUnit = (typeof DURATION_UNIT_OPTIONS)[number];

export const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const;
export type Severity = (typeof SEVERITY_OPTIONS)[number];

export const DIAGNOSIS_STATUS_OPTIONS = ["Confirmed", "To Rule Out", "Suspected", "Follow Up"] as const;
export type DiagnosisStatus = (typeof DIAGNOSIS_STATUS_OPTIONS)[number];

export const INVESTIGATION_CATEGORY_OPTIONS = ["Pathology", "Imaging"] as const;
export type InvestigationCategory = (typeof INVESTIGATION_CATEGORY_OPTIONS)[number];

export const INVESTIGATION_STATUS_OPTIONS = ["ordered", "completed", "pending"] as const;
export type InvestigationStatus = (typeof INVESTIGATION_STATUS_OPTIONS)[number];

export const PAYMENT_MODE_OPTIONS = ["Cash", "Card", "UPI", "Insurance"] as const;
export type PaymentMode = (typeof PAYMENT_MODE_OPTIONS)[number];

export const BILL_STATUS_OPTIONS = ["paid", "partial", "unpaid"] as const;
export type BillStatus = (typeof BILL_STATUS_OPTIONS)[number];

export const CERTIFICATE_TYPE_OPTIONS = ["medical", "fitness", "sick-leave", "disability", "vaccination", "custom"] as const;
export type CertificateType = (typeof CERTIFICATE_TYPE_OPTIONS)[number];

export const VACCINATION_STATUS_OPTIONS = ["given", "due", "overdue"] as const;
export type VaccinationStatus = (typeof VACCINATION_STATUS_OPTIONS)[number];

export const USER_ROLE_OPTIONS = ["doctor", "admin", "receptionist"] as const;
export type UserRole = (typeof USER_ROLE_OPTIONS)[number];
