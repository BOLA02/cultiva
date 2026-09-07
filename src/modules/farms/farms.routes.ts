import { Router } from 'express';
import { FarmsController } from './farms.controller';
import { createFarmSchema, createFarmDocumentSchema, farmIdSchema } from './farms.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware'; // Adjust import name matching your exact auth shield function
import { restrictTo } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';
import { nestedCropRoutes } from '../crops';
const router = Router();
const controller = new FarmsController();

router.use(protect, restrictTo(UserRole.FARMER));


router.post(
  '/', 
  validate(createFarmSchema), 
  controller.createFarm
);

// 2. Fetch the logged-in farmer's collection of lands
router.get(
  '/my-farms', 
  controller.getFarmerFarms
);

// 3. View extended details of a single farm by its UUID
router.get(
  '/:id', 
  controller.getFarmDetails
);

router.get('/:farmId/documents', validate(farmIdSchema), controller.getFarmDocuments);
router.post('/:farmId/documents', validate(createFarmDocumentSchema), controller.createFarmDocument);


// ...
router.use('/:farmId/crops', nestedCropRoutes);
export default router;
