import { prisma } from '../../config/db'; import { AppError } from '../../common/AppError'; import { HttpStatus } from '../../common/http-status';
export class CooperativesService {
  list() { return prisma.cooperativeProfile.findMany({ include: { user: { select: { id: true, firstName: true, lastName: true, isVerified: true } } }, orderBy: { createdAt: 'desc' } }); }
  async mine(userId: string) { const item = await prisma.cooperativeProfile.findUnique({ where: { userId } }); if (!item) throw new AppError('Cooperative profile not found.', HttpStatus.NOT_FOUND); return item; }
  async update(userId: string, data: any) { await this.mine(userId); return prisma.cooperativeProfile.update({ where: { userId }, data }); }
}
