import { GeoCoordinate } from '../../core/types/geo';
import { Result } from '../../core/types/result';
import { Pharmacy, PharmacyStaff } from '../entities/Pharmacy';

export interface PharmacyRepository {
  getById(pharmacyId: string): Promise<Result<Pharmacy>>;
  listStaffPharmacies(userId: string): Promise<Result<Pharmacy[]>>;
  searchNearby(center: GeoCoordinate, radiusKm: number): Promise<Result<Pharmacy[]>>;
  create(pharmacy: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Pharmacy>>;
  addStaff(staff: PharmacyStaff): Promise<Result<void>>;
}
