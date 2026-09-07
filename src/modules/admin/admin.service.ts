import { FarmStatus, UserStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';

export class AdminService {
  async users(page: number, limit: number) {
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, status: true, isVerified: true, verificationStatus: true, createdAt: true } }),
      prisma.user.count(),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async farms(page: number, limit: number, status?: FarmStatus) {
    const where = status ? { status } : {};
    const [data, total] = await prisma.$transaction([
      prisma.farm.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          documents: { orderBy: { createdAt: 'desc' } },
          farmerProfile: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, verificationStatus: true } } } },
          _count: { select: { crops: true } },
        },
      }),
      prisma.farm.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async setUserStatus(adminId: string, id: string, status: UserStatus) {
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) throw new AppError('User not found.', HttpStatus.NOT_FOUND);
    const user = await prisma.user.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    await this.audit(adminId, 'USER_STATUS_UPDATE', 'User', id, { before: before.status, after: status });
    return user;
  }

  async verifyUser(adminId: string, id: string, verificationStatus: VerificationStatus) {
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) throw new AppError('User not found.', HttpStatus.NOT_FOUND);
    const user = await prisma.user.update({ where: { id }, data: { verificationStatus, isVerified: verificationStatus === VerificationStatus.VERIFIED, ...(verificationStatus === VerificationStatus.VERIFIED && before.status === UserStatus.PENDING ? { status: UserStatus.ACTIVE } : {}) }, select: { id: true, status: true, isVerified: true, verificationStatus: true } });
    await this.audit(adminId, 'USER_VERIFICATION_UPDATE', 'User', id, { before: before.verificationStatus, after: verificationStatus });
    return user;
  }

  async setFarmStatus(adminId: string, id: string, status: FarmStatus) {
    const farm = await prisma.farm.findUnique({ where: { id }, include: { documents: true, farmerProfile: { select: { userId: true } } } });
    if (!farm) throw new AppError('Farm not found.', HttpStatus.NOT_FOUND);
    if (status === FarmStatus.VERIFIED && farm.documents.length === 0) {
      throw new AppError('A farm needs at least one submitted document before verification.', HttpStatus.BAD_REQUEST);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.farm.update({ where: { id }, data: { status } });
      if (status === FarmStatus.VERIFIED) {
        await tx.farmDocument.updateMany({ where: { farmId: id, status: VerificationStatus.PENDING }, data: { status: VerificationStatus.VERIFIED } });
      }
      await tx.notification.create({
        data: {
          userId: farm.farmerProfile.userId,
          title: status === FarmStatus.VERIFIED ? 'Farm verified' : 'Farm status updated',
          body: status === FarmStatus.VERIFIED
            ? `${farm.name} is verified and its crops can now be listed on the marketplace.`
            : `${farm.name} status is now ${status.replaceAll('_', ' ').toLowerCase()}.`,
        },
      });
      return result;
    });
    await this.audit(adminId, 'FARM_STATUS_UPDATE', 'Farm', id, { before: farm.status, after: status });
    return updated;
  }

  logs(page: number, limit: number) {
    return prisma.auditLog.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, firstName: true, lastName: true } } } });
  }

  private audit(userId: string, action: string, entity: string, entityId: string, details: unknown) {
    return prisma.auditLog.create({ data: { userId, action, entity, entityId, details: JSON.stringify(details) } });
  }
}
