import { Prisma } from '@prisma/client';

/**
 * The shape returned when fetching a Listing along with enough of its
 * ownership chain (crop → farm → farmerProfile) to verify access.
 * Named explicitly here so the repository and service layers can share
 * one readable type instead of repeating Prisma's inferred shape.
 */
export type ListingWithOwnership = Prisma.ListingGetPayload<{
  include: {
    crop: {
      include: {
        farm: {
          include: {
            farmerProfile: {
              select: { userId: true };
            };
          };
        };
      };
    };
  };
}>;