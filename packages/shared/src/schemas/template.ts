import { z } from 'zod';
import { symptomSchema, diagnosisSchema, medicineSchema } from './prescription.js';

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  symptoms: z.array(symptomSchema),
  diagnoses: z.array(diagnosisSchema),
  medicines: z.array(medicineSchema),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const templateSchema = createTemplateSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type Template = z.infer<typeof templateSchema>;
