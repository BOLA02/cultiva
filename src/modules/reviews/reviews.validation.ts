import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID format');

export const createReviewSchema = z.object({
  params: z.object({
    orderId: uuid,
  }),
  body: z.object({
    targetId: uuid,
    rating: z.number().int('Rating must be a whole number').min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().max(1000, 'Comment is too long').optional(),
  }),
});

// add to reviews.validation.ts
export const userIdParamSchema = z.object({
  params: z.object({
    userId: uuid,
  }),
});