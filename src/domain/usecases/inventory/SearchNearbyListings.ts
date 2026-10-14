import { env } from '../../../core/config/env';
import { Result } from '../../../core/types/result';
import { InventoryListing } from '../../entities/InventoryListing';
import { InventoryRepository, NearbyListingQuery } from '../../repositories/InventoryRepository';

export class SearchNearbyListings {
  constructor(private readonly inventory: InventoryRepository) {}

  execute(query: NearbyListingQuery): Promise<Result<InventoryListing[]>> {
    return this.inventory.searchNearby({
      ...query,
      radiusKm: query.radiusKm || env.searchRadiusKm,
    });
  }
}
