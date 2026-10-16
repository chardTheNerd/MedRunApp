import { NigerianState } from '../../core/config/nigeria';
import { GeoCoordinate } from '../../core/types/geo';
import { Result } from '../../core/types/result';
import { InventoryListing } from '../entities/InventoryListing';
import { Medicine } from '../entities/Medicine';

export type NearbyListingQuery = {
  center: GeoCoordinate;
  radiusKm: number;
  genericName?: string;
  state?: NigerianState;
};

export interface InventoryRepository {
  searchNearby(query: NearbyListingQuery): Promise<Result<InventoryListing[]>>;
  listByPharmacy(pharmacyId: string): Promise<Result<InventoryListing[]>>;
  upsertListing(
    listing: Omit<InventoryListing, 'id' | 'updatedAt' | 'distanceKm'> & { id?: string },
  ): Promise<Result<InventoryListing>>;
  getMedicine(medicineId: string): Promise<Result<Medicine>>;
  upsertMedicine(medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Medicine>>;
}
