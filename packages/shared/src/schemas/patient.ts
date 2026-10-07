import { z } from 'zod';
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  PATIENT_FLAG_OPTIONS,
} from '../constants/index.js';

export const createPatientSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  ageYears: z.number().int().min(0).optional(),
  ageMonths: z.number().int().min(0).max(11).optional(),
  gender: z.enum(GENDER_OPTIONS),
  mobile: z.string().min(1),
  email: z.string().email().optional(),
  maritalStatus: z.enum(MARITAL_STATUS_OPTIONS).optional(),
  bloodGroup: z.enum(BLOOD_GROUP_OPTIONS).optional(),
  officeId: z.string().optional(),
  referredBy: z.string().optional(),
  flag: z.enum(PATIENT_FLAG_OPTIONS).optional(),
  group: z.string().optional(),
  profession: z.string().optional(),
  notes: z.string().optional(),
  // Contact
  secondaryNumber: z.string().optional(),
  contactType: z.enum(["Spouse", "Parent", "Other"] as const).optional(),
  contactName: z.string().optional(),
  // Address
  flatHouse: z.string().optional(),
  streetSociety: z.string().optional(),
  localityArea: z.string().optional(),
  pincode: z.string().optional(),
  city: z.string().optional(),
  // Avatar
  avatarUrl: z.string().optional(),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const patientSchema = createPatientSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Patient = z.infer<typeof patientSchema>;

export const patientQuerySchema = z.object({
  search: z.string().optional(),
  flag: z.enum(PATIENT_FLAG_OPTIONS).optional(),
  sort: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});
export type PatientQuery = z.infer<typeof patientQuerySchema>;
