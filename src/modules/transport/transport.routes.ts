import { Router } from 'express';
import { TransportController } from './transport.controller';
import { transportJobIdParamSchema } from './transport.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new TransportController();

// Every route in this module is transporter-only — no per-route mixing needed here.
router.use(protect, restrictTo(UserRole.TRANSPORTER));

router.get('/available', controller.getAvailableJobs);
router.patch('/:id/claim', validate(transportJobIdParamSchema), controller.claimJob);
router.patch('/:id/pickup', validate(transportJobIdParamSchema), controller.markPickedUp);
router.patch('/:id/deliver', validate(transportJobIdParamSchema), controller.markDelivered);

export default router;