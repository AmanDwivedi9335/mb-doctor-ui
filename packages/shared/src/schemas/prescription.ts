import { z } from 'zod';
import {
  SEVERITY_OPTIONS,
  DIAGNOSIS_STATUS_OPTIONS,
  MEDICINE_TYPE_OPTIONS,
  TIMING_OPTIONS,
  MEAL_OPTIONS,
  DURATION_UNIT_OPTIONS,
} from '../constants/index.js';

export const symptomSchema = z.object({
  name: z.string().min(1),
  duration: z.string().optional(),
  severity: z.enum(SEVERITY_OPTIONS).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
export type SymptomInput = z.infer<typeof symptomSchema>;

export const diagnosisSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  note: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(DIAGNOSIS_STATUS_OPTIONS).optional(),
});
export type DiagnosisInput = z.infer<typeof diagnosisSchema>;

export const medicineSchema = z.object({
  name: z.string().min(1),
  type: z.enum(MEDICINE_TYPE_OPTIONS).optional(),
  dose: z.string().optional(),
  timing: z.enum(TIMING_OPTIONS).optional(),
  meal: z.enum(MEAL_OPTIONS).optional(),
  duration: z.string().optional(),
  durationUnit: z.enum(DURATION_UNIT_OPTIONS).optional(),
  schedule: z.object({
    morning: z.boolean(),
    afternoon: z.boolean(),
    evening: z.boolean(),
    night: z.boolean(),
  }).optional(),
  note: z.string().optional(),
  sos: z.boolean().optional(),
});
export type MedicineInput = z.infer<typeof medicineSchema>;

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  date: z.string(),
  symptoms: z.array(symptomSchema),
  diagnoses: z.array(diagnosisSchema),
  medicines: z.array(medicineSchema),
  prescriptionNotes: z.string().optional(),
  privateNotes: z.string().optional(),
  followUpDate: z.string().optional(),
  referTo: z.string().optional(),
});
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const prescriptionSchema = createPrescriptionSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type Prescription = z.infer<typeof prescriptionSchema>;
