import { z } from 'zod';
export const notificationIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const notificationQuerySchema = z.object({ query: z.object({ unreadOnly: z.enum(['true', 'false']).optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }) });
