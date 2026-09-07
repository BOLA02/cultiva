import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { acceptOrderSchema, createOrderSchema, orderIdParamSchema, rejectOrderSchema } from './orders.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';
// orders.routes.ts
import { nestedPaymentRoutes } from '../payments';
import { nestedReviewRoutes } from '../reviews';

const router = Router();
const controller = new OrdersController();

// Every order route requires authentication — but not every route requires
// the same role, so `protect` is shared, `restrictTo` is applied per-route below.
router.use(protect);
router.use('/:orderId/payments', nestedPaymentRoutes);
router.use('/:orderId/reviews', nestedReviewRoutes);
router.get('/', controller.listMyOrders);

router.post('/', restrictTo(UserRole.BUYER), validate(createOrderSchema), controller.createOrder);

router.patch(
  '/:id/accept',
  restrictTo(UserRole.FARMER),
  validate(acceptOrderSchema),
  controller.acceptOrder
);

router.patch(
  '/:id/reject',
  restrictTo(UserRole.FARMER),
  validate(rejectOrderSchema),
  controller.rejectOrder
);

router.patch(
  '/:id/process',
  restrictTo(UserRole.FARMER),
  validate(orderIdParamSchema),
  controller.processOrder
);

router.patch(
  '/:id/cancel',
  restrictTo(UserRole.BUYER),
  validate(orderIdParamSchema),
  controller.cancelOrder
);



export default router;
