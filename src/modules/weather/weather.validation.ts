import { z } from 'zod';
export const forecastSchema = z.object({ query: z.object({ latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180), days: z.coerce.number().int().min(1).max(14).default(7) }) });
