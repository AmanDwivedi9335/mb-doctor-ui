import { z } from 'zod';
import { USER_ROLE_OPTIONS } from '../constants/index.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  specialization: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(USER_ROLE_OPTIONS),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
