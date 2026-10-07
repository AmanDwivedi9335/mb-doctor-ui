import { z } from 'zod';
import {
  INVESTIGATION_CATEGORY_OPTIONS,
  INVESTIGATION_STATUS_OPTIONS,
} from '../constants/index.js';

export const createInvestigationSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string(),
  testName: z.string().min(1),
  category: z.enum(INVESTIGATION_CATEGORY_OPTIONS),
  value: z.string().optional(),
  unit: z.string().optional(),
  normalRange: z.string().optional(),
  status: z.enum(INVESTIGATION_STATUS_OPTIONS).default("ordered"),
});
export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;

export const updateInvestigationSchema = z.object({
  value: z.string().optional(),
  status: z.enum(INVESTIGATION_STATUS_OPTIONS).optional(),
  unit: z.string().optional(),
  normalRange: z.string().optional(),
});
export type UpdateInvestigationInput = z.infer<typeof updateInvestigationSchema>;

export const investigationSchema = createInvestigationSchema.extend({
  id: z.string().uuid(),
});
export type Investigation = z.infer<typeof investigationSchema>;
