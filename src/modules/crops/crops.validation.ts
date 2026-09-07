import { z } from 'zod';
import { CropStatus } from '@prisma/client';

const uuidParam = z.string().uuid('Invalid ID format');

export const createCropSchema = z.object({
  params: z.object({
    farmId: uuidParam,
  }),
  body: z.object({
    name: z.string().min(2, 'Crop name must be at least 2 characters').max(100, 'Crop name is too long'),
    variety: z.string().max(100, 'Variety name is too long').optional(),
    plantedDate: z.coerce.date({ message: 'A valid planted date is required' }),
    estimatedHarvestDate: z.coerce.date({ message: 'A valid estimated harvest date is required' }),
    yieldEstimateQty: z.number().positive().optional(),
    yieldUnit: z.string().max(20, 'Unit label is too long').optional(),
  }),
});

export const updateCropSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z
    .object({
      status: z.enum(CropStatus).optional(),
      actualHarvestDate: z.coerce.date().optional(),
      yieldEstimateQty: z.number().positive().optional(),
      yieldUnit: z.string().max(20, 'Unit label is too long').optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update the crop',
    }),
});

export const createCropImageSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    imageData: z.string().startsWith('data:image/', 'Only image files can be uploaded').max(9_500_000, 'Image is too large. Maximum file size is 7 MB.'),
  }),
});
