import { ReviewsRepository } from './reviews.repository';
import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { OrderStatus, Prisma } from '@prisma/client';

export class ReviewsService {
  private reviewsRepository: ReviewsRepository;

  constructor() {
    this.reviewsRepository = new ReviewsRepository();
  }

  /**
   * Buyer leaves a review for a farmer whose listing was part of a
   * delivered order. One review per (order, target) — enforced both
   * here (clean error message) and at the database level (real guarantee).
   */
  async createReview(userId: string, orderId: string, input: { targetId: string; rating: number; comment?: string }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyerProfile: { select: { userId: true } },
        items: {
          include: {
            listing: {
              include: { crop: { include: { farm: { include: { farmerProfile: { select: { userId: true } } } } } } },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('The specified order could not be found.', HttpStatus.NOT_FOUND);
    }

    if (order.buyerProfile.userId !== userId) {
      throw new AppError('Unauthorized. This is not your order.', HttpStatus.FORBIDDEN);
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new AppError('You can only review orders that have been delivered.', HttpStatus.CONFLICT);
    }

    const targetIsInOrder = order.items.some(
      (item) => item.listing.crop.farm.farmerProfile.userId === input.targetId
    );
    if (!targetIsInOrder) {
      throw new AppError('This farmer was not part of this order.', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.reviewsRepository.create({
        orderId,
        reviewerId: userId,
        targetId: input.targetId,
        rating: input.rating,
        comment: input.comment,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('You have already reviewed this farmer for this order.', HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async getReviewsForUser(userId: string) {
    return this.reviewsRepository.findReceivedByUser(userId);
  }
}