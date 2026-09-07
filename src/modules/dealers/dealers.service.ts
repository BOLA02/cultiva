import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
export class DealersService {
  list() { return prisma.dealerProfile.findMany({ include: { user: { select: { id: true, firstName: true, lastName: true, isVerified: true } } }, orderBy: { createdAt: 'desc' } }); }
  async getMine(userId: string) { const profile = await prisma.dealerProfile.findUnique({ where: { userId } }); if (!profile) throw new AppError('Dealer profile not found.', HttpStatus.NOT_FOUND); return profile; }
  async updateMine(userId: string, data: any) { await this.getMine(userId); return prisma.dealerProfile.update({ where: { userId }, data }); }
}
