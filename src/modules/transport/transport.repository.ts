import { prisma } from '../../config/db';
import { TransportStatus } from '@prisma/client';

export class TransportRepository {
  /**
   * Browse unclaimed transport jobs available for pickup.
   */
  async findAvailable() {
    return prisma.transportJob.findMany({
      where: {
        transporterProfileId: null,
        status: TransportStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        order: {
          select: {
            buyerProfile: { select: { user: { select: { firstName: true, lastName: true, phone: true } } } },
            items: {
              take: 1,
              include: {
                listing: {
                  select: {
                    crop: {
                      select: {
                        farm: {
                          select: {
                            farmerProfile: {
                              select: { user: { select: { firstName: true, lastName: true, phone: true } } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Fetch a transport job along with its linked order, for ownership
   * and cross-model status checks.
   */
  async findByIdWithOrder(id: string) {
    return prisma.transportJob.findUnique({
      where: { id },
      include: { order: true },
    });
  }

  /**
   * Atomically claims a job — ONLY if it's still unclaimed. Prevents
   * two transporters from claiming the same job at the same time.
   */
  async claim(jobId: string, transporterProfileId: string): Promise<number> {
    const result = await prisma.transportJob.updateMany({
      where: { id: jobId, transporterProfileId: null },
      data: { transporterProfileId, status: TransportStatus.ACCEPTED },
    });
    return result.count;
  }

  async markPickedUp(jobId: string) {
    return prisma.transportJob.update({
      where: { id: jobId },
      data: { status: TransportStatus.PICKED_UP, actualPickup: new Date() },
    });
  }

  async markDelivered(jobId: string) {
    return prisma.transportJob.update({
      where: { id: jobId },
      data: { status: TransportStatus.DELIVERED, actualDelivery: new Date() },
    });
  }
}
