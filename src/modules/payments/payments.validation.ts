import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
const uuid = z.string().uuid('Invalid ID format');
export const initiatePaymentSchema = z.object({ params: z.object({ orderId: uuid }), body: z.object({ method: z.enum(PaymentMethod).default(PaymentMethod.CARD) }) });
export const verifyPaymentSchema = z.object({ params: z.object({ reference: z.string().min(5).max(150) }) });
export const webhookPayloadSchema = z.object({ body: z.object({ event: z.string(), data: z.object({ reference: z.string(), status: z.string(), amount: z.number().optional(), currency: z.string().optional() }) }) });
