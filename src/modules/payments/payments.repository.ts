import { prisma } from '../../config/db';
import { Prisma, Payment, PaymentStatus } from '@prisma/client';

export class PaymentsRepository {
  async create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return prisma.payment.create({ data });
  }

  async findByTransactionRef(transactionRef: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { transactionRef } });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { orderId } });
  }

  async updateStatus(transactionRef: string, status: PaymentStatus): Promise<Payment> {
    return prisma.payment.update({
      where: { transactionRef },
      data: { status },
    });
  }
}