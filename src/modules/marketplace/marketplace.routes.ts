import { Router } from 'express';
import { MarketplaceController } from './marketplace.controller';
import { createListingSchema, updateListingSchema, listingIdParamSchema } from './marketplace.validation';
import validate from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const controller = new MarketplaceController();

// Mounted at /api/v1/crops/:cropId/listings — needs mergeParams to see :cropId
export const nestedListingRoutes = Router({ mergeParams: true });
nestedListingRoutes.use(protect, restrictTo(UserRole.FARMER));
nestedListingRoutes.post('/', validate(createListingSchema), controller.createListing);

// Mounted at /api/v1/listings — mixed public/protected
export const listingRoutes = Router();

// Static paths MUST come before dynamic /:id, or Express matches
// "mine" as if it were an :id value.
listingRoutes.get('/mine', protect, restrictTo(UserRole.FARMER), controller.getMyListings);
listingRoutes.get('/', controller.browseListings);
listingRoutes.get('/:id/contact', protect, restrictTo(UserRole.BUYER), validate(listingIdParamSchema), controller.getNegotiationContact);
listingRoutes.get('/:id', validate(listingIdParamSchema), controller.getListingDetails);
listingRoutes.patch('/:id', protect, restrictTo(UserRole.FARMER), validate(updateListingSchema), controller.updateListing);
