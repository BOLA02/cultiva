import { prisma } from '../../config/db';
import { Prisma, Farm } from '@prisma/client';

export class FarmsRepository {
  /**
   * Register a new farm associated with a farmer profile
   */
  async create(data: Prisma.FarmUncheckedCreateInput): Promise<Farm> {
    return prisma.farm.create({
      data,
    });
  }

  /**
   * Find a specific farm by its unique primary ID
   */
  async findById(id: string): Promise<Farm | null> {
    return prisma.farm.findUnique({
      where: { id },
      include: {
        crops: true,
        documents: true,
      },
    });
  }

  /**
   * Retrieve all farms belonging to a specific farmer profile
   */
  async findByFarmerId(farmerProfileId: string): Promise<Farm[]> {
    return prisma.farm.findMany({
      where: { farmerProfileId },
      include: {
        _count: {
          select: { crops: true },
        },
      },
    });
  }

  /**
   * Update farm attributes (e.g., verifying status or size)
   */
  async update(id: string, data: Prisma.FarmUpdateInput): Promise<Farm> {
    return prisma.farm.update({
      where: { id },
      data,
    });
  }
}
