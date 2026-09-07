import { Router } from 'express';
import { UsersController } from './users.controller';
import { protect } from '../../middlewares/auth.middleware';
import validate from '../../middlewares/validate.middleware';
import { updateMeSchema, userIdSchema } from './users.validation';

const controller = new UsersController();
const router = Router();
router.patch('/me', protect, validate(updateMeSchema), controller.updateMe);
router.get('/:id', validate(userIdSchema), controller.getById);
export default router;
