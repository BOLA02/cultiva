import { prisma } from '../../config/db';
import { Prisma, Review } from '@prisma/client';

export class ReviewsRepository {
  async create(data: Prisma.ReviewUncheckedCreateInput): Promise<Review> {
    return prisma.review.create({ data });
  }

  async findByOrderAndTarget(orderId: string, targetId: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { orderId_targetId: { orderId, targetId } },
    });
  }

  async findReceivedByUser(userId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { targetId: userId },
      orderBy: { createdAt: 'desc' },
      include: { reviewer: { select: { firstName: true, lastName: true } } },
    });
  }
}