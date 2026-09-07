import { z } from 'zod';
export const updateCooperativeSchema = z.object({ body: z.object({ registrationNo: z.string().trim().min(3).max(100).optional(), memberCount: z.number().int().positive().optional(), operatingRegion: z.string().trim().min(2).max(150).optional() }).refine((value) => Object.keys(value).length > 0, 'Provide at least one field') });
