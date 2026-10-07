import { z } from 'zod';
import { CERTIFICATE_TYPE_OPTIONS } from '../constants/index.js';

export const createCertificateSchema = z.object({
  type: z.enum(CERTIFICATE_TYPE_OPTIONS),
  data: z.record(z.unknown()),
});
export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;

export const certificateSchema = createCertificateSchema.extend({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  createdAt: z.string(),
});
export type Certificate = z.infer<typeof certificateSchema>;
