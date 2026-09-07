import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import validate from '../../middlewares/validate.middleware';
import { AdminController } from './admin.controller';
import { adminFarmListSchema, adminListSchema, farmStatusSchema, userStatusSchema, verifyUserSchema } from './admin.validation';

const router = Router();
const controller = new AdminController();

router.use(protect, restrictTo(UserRole.ADMIN));
router.get('/users', validate(adminListSchema), controller.users);
router.patch('/users/:id/status', validate(userStatusSchema), controller.status);
router.patch('/users/:id/verification', validate(verifyUserSchema), controller.verify);
router.get('/farms', validate(adminFarmListSchema), controller.farms);
router.patch('/farms/:id/status', validate(farmStatusSchema), controller.farm);
router.get('/audit-logs', validate(adminListSchema), controller.logs);

export default router;
