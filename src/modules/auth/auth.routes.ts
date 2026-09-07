import { Router } from 'express';
import { AuthController } from './auth.controller';
import { registerSchema, loginSchema } from './auth.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AuthController();


router.get('/me', protect, controller.getMe);
// 1. Unified Actor Registration Endpoint Pipeline
router.post(
  '/register', 
  validate(registerSchema), 
  controller.register
);

// 2. Client Login Authorization Session Endpoint Pipeline
router.post(
  '/login', 
  validate(loginSchema), 
  controller.login
);

router.post('/logout', controller.logout);

export default router;
