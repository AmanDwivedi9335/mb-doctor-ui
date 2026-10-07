import { z } from 'zod';
import {
  PAYMENT_MODE_OPTIONS,
  BILL_STATUS_OPTIONS,
} from '../constants/index.js';

export const billItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number(),
  quantity: z.number().int().min(1),
});
export type BillItemInput = z.infer<typeof billItemSchema>;

export const createBillSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  date: z.string(),
  items: z.array(billItemSchema).min(1),
  totalAmount: z.number(),
  paidAmount: z.number(),
  paymentMode: z.enum(PAYMENT_MODE_OPTIONS),
  status: z.enum(BILL_STATUS_OPTIONS),
  receiptNumber: z.string().optional(),
});
export type CreateBillInput = z.infer<typeof createBillSchema>;

export const billSchema = createBillSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type Bill = z.infer<typeof billSchema>;
