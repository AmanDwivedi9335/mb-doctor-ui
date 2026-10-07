import { z } from 'zod';

export const settingsSchema = z.object({
  data: z.record(z.unknown()),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const updateSettingsSchema = z.object({
  data: z.record(z.unknown()),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
