import { z } from 'zod';

export const createProcedureSchema = z.object({
  procedureName: z.string().min(1),
  dateTime: z.string(),
  duration: z.string().optional(),
  anesthesia: z.string().optional(),
  preVitals: z.object({
    pulse: z.number().optional(),
    systolic: z.number().optional(),
    diastolic: z.number().optional(),
    spO2: z.number().optional(),
    temperature: z.number().optional(),
  }).optional(),
  procedureNotes: z.string().optional(),
  findings: z.string().optional(),
  complications: z.string().optional(),
  complicationNotes: z.string().optional(),
  postInstructions: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().optional(),
  outcome: z.string().optional(),
  consentObtained: z.boolean().optional(),
  consentType: z.string().optional(),
  witnessName: z.string().optional(),
  addToBill: z.boolean().optional(),
  procedureFee: z.number().optional(),
});
export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;

export const procedureSchema = createProcedureSchema.extend({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  createdAt: z.string(),
});
export type Procedure = z.infer<typeof procedureSchema>;
