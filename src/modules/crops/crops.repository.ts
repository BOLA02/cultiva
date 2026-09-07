import { prisma } from '../../config/db';
import { Prisma, Crop } from '@prisma/client';

export class CropsRepository {
  /**
   * Create a new crop under a specific farm
   */
  async create(data: Prisma.CropUncheckedCreateInput): Promise<Crop> {
    return prisma.crop.create({
      data,
    });
  }

  /**
   * Find a crop by ID, including enough of the ownership chain
   * (farm → farmerProfile → user) for the service layer to verify access
   */
  async findByIdWithOwnership(id: string) {
    return prisma.crop.findUnique({
      where: { id },
      include: {
        farm: {
          include: {
            farmerProfile: {
              select: { userId: true },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieve all crops belonging to a specific farm
   */
  async findByFarmId(farmId: string): Promise<Crop[]> {
    return prisma.crop.findMany({
      where: { farmId },
      orderBy: { plantedDate: 'desc' },
    });
  }

  /**
   * Update crop attributes (status, yield data, actual harvest date)
   */
  async update(id: string, data: Prisma.CropUpdateInput): Promise<Crop> {
    return prisma.crop.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Crop> {
    return prisma.crop.delete({ where: { id } });
  }

  async findByFarmerId(userId: string): Promise<Crop[]> {
  return prisma.crop.findMany({
    where: {
      farm: {
        farmerProfile: {
          userId,
        },
      },
    },
    orderBy: {
      plantedDate: 'desc',
    },
  });
}
}
