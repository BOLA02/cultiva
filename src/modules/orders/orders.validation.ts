import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID format');

export const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          listingId: uuid,
          quantity: z.number().positive('Quantity must be a positive number'),
        })
      )
      .min(1, 'An order must contain at least one item'),
    shippingAddress: z.string().min(5, 'Shipping address is required'),
    notes: z.string().max(500, 'Notes are too long').optional(),
  }),
});

// add to orders.validation.ts
export const orderIdParamSchema = z.object({
  params: z.object({
    id: uuid,
  }),
});

export const acceptOrderSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({ transportPrice: z.number().positive().optional() }).optional(),
});

export const rejectOrderSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({ reason: z.string().trim().min(3, 'Please provide a rejection reason.').max(500) }),
});
