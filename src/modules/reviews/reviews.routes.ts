import { Router } from 'express';
import { ReviewsController } from './reviews.controller';
import { createReviewSchema, userIdParamSchema } from './reviews.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const controller = new ReviewsController();

// Mounted at /api/v1/orders/:orderId/reviews — needs mergeParams for :orderId
export const nestedReviewRoutes = Router({ mergeParams: true });
nestedReviewRoutes.use(protect, restrictTo(UserRole.BUYER));
nestedReviewRoutes.post('/', validate(createReviewSchema), controller.createReview);

// Mounted at /api/v1/users/:userId/reviews — public
export const userReviewRoutes = Router({ mergeParams: true });
userReviewRoutes.get('/', validate(userIdParamSchema), controller.getUserReviews);