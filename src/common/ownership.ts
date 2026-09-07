import { prisma } from '../config/db';
import { AppError } from './AppError';
import { HttpStatus } from './http-status';

/**
 * Verifies the given farm belongs to the given user, via its FarmerProfile.
 * Throws AppError (404 if the farm doesn't exist, 403 if it's not owned by this user).
 */
export const assertFarmOwnership = async (userId: string, farmId: string) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: { farmerProfile: { select: { userId: true } } },
  });

  if (!farm) {
    throw new AppError('The specified farm could not be found.', HttpStatus.NOT_FOUND);
  }

  if (farm.farmerProfile.userId !== userId) {
    throw new AppError('Unauthorized. You do not own this farm.', HttpStatus.FORBIDDEN);
  }

  return farm;
};

/**
 * Verifies the given crop belongs to the given user, via its Farm → FarmerProfile.
 */
export const assertCropOwnership = async (userId: string, cropId: string) => {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    include: { farm: { include: { farmerProfile: { select: { userId: true } } } } },
  });

  if (!crop) {
    throw new AppError('The specified crop could not be found.', HttpStatus.NOT_FOUND);
  }

  if (crop.farm.farmerProfile.userId !== userId) {
    throw new AppError('Unauthorized. You do not own this crop.', HttpStatus.FORBIDDEN);
  }

  return crop;
};