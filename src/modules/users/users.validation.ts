import { z } from 'zod';

export const userIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const updateMeSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(80).optional(),
    lastName: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
  }).refine((value) => Object.keys(value).length > 0, 'Provide at least one field'),
});
