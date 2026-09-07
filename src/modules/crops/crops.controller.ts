import { Request, Response, NextFunction } from 'express';
import { CropsService } from './crops.service';

export class CropsController {
  private cropsService: CropsService;

  constructor() {
    this.cropsService = new CropsService();
  }


  getCrop = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const crop = await this.cropsService.getCrop(userId, id);

    res.status(200).json({
      success: true,
      message: 'Crop retrieved successfully.',
      data: crop,
    });
  } catch (error: any) {
    next(error);
  }
};
 createCrop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const farmId = req.params.farmId as string;

    const crop = await this.cropsService.registerCrop(userId, farmId, req.body);
    res.status(201).json({ success: true, message: 'Crop registered successfully.', data: crop });
  } catch (error: any) {
    next(error);
  }
};

getFarmCrops = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const farmId = req.params.farmId as string;

    const crops = await this.cropsService.getFarmCrops(userId, farmId);
    res.status(200).json({ success: true, message: 'Crops retrieved successfully.', data: crops });
  } catch (error: any) {
    next(error);
  }
};

uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const image = await this.cropsService.uploadImage(req.user!.userId, req.params.id as string, req.body.imageData);
    res.status(201).json({ success: true, message: 'Crop image uploaded successfully.', data: image });
  } catch (error) { next(error); }
};

updateCrop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const crop = await this.cropsService.updateCrop(userId, id, req.body);
    res.status(200).json({ success: true, message: 'Crop updated successfully.', data: crop });
  } catch (error: any) {
    next(error);
  }
};
deleteCrop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await this.cropsService.deleteCrop(req.user!.userId, req.params.id as string);
    res.status(204).send();
  } catch (error: any) { next(error); }
};
getFarmerCrops = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const crops = await this.cropsService.getFarmerCrops(userId);

    res.status(200).json({
      success: true,
      message: 'Crops retrieved successfully.',
      data: crops,
    });
  } catch (error: any) {
    next(error);
  }
};
}
