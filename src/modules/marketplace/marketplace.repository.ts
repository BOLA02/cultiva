import { prisma } from '../../config/db';
import { Prisma, Listing, ListingStatus } from '@prisma/client';
import { ListingWithOwnership } from './marketplace.types';

export class MarketplaceRepository {
  /**
   * Create a new listing under a specific crop
   */
  async create(data: Prisma.ListingUncheckedCreateInput): Promise<Listing> {
    return prisma.listing.create({
      data,
    });
  }

  /**
   * Find a listing by ID, including enough of the ownership chain
   * (crop → farm → farmerProfile → user) for the service layer to verify access
   */
  async findByIdWithOwnership(id: string): Promise<ListingWithOwnership | null> {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        crop: {
          include: {
            farm: {
              include: {
                farmerProfile: {
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Browse paginated, publicly visible (ACTIVE) listings
   */
  async findActivePaginated(skip: number, take: number): Promise<{ data: Listing[]; total: number }> {
    const [data, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where: { status: ListingStatus.ACTIVE, crop: { farm: { status: 'VERIFIED' } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { crop: { select: { name: true, variety: true, images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } }, farm: { select: { name: true } } } } },
      }),
      prisma.listing.count({
        where: { status: ListingStatus.ACTIVE, crop: { farm: { status: 'VERIFIED' } } },
      }),
    ]);

    return { data, total };
  }

  /**
   * Update listing attributes
   */
  async update(id: string, data: Prisma.ListingUpdateInput): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data,
    });
  }
  async findByFarmerId(farmerUserId: string) {
  return prisma.listing.findMany({
    where: {
      crop: { farm: { farmerProfile: { userId: farmerUserId } } },
    },
    include: { crop: { select: { name: true, variety: true, images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } }, farm: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

  async findContactByListingId(id: string) {
    return prisma.listing.findUnique({
      where: { id },
      select: {
        status: true,
        crop: {
          select: {
            farm: {
              select: {
                name: true,
                farmerProfile: {
                  select: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
                },
              },
            },
          },
        },
      },
    });
  }
}
