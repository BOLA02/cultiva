import { Request, Response, NextFunction } from 'express';
import { TransportService } from './transport.service';

export class TransportController {
  private transportService: TransportService;

  constructor() {
    this.transportService = new TransportService();
  }

  /**
   * HTTP Handler: GET /api/v1/transport/available
   */
  getAvailableJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs = await this.transportService.listAvailableJobs();

      res.status(200).json({
        success: true,
        message: 'Available transport jobs retrieved successfully.',
        data: jobs,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: PATCH /api/v1/transport/:id/claim
   */
  claimJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;

      const job = await this.transportService.claimJob(userId, id);

      res.status(200).json({
        success: true,
        message: 'Transport job claimed successfully.',
        data: job,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: PATCH /api/v1/transport/:id/pickup
   */
  markPickedUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;

      const job = await this.transportService.markPickedUp(userId, id);

      res.status(200).json({
        success: true,
        message: 'Job marked as picked up. Order status updated to SHIPPED.',
        data: job,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: PATCH /api/v1/transport/:id/deliver
   */
  markDelivered = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;

      const job = await this.transportService.markDelivered(userId, id);

      res.status(200).json({
        success: true,
        message: 'Job marked as delivered. Order status updated to DELIVERED.',
        data: job,
      });
    } catch (error: any) {
      next(error);
    }
  };
}