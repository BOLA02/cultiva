import { MarketplaceRepository } from './marketplace.repository';
import { prisma } from '../../config/db';
import { AppError } from '../../common/AppError';
import { HttpStatus } from '../../common/http-status';
import { getPaginationParams, buildPaginationMeta, PaginationParams } from '../../utils/pagination';
import { DEFAULT_LISTING_CURRENCY, DEFAULT_MINIMUM_ORDER_QTY } from './marketplace.constants';
import { FarmStatus, Listing, ListingStatus } from '@prisma/client';
import { assertCropOwnership } from '../../common/ownership';

export class MarketplaceService {
  private marketplaceRepository: MarketplaceRepository;

  constructor() {
    this.marketplaceRepository = new MarketplaceRepository();
  }

  /**
   * Verifies the requesting user owns the crop (via farm → farmerProfile)
   * before allowing a listing to be created for it.
   */
  async createListing(userId: string, cropId: string, input: any): Promise<Listing> {
    const crop = await assertCropOwnership(userId, cropId);
    if (crop.farm.status !== FarmStatus.VERIFIED) {
      throw new AppError('This farm must be verified before its crops can be listed on the marketplace.', HttpStatus.FORBIDDEN);
    }

    const listingData = {
      cropId,
      title: input.title,
      description: input.description,
      pricePerUnit: input.pricePerUnit,
      currency: input.currency || DEFAULT_LISTING_CURRENCY,
      unitType: input.unitType,
      availableQty: input.availableQty,
      minimumOrderQty: input.minimumOrderQty || DEFAULT_MINIMUM_ORDER_QTY,
      negotiable: input.negotiable ?? false,
    };

    return this.marketplaceRepository.create(listingData);
  }

  /**
   * Public browse endpoint — only ever returns ACTIVE listings, paginated.
   */
  async browseActiveListings(paginationInput: PaginationParams) {
    const { page, limit, skip, take } = getPaginationParams(paginationInput);

    const { data, total } = await this.marketplaceRepository.findActivePaginated(skip, take);
    const meta = buildPaginationMeta(total, page, limit);

    return { data, meta };
  }

  /**
   * Fetches a single listing. ACTIVE/SOLD/EXPIRED listings are visible to
   * anyone. DRAFT listings are only visible to the owning farmer — anyone
   * else gets a 404, not a 403, to avoid confirming a draft's existence.
   */
  async getListingById(requestingUserId: string | null, listingId: string): Promise<Listing> {
    const listing = await this.marketplaceRepository.findByIdWithOwnership(listingId);

    if (!listing) {
      throw new AppError('The requested listing could not be found.', HttpStatus.NOT_FOUND);
    }

    const isOwner = requestingUserId !== null && listing.crop.farm.farmerProfile.userId === requestingUserId;

    if (listing.status === ListingStatus.DRAFT && !isOwner) {
      throw new AppError('The requested listing could not be found.', HttpStatus.NOT_FOUND);
    }

    return listing;
  }

  /**
   * Updates a listing after verifying ownership through the full chain
   * (listing → crop → farm → farmerProfile → user).
   */
  async updateListing(userId: string, listingId: string, input: any): Promise<Listing> {
    const listing = await this.marketplaceRepository.findByIdWithOwnership(listingId);

    if (!listing) {
      throw new AppError('The requested listing could not be found.', HttpStatus.NOT_FOUND);
    }

    if (listing.crop.farm.farmerProfile.userId !== userId) {
      throw new AppError('Unauthorized. You do not own this listing.', HttpStatus.FORBIDDEN);
    }

    if (input.status === ListingStatus.ACTIVE && listing.crop.farm.status !== FarmStatus.VERIFIED) {
      throw new AppError('Only listings from verified farms can be published.', HttpStatus.FORBIDDEN);
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.pricePerUnit !== undefined) updateData.pricePerUnit = input.pricePerUnit;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.unitType !== undefined) updateData.unitType = input.unitType;
    if (input.availableQty !== undefined) updateData.availableQty = input.availableQty;
    if (input.minimumOrderQty !== undefined) updateData.minimumOrderQty = input.minimumOrderQty;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.negotiable !== undefined) updateData.negotiable = input.negotiable;

    return this.marketplaceRepository.update(listingId, updateData);
  }

  async getMyListings(userId: string) {
  return this.marketplaceRepository.findByFarmerId(userId);
}

  async getNegotiationContact(listingId: string) {
    const listing = await this.marketplaceRepository.findContactByListingId(listingId);
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new AppError('The requested listing could not be found.', HttpStatus.NOT_FOUND);
    }
    const farm = listing.crop.farm;
    const farmer = farm.farmerProfile.user;
    return {
      farmName: farm.name,
      farmer: { id: farmer.id, name: `${farmer.firstName} ${farmer.lastName}`, email: farmer.email, phone: farmer.phone },
    };
  }
}
