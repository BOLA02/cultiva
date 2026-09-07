import { PaymentsRepository } from './payments.repository';
import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import crypto from 'crypto';

const paystackKey = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new AppError('Paystack is not configured. Set PAYSTACK_SECRET_KEY.', HttpStatus.INTERNAL_SERVER_ERROR);
  return key;
};

export class PaymentsService {
  private paymentsRepository = new PaymentsRepository();

  async initiatePayment(userId: string, orderId: string, method: PaymentMethod) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { buyerProfile: { select: { userId: true, user: { select: { email: true } } } } } });
    if (!order) throw new AppError('The specified order could not be found.', HttpStatus.NOT_FOUND);
    if (order.buyerProfile.userId !== userId) throw new AppError('Unauthorized. This is not your order.', HttpStatus.FORBIDDEN);
    if (order.status !== OrderStatus.PENDING) throw new AppError('Only pending orders can be paid for.', HttpStatus.CONFLICT);
    if (await this.paymentsRepository.findByOrderId(orderId)) throw new AppError('A payment has already been initiated for this order.', HttpStatus.CONFLICT);

    const transactionRef = `cultiva_${crypto.randomUUID()}`;
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST', headers: { Authorization: `Bearer ${paystackKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: order.buyerProfile.user.email, amount: String(Math.round(order.totalAmount * 100)), currency: order.currency, reference: transactionRef, channels: ['card', 'bank_transfer'], callback_url: process.env.PAYSTACK_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`, metadata: JSON.stringify({ orderId }) }),
    });
    const result = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } };
    if (!response.ok || !result.status || !result.data?.authorization_url) throw new AppError(result.message || 'Could not initialize Paystack payment.', HttpStatus.BAD_REQUEST);
    const payment = await this.paymentsRepository.create({ orderId, transactionRef: result.data.reference || transactionRef, amount: order.totalAmount, currency: order.currency, method, status: PaymentStatus.PENDING });
    return { payment, checkoutUrl: result.data.authorization_url };
  }

  async verifyPayment(userId: string, reference: string) {
    const payment = await this.paymentsRepository.findByTransactionRef(reference);
    if (!payment) throw new AppError('No payment found for this transaction reference.', HttpStatus.NOT_FOUND);
    const order = await prisma.order.findUnique({ where: { id: payment.orderId }, include: { buyerProfile: { select: { userId: true } } } });
    if (!order || order.buyerProfile.userId !== userId) throw new AppError('Unauthorized. This is not your payment.', HttpStatus.FORBIDDEN);
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${paystackKey()}` } });
    const result = await response.json() as { status?: boolean; message?: string; data?: { status?: string; amount?: number; currency?: string; reference?: string } };
    if (!response.ok || !result.status || !result.data) throw new AppError(result.message || 'Could not verify Paystack payment.', HttpStatus.BAD_REQUEST);
    if (result.data.amount !== Math.round(payment.amount * 100) || result.data.currency !== payment.currency) throw new AppError('Payment amount or currency does not match the order.', HttpStatus.CONFLICT);
    return this.recordGatewayResult(reference, result.data.status === 'success');
  }

  async handleWebhook(rawBody: string, signatureHeader: string | undefined, payload: { event: string; data: { reference: string; status: string; amount?: number; currency?: string } }) {
    const expected = crypto.createHmac('sha512', paystackKey()).update(rawBody).digest('hex');
    if (!signatureHeader || signatureHeader.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))) throw new AppError('Invalid Paystack webhook signature.', HttpStatus.UNAUTHORIZED);
    if (payload.event !== 'charge.success') return null;
    return this.recordGatewayResult(payload.data.reference, payload.data.status === 'success');
  }

  private async recordGatewayResult(reference: string, successful: boolean) {
    const payment = await this.paymentsRepository.findByTransactionRef(reference);
    if (!payment) throw new AppError('No payment found for this transaction reference.', HttpStatus.NOT_FOUND);
    if (payment.status === PaymentStatus.SUCCESSFUL) return payment;
    return prisma.$transaction(async tx => {
      const updated = await tx.payment.update({ where: { transactionRef: reference }, data: { status: successful ? PaymentStatus.SUCCESSFUL : PaymentStatus.FAILED } });
      // A successful payment does not replace the farmer's acceptance.
      // The order remains PENDING until the farmer confirms it can be fulfilled.
      return updated;
    });
  }
}
