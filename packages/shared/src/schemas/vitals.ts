import { z } from 'zod';

export const createVitalsSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string(),
  pulse: z.number().optional(),
  systolic: z.number().optional(),
  diastolic: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bmi: z.number().optional(),
  temperature: z.number().optional(),
  spO2: z.number().optional(),
  respiratoryRate: z.number().optional(),
});
export type CreateVitalsInput = z.infer<typeof createVitalsSchema>;

export const vitalsSchema = createVitalsSchema.extend({
  id: z.string().uuid(),
});
export type Vitals = z.infer<typeof vitalsSchema>;
