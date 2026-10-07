import { z } from 'zod';
import { VACCINATION_STATUS_OPTIONS } from '../constants/index.js';

export const createVaccinationSchema = z.object({
  vaccineName: z.string().min(1),
  doseLabel: z.string().optional(),
  dateGiven: z.string(),
  batchNumber: z.string().optional(),
  site: z.string().optional(),
  route: z.string().optional(),
  administeredBy: z.string().optional(),
  nextDoseDate: z.string().optional(),
  adverseReaction: z.boolean().optional(),
  adverseNotes: z.string().optional(),
  status: z.enum(VACCINATION_STATUS_OPTIONS),
});
export type CreateVaccinationInput = z.infer<typeof createVaccinationSchema>;

export const updateVaccinationSchema = createVaccinationSchema.partial();
export type UpdateVaccinationInput = z.infer<typeof updateVaccinationSchema>;

export const vaccinationSchema = createVaccinationSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type Vaccination = z.infer<typeof vaccinationSchema>;
