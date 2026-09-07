import { TransportRepository } from './transport.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { TransportStatus, OrderStatus } from '@prisma/client';
import { BASE_TRANSPORT_FEE, PER_UNIT_TRANSPORT_FEE } from './transport.constants';
export class TransportService {
  private transportRepository: TransportRepository;
  private ordersRepository: OrdersRepository;

  constructor() {
    this.transportRepository = new TransportRepository();
    this.ordersRepository = new OrdersRepository();
  }

  async listAvailableJobs() {
    return this.transportRepository.findAvailable();
  }

  /**
   * A transporter claims an unclaimed job.
   */
  async claimJob(userId: string, jobId: string) {
    const transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId },
    });

    if (!transporterProfile) {
      throw new AppError('Access denied. You must have a completed Transporter Profile.', HttpStatus.FORBIDDEN);
    }

    const job = await this.transportRepository.findByIdWithOrder(jobId);
    if (!job) {
      throw new AppError('The requested transport job could not be found.', HttpStatus.NOT_FOUND);
    }

    if (job.transporterProfileId !== null) {
      throw new AppError('This job has already been claimed by another transporter.', HttpStatus.CONFLICT);
    }

    const claimedCount = await this.transportRepository.claim(jobId, transporterProfile.id);

    if (claimedCount === 0) {
      // Someone else claimed it in the gap between our check above and this write.
      throw new AppError('This job was just claimed by another transporter.', HttpStatus.CONFLICT);
    }

    const order = await prisma.order.findUnique({
      where: { id: job.orderId },
      include: {
        buyerProfile: { select: { userId: true } },
        items: {
          select: {
            listing: {
              select: {
                crop: {
                  select: {
                    farm: { select: { farmerProfile: { select: { userId: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (order) {
      const farmerIds = [...new Set(order.items.map((item) => item.listing.crop.farm.farmerProfile.userId))];
      await prisma.notification.createMany({
        data: [
          { userId: order.buyerProfile.userId, title: 'Transporter assigned', body: 'A transporter has claimed your delivery job.' },
          ...farmerIds.map((id) => ({ userId: id, title: 'Transporter assigned', body: 'A transporter has claimed the delivery job for your accepted order.' })),
        ],
      });
    }

    return this.transportRepository.findByIdWithOrder(jobId);
  }

  /**
   * Transporter marks a claimed job as picked up — mirrors the linked
   * order's status forward to SHIPPED, in the same transaction.
   */
  async markPickedUp(userId: string, jobId: string) {
    const job = await this.assertOwnsJob(userId, jobId);

    if (job.status !== TransportStatus.ACCEPTED) {
      throw new AppError(`Cannot mark pickup for a job in "${job.status}" status.`, HttpStatus.CONFLICT);
    }

    return prisma.$transaction(async (tx) => {
      const updatedJob = await tx.transportJob.update({
        where: { id: jobId },
        data: { status: TransportStatus.PICKED_UP, actualPickup: new Date() },
      });

      await tx.order.update({
        where: { id: job.orderId },
        data: { status: OrderStatus.SHIPPED },
      });

      return updatedJob;
    });
  }

  /**
   * Transporter marks a job as delivered — mirrors the linked order's
   * status forward to DELIVERED, in the same transaction.
   */
  async markDelivered(userId: string, jobId: string) {
    const job = await this.assertOwnsJob(userId, jobId);

    if (job.status !== TransportStatus.PICKED_UP) {
      throw new AppError(`Cannot mark delivered for a job in "${job.status}" status.`, HttpStatus.CONFLICT);
    }

    return prisma.$transaction(async (tx) => {
      const updatedJob = await tx.transportJob.update({
        where: { id: jobId },
        data: { status: TransportStatus.DELIVERED, actualDelivery: new Date() },
      });

      await tx.order.update({
        where: { id: job.orderId },
        data: { status: OrderStatus.DELIVERED },
      });

      return updatedJob;
    });
  }

  private async assertOwnsJob(userId: string, jobId: string) {
    const transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId },
    });

    if (!transporterProfile) {
      throw new AppError('Access denied. You must have a completed Transporter Profile.', HttpStatus.FORBIDDEN);
    }

    const job = await this.transportRepository.findByIdWithOrder(jobId);
    if (!job) {
      throw new AppError('The requested transport job could not be found.', HttpStatus.NOT_FOUND);
    }

    if (job.transporterProfileId !== transporterProfile.id) {
      throw new AppError('Unauthorized. This is not your assigned job.', HttpStatus.FORBIDDEN);
    }

    return job;
  }

  
}
export const calculateTransportFee = (totalQuantity: number): number => {
  return BASE_TRANSPORT_FEE + totalQuantity * PER_UNIT_TRANSPORT_FEE;
};
