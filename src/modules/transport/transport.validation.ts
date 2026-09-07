import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID format');

export const transportJobIdParamSchema = z.object({
  params: z.object({
    id: uuid,
  }),
});