import { z } from 'zod';
import { ListingStatus } from '@prisma/client';

const uuidParam = z.string().uuid('Invalid ID format');

export const createListingSchema = z.object({
  params: z.object({
    cropId: uuidParam,
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title is too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description is too long'),
    pricePerUnit: z.number().positive('Price must be a positive number'),
    currency: z.string().length(3, 'Currency must be a 3-letter code, e.g. NGN').optional(),
    unitType: z.string().min(1, 'Unit type is required').max(20),
    availableQty: z.number().positive('Available quantity must be positive'),
    minimumOrderQty: z.number().positive().optional(),
    negotiable: z.boolean().optional(),
  }),
});

export const updateListingSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  body: z
    .object({
      title: z.string().min(3).max(150).optional(),
      description: z.string().min(10).max(2000).optional(),
      pricePerUnit: z.number().positive().optional(),
      currency: z.string().length(3).optional(),
      unitType: z.string().min(1).max(20).optional(),
      availableQty: z.number().positive().optional(),
      minimumOrderQty: z.number().positive().optional(),
      status: z.enum(ListingStatus).optional(),
      negotiable: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update the listing',
    }),
});

export const listingIdParamSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
});