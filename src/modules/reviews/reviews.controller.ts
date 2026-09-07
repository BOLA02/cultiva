import { Request, Response, NextFunction } from 'express';
import { ReviewsService } from './reviews.service';

export class ReviewsController {
  private reviewsService: ReviewsService;

  constructor() {
    this.reviewsService = new ReviewsService();
  }

  /**
   * HTTP Handler: POST /api/v1/orders/:orderId/reviews
   */
  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const orderId = req.params.orderId as string;

      const review = await this.reviewsService.createReview(userId, orderId, req.body);

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully.',
        data: review,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: GET /api/v1/users/:userId/reviews
   * Public — anyone can view a farmer's received reviews (trust signal).
   */
  getUserReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;

      const reviews = await this.reviewsService.getReviewsForUser(userId);

      res.status(200).json({
        success: true,
        message: 'Reviews retrieved successfully.',
        data: reviews,
      });
    } catch (error: any) {
      next(error);
    }
  };
}