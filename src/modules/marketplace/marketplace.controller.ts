import { Request, Response, NextFunction } from 'express';
import { MarketplaceService } from './marketplace.service';

export class MarketplaceController {
  private marketplaceService: MarketplaceService;

  constructor() {
    this.marketplaceService = new MarketplaceService();
  }

  /**
   * HTTP Handler: POST /api/v1/crops/:cropId/listings
   */
  createListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const cropId = req.params.cropId as string;

      const listing = await this.marketplaceService.createListing(userId, cropId, req.body);

      res.status(201).json({
        success: true,
        message: 'Listing created successfully.',
        data: listing,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: GET /api/v1/listings
   * Public — no authentication required.
   */
  browseListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await this.marketplaceService.browseActiveListings({ page, limit });

      res.status(200).json({
        success: true,
        message: 'Listings retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: GET /api/v1/listings/:id
   * Public, but DRAFT listings only visible to their owner.
   */
  getListingDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestingUserId = req.user?.userId ?? null;
      const id = req.params.id as string;

      const listing = await this.marketplaceService.getListingById(requestingUserId, id);

      res.status(200).json({
        success: true,
        message: 'Listing retrieved successfully.',
        data: listing,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * HTTP Handler: PATCH /api/v1/listings/:id
   */
  updateListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;

      const listing = await this.marketplaceService.updateListing(userId, id, req.body);

      res.status(200).json({
        success: true,
        message: 'Listing updated successfully.',
        data: listing,
      });
    } catch (error: any) {
      next(error);
    }
  };

  getMyListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const listings = await this.marketplaceService.getMyListings(userId);
    res.status(200).json({ success: true, message: 'Your listings retrieved successfully.', data: listings });
  } catch (error: any) {
    next(error);
  }
  };

  getNegotiationContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contact = await this.marketplaceService.getNegotiationContact(req.params.id as string);
      res.status(200).json({ success: true, message: 'Farmer contact retrieved successfully.', data: contact });
    } catch (error) { next(error); }
  };
}
