import { z } from 'zod';

export const createFarmSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Farm name must be at least 3 characters long'),
    address: z.string().min(5, 'Physical address description is required'),
    sizeHectares: z.number().positive('Farm size must be a positive number in hectares'),
    soilType: z.string().optional(),
    locationCoordinates: z.string().optional(), // For mapping integrations
  }),
});

export const farmIdSchema = z.object({
  params: z.object({ farmId: z.string().uuid('Invalid farm ID format') }),
});

// The storage provider owns the binary; Cultiva stores the resulting URL.
export const createFarmDocumentSchema = z.object({
  params: z.object({ farmId: z.string().uuid('Invalid farm ID format') }),
  body: z.object({
    name: z.string().min(2, 'Document name must be at least 2 characters').max(150),
    fileUrl: z.string().url('A valid document URL is required').max(2000),
  }),
});
