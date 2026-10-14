import { GeoCoordinate } from '../../core/types/geo';
import { Result } from '../../core/types/result';
import { Pharmacy, PharmacyStaff } from '../../domain/entities/Pharmacy';
import { PharmacyRepository } from '../../domain/repositories/PharmacyRepository';
import {
  addPharmacyStaff,
  createPharmacy,
  getPharmacyById,
  searchNearbyPharmacies,
} from '../supabase/connectors/pharmaciesConnector';
import { wrap } from '../supabase/wrap';

export class PharmacyRepositoryImpl implements PharmacyRepository {
  getById(pharmacyId: string): Promise<Result<Pharmacy>> {
    return wrap(() => getPharmacyById(pharmacyId));
  }

  searchNearby(center: GeoCoordinate, radiusKm: number): Promise<Result<Pharmacy[]>> {
    return wrap(() => searchNearbyPharmacies(center, radiusKm));
  }

  create(pharmacy: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Pharmacy>> {
    return wrap(() => createPharmacy(pharmacy));
  }

  addStaff(staff: PharmacyStaff): Promise<Result<void>> {
    return wrap(() => addPharmacyStaff(staff));
  }
}
