import { prisma } from '../../config/db';
import { Prisma, Order } from '@prisma/client';
  // add to orders.repository.ts
import { OrderStatus } from '@prisma/client';


export class OrdersRepository {
  /**
   * Fetches a listing's current price and available quantity, scoped to a
   * transaction client so it reads consistent data within that transaction.
   */
  async getListingForOrder(tx: Prisma.TransactionClient, listingId: string) {
    return tx.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        pricePerUnit: true,
        currency: true,
        availableQty: true,
        minimumOrderQty: true,
        status: true,
        negotiable: true,
      },
    });
  }

  /**
   * Atomically decrements a listing's availableQty, but ONLY if enough
   * stock remains. Returns the number of rows affected (0 or 1).
   */
  async decrementStock(tx: Prisma.TransactionClient, listingId: string, quantity: number): Promise<number> {
    const result = await tx.listing.updateMany({
      where: { id: listingId, availableQty: { gte: quantity } },
      data: { availableQty: { decrement: quantity } },
    });

    return result.count;
  }

  /**
   * Creates the Order and its OrderItems together in one nested write.
   */
  async createOrderWithItems(
    tx: Prisma.TransactionClient,
    data: {
      buyerProfileId: string;
      totalAmount: number;
      currency: string;
      shippingAddress: string;
      notes?: string;
      items: { listingId: string; quantity: number; priceAtSale: number }[];
    }
  ): Promise<Order> {
    return tx.order.create({
      data: {
        buyerProfileId: data.buyerProfileId,
        totalAmount: data.totalAmount,
        currency: data.currency,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            listingId: item.listingId,
            quantity: item.quantity,
            priceAtSale: item.priceAtSale,
          })),
        },
      },
      include: { items: true },
    });
  }


async findByIdWithOwnership(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      buyerProfile: { select: { userId: true } },
      items: {
        include: {
          listing: {
            include: {
              crop: {
                include: {
                  farm: { include: { farmerProfile: { select: { userId: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });
}

async updateStatus(id: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id },
    data: { status },
  });
}
async createTransportJob(
  tx: Prisma.TransactionClient,
  data: { orderId: string; pickupAddress: string; deliveryAddress: string; priceCharge: number }
) {
  return tx.transportJob.create({ data });
}

async findForBuyer(buyerProfileId: string) {
  return prisma.order.findMany({
    where: { buyerProfileId },
    include: { items: { include: { listing: { select: { title: true, unitType: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

async findForFarmer(farmerUserId: string) {
  return prisma.order.findMany({
    where: {
      items: { some: { listing: { crop: { farm: { farmerProfile: { userId: farmerUserId } } } } } },
    },
    include: { items: { include: { listing: { select: { title: true, unitType: true } } } }, buyerProfile: { select: { companyName: true, user: { select: { firstName: true, lastName: true, phone: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}
}
