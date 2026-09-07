import { z } from 'zod';
import { FarmStatus, UserStatus, VerificationStatus } from '@prisma/client';

const id = z.string().uuid();
const pagination = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userStatusSchema = z.object({ params: z.object({ id }), body: z.object({ status: z.enum(UserStatus) }) });
export const verifyUserSchema = z.object({ params: z.object({ id }), body: z.object({ verificationStatus: z.enum(VerificationStatus) }) });
export const farmStatusSchema = z.object({ params: z.object({ id }), body: z.object({ status: z.enum(FarmStatus) }) });
export const adminListSchema = z.object({ query: pagination });
export const adminFarmListSchema = z.object({
  query: pagination.extend({ status: z.enum(FarmStatus).optional() }),
});
