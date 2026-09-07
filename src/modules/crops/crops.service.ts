import { CropsRepository } from './crops.repository';
import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { Crop, CropStatus } from '@prisma/client';
import { assertFarmOwnership } from '../../common/ownership';
import crypto from 'crypto';

// Isolated on purpose — currently permissive, ready to become a real
// state machine later without touching anything else in this file.
const isValidStatusTransition = (_current: CropStatus, _next: CropStatus): boolean => {
  return true;
};

export class CropsService {
  private cropsRepository: CropsRepository;

  constructor() {
    this.cropsRepository = new CropsRepository();
  }

  /**
   * Verifies the requesting user owns the farm before allowing a crop
   * to be registered under it.
   */
  async registerCrop(userId: string, farmId: string, input: any): Promise<Crop> {
     await assertFarmOwnership(userId, farmId);
    const cropData = {
      farmId,
      name: input.name,
      variety: input.variety || null,
      plantedDate: input.plantedDate,
      estimatedHarvestDate: input.estimatedHarvestDate,
      yieldEstimateQty: input.yieldEstimateQty || null,
      yieldUnit: input.yieldUnit || null,
    };

    return this.cropsRepository.create(cropData);
  }

  /**
   * Lists all crops under a farm, after verifying ownership.
   */
  async getFarmCrops(userId: string, farmId: string): Promise<Crop[]> {
    await assertFarmOwnership(userId, farmId);

    return this.cropsRepository.findByFarmId(farmId);
  }

  /**
   * Updates a crop's status/yield data, after walking the ownership
   * chain (crop → farm → farmerProfile → user) in a single query.
   */
  async updateCrop(userId: string, cropId: string, input: any): Promise<Crop> {
    const crop = await this.cropsRepository.findByIdWithOwnership(cropId);

    if (!crop) {
      throw new AppError('The requested crop could not be found.', HttpStatus.NOT_FOUND);
    }

    if (crop.farm.farmerProfile.userId !== userId) {
      throw new AppError('Unauthorized. You do not own this crop.', HttpStatus.FORBIDDEN);
    }

    if (input.status && !isValidStatusTransition(crop.status, input.status)) {
      throw new AppError(
        `Cannot transition crop from ${crop.status} to ${input.status}.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const updateData: any = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.actualHarvestDate !== undefined) updateData.actualHarvestDate = input.actualHarvestDate;
    if (input.yieldEstimateQty !== undefined) updateData.yieldEstimateQty = input.yieldEstimateQty;
    if (input.yieldUnit !== undefined) updateData.yieldUnit = input.yieldUnit;

    return this.cropsRepository.update(cropId, updateData);
  }

  async getCrop(userId: string, cropId: string): Promise<Crop> {
  const crop = await this.cropsRepository.findByIdWithOwnership(cropId);

  if (!crop) {
    throw new AppError(
      'The requested crop could not be found.',
      HttpStatus.NOT_FOUND
    );
  }

  if (crop.farm.farmerProfile.userId !== userId) {
    throw new AppError(
      'Unauthorized. You do not own this crop.',
      HttpStatus.FORBIDDEN
    );
  }

  return crop;
}

async deleteCrop(userId: string, cropId: string): Promise<void> {
  const crop = await this.cropsRepository.findByIdWithOwnership(cropId);
  if (!crop) throw new AppError('The requested crop could not be found.', HttpStatus.NOT_FOUND);
  if (crop.farm.farmerProfile.userId !== userId) throw new AppError('Unauthorized. You do not own this crop.', HttpStatus.FORBIDDEN);

  try {
    await this.cropsRepository.delete(cropId);
  } catch (error: any) {
    if (error?.code === 'P2003') {
      throw new AppError('This crop cannot be deleted because it has orders. Delist it instead to remove it from the marketplace.', HttpStatus.CONFLICT);
    }
    throw error;
  }
}

async getFarmerCrops(userId: string): Promise<Crop[]> {
  return this.cropsRepository.findByFarmerId(userId);
}

async uploadImage(userId: string, cropId: string, imageData: string) {
  const crop = await this.cropsRepository.findByIdWithOwnership(cropId);
  if (!crop) throw new AppError('The requested crop could not be found.', HttpStatus.NOT_FOUND);
  if (crop.farm.farmerProfile.userId !== userId) throw new AppError('Unauthorized. You do not own this crop.', HttpStatus.FORBIDDEN);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new AppError('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.', HttpStatus.INTERNAL_SERVER_ERROR);

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'cultiva/crops';
  const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const body = new FormData();
  body.append('file', imageData);
  body.append('api_key', apiKey);
  body.append('timestamp', String(timestamp));
  body.append('folder', folder);
  body.append('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
  const result = await response.json() as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) throw new AppError(result.error?.message || 'Cloudinary image upload failed.', HttpStatus.BAD_REQUEST);

  const imageCount = await prisma.cropImage.count({ where: { cropId } });
  return prisma.cropImage.create({ data: { cropId, imageUrl: result.secure_url, isPrimary: imageCount === 0 } });
}
}
