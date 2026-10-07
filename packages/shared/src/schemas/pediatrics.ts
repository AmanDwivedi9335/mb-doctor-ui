import { z } from 'zod';

export const pediatricsSchema = z.object({
  birthHistory: z.object({
    gestationalAge: z.number().optional(),
    birthWeight: z.number().optional(),
    birthLength: z.number().optional(),
    headCircumference: z.number().optional(),
    deliveryType: z.string().optional(),
    complications: z.string().optional(),
    apgarScore: z.string().optional(),
    neonatalIssues: z.string().optional(),
  }).optional(),
  assessments: z.object({
    motorSkills: z.string().optional(),
    language: z.string().optional(),
    social: z.string().optional(),
    cognitive: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  mchat: z.object({
    score: z.number().optional(),
    date: z.string().optional(),
    result: z.string().optional(),
    responses: z.record(z.boolean()).optional(),
  }).optional(),
});
export type PediatricsInput = z.infer<typeof pediatricsSchema>;
