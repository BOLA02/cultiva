import { OrdersRepository } from './orders.repository';
import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { ListingStatus, Order, OrderStatus, UserRole } from '@prisma/client';
import { calculateTransportFee } from '../transport/transport.service';


interface OrderItemInput {
  listingId: string;
  quantity: number;
}

export class OrdersService {
  private ordersRepository: OrdersRepository;
  
private async loadOrderOrThrow(orderId: string) {
  const order = await this.ordersRepository.findByIdWithOwnership(orderId);
  if (!order) {
    throw new AppError('The requested order could not be found.', HttpStatus.NOT_FOUND);
  }
  return order;
}

private assertBuyerOwnsOrder(userId: string, order: NonNullable<Awaited<ReturnType<OrdersRepository['findByIdWithOwnership']>>>) {
  if (order.buyerProfile.userId !== userId) {
    throw new AppError('Unauthorized. This is not your order.', HttpStatus.FORBIDDEN);
  }
}

private assertFarmerHasStakeInOrder(userId: string, order: NonNullable<Awaited<ReturnType<OrdersRepository['findByIdWithOwnership']>>>) {
  const ownsAnItem = order.items.some(
    (item) => item.listing.crop.farm.farmerProfile.userId === userId
  );
  if (!ownsAnItem) {
    throw new AppError('Unauthorized. None of your listings are part of this order.', HttpStatus.FORBIDDEN);
  }
}

  constructor() {
    this.ordersRepository = new OrdersRepository();
  }

  /**
   * Places an order for one or more listings, atomically:
   * validates stock, computes pricing server-side, decrements stock,
   * and creates the Order + OrderItems — all inside one transaction.
   */
  async placeOrder(
    userId: string,
    input: { items: OrderItemInput[]; shippingAddress: string; notes?: string }
  ): Promise<Order> {
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!buyerProfile) {
      throw new AppError('Access denied. You must have a completed Buyer Profile to place orders.', HttpStatus.FORBIDDEN);
    }

    return prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const currency = 'NGN';
      const orderItems: { listingId: string; quantity: number; priceAtSale: number }[] = [];

      for (const item of input.items) {
        const listing = await this.ordersRepository.getListingForOrder(tx, item.listingId);

        if (!listing) {
          throw new AppError(`Listing ${item.listingId} could not be found.`, HttpStatus.NOT_FOUND);
        }

        if (listing.status !== ListingStatus.ACTIVE) {
          throw new AppError(`Listing "${item.listingId}" is not currently available for purchase.`, HttpStatus.CONFLICT);
        }

        if (item.quantity < listing.minimumOrderQty) {
          throw new AppError(
            `Minimum order quantity for this listing is ${listing.minimumOrderQty}.`,
            HttpStatus.BAD_REQUEST
          );
        }

        const decrementedCount = await this.ordersRepository.decrementStock(tx, item.listingId, item.quantity);

        if (decrementedCount === 0) {
          throw new AppError(
            `Not enough stock available for listing ${item.listingId}.`,
            HttpStatus.CONFLICT
          );
        }

        const priceAtSale = listing.pricePerUnit;
        totalAmount += priceAtSale * item.quantity;

        orderItems.push({
          listingId: item.listingId,
          quantity: item.quantity,
          priceAtSale,
        });
      }

      return this.ordersRepository.createOrderWithItems(tx, {
        buyerProfileId: buyerProfile.id,
        totalAmount,
        currency,
        shippingAddress: input.shippingAddress,
        notes: input.notes,
        items: orderItems,
      });
    });
  }

  /**
 * Farmer accepts a pending order. Requires ownership of at least one item.
 */
async acceptOrder(userId: string, orderId: string, transportPrice?: number) {
  const order = await this.loadOrderOrThrow(orderId);
  this.assertFarmerHasStakeInOrder(userId, order);

  if (order.status !== OrderStatus.PENDING) {
    throw new AppError(`Cannot accept an order in "${order.status}" status.`, HttpStatus.CONFLICT);
  }

  // Pickup address is taken from the accepting farmer's own farm.
  // LIMITATION: for orders spanning multiple farms, this only captures
  // one pickup point — true multi-farm logistics needs a separate
  // TransportJob per farm, which is out of scope for now.
  const ownedItem = order.items.find(
    (item) => item.listing.crop.farm.farmerProfile.userId === userId
  );
  const pickupAddress = ownedItem!.listing.crop.farm.address;

  return prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ACCEPTED },
    });

 const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
const priceCharge = transportPrice ?? calculateTransportFee(totalQuantity);
// ...
await this.ordersRepository.createTransportJob(tx, {
  orderId,
  pickupAddress,
  deliveryAddress: order.shippingAddress,
  priceCharge,
});

    const transporterUsers = await tx.user.findMany({
      where: { role: UserRole.TRANSPORTER, status: 'ACTIVE' },
      select: { id: true },
    });
    await tx.notification.createMany({
      data: [
        { userId: order.buyerProfile.userId, title: 'Order accepted', body: 'Your farmer accepted the order. A transporter is now being assigned.' },
        { userId, title: 'Order accepted', body: 'You accepted this order. A transport job is now available for pickup.' },
        ...transporterUsers.map(({ id }) => ({ userId: id, title: 'New delivery job', body: `A delivery job is available from ${pickupAddress}. Open Transport jobs to claim it.` })),
      ],
    });

    return updatedOrder;
  });
}

async rejectOrder(userId: string, orderId: string, reason: string) {
  const order = await this.loadOrderOrThrow(orderId);
  this.assertFarmerHasStakeInOrder(userId, order);
  if (order.status !== OrderStatus.PENDING) {
    throw new AppError(`Cannot reject an order in "${order.status}" status.`, HttpStatus.CONFLICT);
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED, rejectionReason: reason } });
    await tx.notification.create({ data: { userId: order.buyerProfile.userId, title: 'Order rejected', body: `The farmer could not accept your order: ${reason}` } });
    return updated;
  });
}

/**
 * Farmer moves an accepted order into processing.
 */
async processOrder(userId: string, orderId: string) {
  const order = await this.loadOrderOrThrow(orderId);
  this.assertFarmerHasStakeInOrder(userId, order);

  if (order.status !== OrderStatus.ACCEPTED) {
    throw new AppError(`Cannot process an order in "${order.status}" status.`, HttpStatus.CONFLICT);
  }

  return this.ordersRepository.updateStatus(orderId, OrderStatus.PROCESSING);
}

/**
 * Buyer cancels their own order — only while it's still early in the lifecycle.
 */
async cancelOrder(userId: string, orderId: string) {
  const order = await this.loadOrderOrThrow(orderId);
  this.assertBuyerOwnsOrder(userId, order);

  const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.ACCEPTED];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AppError(`Cannot cancel an order in "${order.status}" status.`, HttpStatus.CONFLICT);
  }

  return this.ordersRepository.updateStatus(orderId, OrderStatus.CANCELLED);
}

async listMyOrders(userId: string, role: UserRole) {
  if (role === UserRole.FARMER) {
    return this.ordersRepository.findForFarmer(userId);
  }

  const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!buyerProfile) {
    throw new AppError('Access denied. No associated buyer profile found.', HttpStatus.FORBIDDEN);
  }
  return this.ordersRepository.findForBuyer(buyerProfile.id);
}
  
}




