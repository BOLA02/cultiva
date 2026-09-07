import { FarmsRepository } from './farms.repository';
import { prisma } from '../../config/db';
import { Farm } from '@prisma/client';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { assertFarmOwnership } from '../../common/ownership';

export class FarmsService {
  private farmsRepository: FarmsRepository;

  constructor() {
    this.farmsRepository = new FarmsRepository();
  }

  async registerFarm(userId: string, input: any): Promise<Farm> {
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmerProfile) {
      throw new AppError('Access denied. You must have a completed Farmer Profile to register lands.', HttpStatus.FORBIDDEN);
    }

    const farmData = {
      farmerProfileId: farmerProfile.id,
      name: input.name,
      address: input.address,
      sizeHectares: input.sizeHectares,
      soilType: input.soilType || null,
      locationCoordinates: input.locationCoordinates || null,
    };

    return this.farmsRepository.create(farmData);
  }

  async getFarmerOwnedFarms(userId: string): Promise<Farm[]> {
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmerProfile) {
      throw new AppError('Access denied. No associated farmer profile found.', HttpStatus.FORBIDDEN);
    }

    return this.farmsRepository.findByFarmerId(farmerProfile.id);
  }

  async getFarmDetailsById(userId: string, farmId: string): Promise<Farm> {
    const farm = await this.farmsRepository.findById(farmId);
    if (!farm) {
      throw new AppError('The requested farm record could not be found.', HttpStatus.NOT_FOUND);
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!farmerProfile || farm.farmerProfileId !== farmerProfile.id) {
      throw new AppError('Unauthorized access. You do not own this farm infrastructure.', HttpStatus.FORBIDDEN);
    }

    return farm;
  }

  async addDocument(userId: string, farmId: string, input: { name: string; fileUrl: string }) {
    await assertFarmOwnership(userId, farmId);
    return prisma.farmDocument.create({ data: { farmId, name: input.name, fileUrl: input.fileUrl } });
  }

  async getDocuments(userId: string, farmId: string) {
    await assertFarmOwnership(userId, farmId);
    return prisma.farmDocument.findMany({ where: { farmId }, orderBy: { createdAt: 'desc' } });
  }
}
