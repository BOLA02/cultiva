import { z } from 'zod';
export const updateDealerSchema = z.object({ body: z.object({
  storeName: z.string().trim().min(2).max(150).optional(),
  licenseNumber: z.string().trim().min(3).max(100).nullable().optional(),
  physicalAddress: z.string().trim().min(5).max(300).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one field') });
