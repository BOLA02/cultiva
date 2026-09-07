import { prisma } from '../../config/db';
import { Prisma, User } from '@prisma/client';
import { ProfileFieldName } from './auth.types';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } });
  }

  async createUserWithProfile(
    userData: Prisma.UserCreateInput,
    profileFieldName: ProfileFieldName,
    profileData: any
  ): Promise<
    Prisma.UserGetPayload<{
      include: {
        farmerProfile: true;
        buyerProfile: true;
        transporterProfile: true;
        dealerProfile: true;
        cooperativeProfile: true;
      };
    }>
  > {
    return prisma.user.create({
      data: { ...userData, [profileFieldName]: { create: profileData } },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
        dealerProfile: true,
        cooperativeProfile: true,
      },
    });
  }
  async findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
}