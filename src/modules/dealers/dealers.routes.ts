import { Router } from 'express'; import { UserRole } from '@prisma/client';
import { DealersController } from './dealers.controller'; import { protect } from '../../middlewares/auth.middleware'; import { restrictTo } from '../../middlewares/rbac.middleware'; import validate from '../../middlewares/validate.middleware'; import { updateDealerSchema } from './dealers.validation';
const router = Router(); const controller = new DealersController();
router.get('/', controller.list); router.get('/me', protect, restrictTo(UserRole.DEALER), controller.mine); router.patch('/me', protect, restrictTo(UserRole.DEALER), validate(updateDealerSchema), controller.update);
export default router;
