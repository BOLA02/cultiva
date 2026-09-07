import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { initiatePaymentSchema, verifyPaymentSchema, webhookPayloadSchema } from './payments.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const controller = new PaymentsController();

// Mounted at /api/v1/orders/:orderId/payments — needs mergeParams for :orderId
export const nestedPaymentRoutes = Router({ mergeParams: true });
nestedPaymentRoutes.use(protect, restrictTo(UserRole.BUYER));
nestedPaymentRoutes.post('/initiate', validate(initiatePaymentSchema), controller.initiatePayment);

// Mounted at /api/v1/payments — public, no protect() at all
export const paymentRoutes = Router();
paymentRoutes.get('/verify/:reference', protect, restrictTo(UserRole.BUYER), validate(verifyPaymentSchema), controller.verifyPayment);
paymentRoutes.post('/webhook', validate(webhookPayloadSchema), controller.handleWebhook);
