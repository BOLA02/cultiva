import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';

const publicUserSelect = {
  id: true, firstName: true, lastName: true, role: true, isVerified: true,
  verificationStatus: true, createdAt: true,
} as const;

export class UsersService {
  async getPublicProfile(id: string) {
    const user = await prisma.user.findUnique({
      where: { id }, select: { ...publicUserSelect, receivedReviews: { select: { rating: true } } },
    });
    if (!user) throw new AppError('User not found.', HttpStatus.NOT_FOUND);
    const ratings = user.receivedReviews;
    const averageRating = ratings.length ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length : null;
    const { receivedReviews, ...profile } = user;
    return { ...profile, averageRating, reviewCount: ratings.length };
  }

  async updateMe(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    if (data.phone) {
      const existing = await prisma.user.findFirst({ where: { phone: data.phone, NOT: { id: userId } } });
      if (existing) throw new AppError('That phone number is already in use.', HttpStatus.CONFLICT);
    }
    return prisma.user.update({ where: { id: userId }, data, select: { ...publicUserSelect, email: true, phone: true, status: true } });
  }
}
