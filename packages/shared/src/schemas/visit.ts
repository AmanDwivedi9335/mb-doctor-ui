import { z } from 'zod';
import { VISIT_STATUS_OPTIONS } from '../constants/index.js';

export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string(),
  reason: z.string().optional(),
  status: z.enum(VISIT_STATUS_OPTIONS).default("waiting"),
});
export type CreateVisitInput = z.infer<typeof createVisitSchema>;

export const updateVisitSchema = z.object({
  status: z.enum(VISIT_STATUS_OPTIONS).optional(),
  prescriptionId: z.string().optional(),
  vitalsId: z.string().optional(),
});
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;

export const visitSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  date: z.string(),
  reason: z.string().optional(),
  status: z.enum(VISIT_STATUS_OPTIONS),
  prescriptionId: z.string().optional(),
  vitalsId: z.string().optional(),
  tokenNumber: z.number().int().optional(),
  createdAt: z.string(),
});
export type Visit = z.infer<typeof visitSchema>;

export const visitQuerySchema = z.object({
  date: z.string().optional(),
  status: z.enum(VISIT_STATUS_OPTIONS).optional(),
  patientId: z.string().uuid().optional(),
});
export type VisitQuery = z.infer<typeof visitQuerySchema>;
