import { Result } from '../../core/types/result';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Medicine } from '../../domain/entities/Medicine';
import { InventoryRepository, NearbyListingQuery } from '../../domain/repositories/InventoryRepository';
import {
  getMedicineById,
  listPharmacyInventory,
  searchNearbyListings,
  upsertListing,
  upsertMedicine,
} from '../supabase/connectors/inventoryConnector';
import { wrap } from '../supabase/wrap';

export class InventoryRepositoryImpl implements InventoryRepository {
  searchNearby(query: NearbyListingQuery): Promise<Result<InventoryListing[]>> {
    return wrap(() => searchNearbyListings(query));
  }

  listByPharmacy(pharmacyId: string): Promise<Result<InventoryListing[]>> {
    return wrap(() => listPharmacyInventory(pharmacyId));
  }

  upsertListing(
    listing: Omit<InventoryListing, 'id' | 'updatedAt' | 'distanceKm'>,
  ): Promise<Result<InventoryListing>> {
    return wrap(() => upsertListing(listing));
  }

  getMedicine(medicineId: string): Promise<Result<Medicine>> {
    return wrap(() => getMedicineById(medicineId));
  }

  upsertMedicine(medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Medicine>> {
    return wrap(() => upsertMedicine(medicine));
  }
}
