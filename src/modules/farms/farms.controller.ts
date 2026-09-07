import { Request, Response, NextFunction } from 'express';
import { FarmsService } from './farms.service';

export class FarmsController {
  private farmsService: FarmsService;

  constructor() {
    this.farmsService = new FarmsService();
  }

  /**
   * HTTP Handler: POST /api/v1/farms
   */
  createFarm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract userId injected into the request object by your auth middleware layer
      const userId = req.user!.userId;
      
      const farm = await this.farmsService.registerFarm(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Farm infrastructure registered successfully.',
        data: farm,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: GET /api/v1/farms/my-farms
   */
  getFarmerFarms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const farms = await this.farmsService.getFarmerOwnedFarms(userId);

      res.status(200).json({
        success: true,
        message: 'Farmer asset directory retrieved successfully.',
        data: farms,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: GET /api/v1/farms/:id
   */
  
  getFarmDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      
      // FIX: Force type assertion to guarantee a single string format is passed downstream
      const id = req.params.id as string; 
      
      const farm = await this.farmsService.getFarmDetailsById(userId, id);

      res.status(200).json({
        success: true,
        message: 'Farm profile retrieved successfully.',
        data: farm,
      });
    } catch (error: any) {
      next(error);
    }
  };

  createFarmDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const document = await this.farmsService.addDocument(req.user!.userId, req.params.farmId as string, req.body);
      res.status(201).json({ success: true, message: 'Farm document submitted for review.', data: document });
    } catch (error) {
      next(error);
    }
  };

  getFarmDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const documents = await this.farmsService.getDocuments(req.user!.userId, req.params.farmId as string);
      res.json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  };

}
