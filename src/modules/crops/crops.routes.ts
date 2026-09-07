import { Router } from 'express';
import { CropsController } from './crops.controller';
import { createCropImageSchema, createCropSchema, updateCropSchema } from './crops.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';
// import { nestedListingRoutes } from '../marketplace';
const controller = new CropsController();

// Mounted at /api/v1/farms/:farmId/crops — needs mergeParams to see :farmId
export const nestedCropRoutes = Router({ mergeParams: true });
nestedCropRoutes.use(protect, restrictTo(UserRole.FARMER));
nestedCropRoutes.post('/', validate(createCropSchema), controller.createCrop);
nestedCropRoutes.get('/', controller.getFarmCrops);
// nestedCropRoutes.use('/:cropId/listings', nestedListingRoutes);

// Mounted at /api/v1/crops — flat, for single-resource operations
export const cropRoutes = Router();

cropRoutes.use(protect, restrictTo(UserRole.FARMER));

cropRoutes.get('/', controller.getFarmerCrops);

cropRoutes.get('/:id', controller.getCrop);

cropRoutes.post('/:id/images', validate(createCropImageSchema), controller.uploadImage);

cropRoutes.patch(
  '/:id',
  validate(updateCropSchema),
  controller.updateCrop
);

cropRoutes.delete('/:id', controller.deleteCrop);
