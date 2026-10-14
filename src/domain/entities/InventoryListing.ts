import { NigerianState } from '../../core/config/nigeria';
import { GeoIndexedLocation } from '../../core/types/geo';
import { DosageForm } from './Medicine';

export type InventoryListing = {
  id: string;
  pharmacyId: string;
  medicineId: string;
  brandName: string;
  genericName: string;
  form: DosageForm;
  strength: string;
  nafdacNumber: string | null;
  packSize: string;
  quantity: number;
  priceKobo: number;
  currency: 'NGN';
  prescriptionRequired: boolean;
  expiryDate: Date | null;
  location: GeoIndexedLocation;
  state: NigerianState;
  lga: string;
  city: string;
  isAvailable: boolean;
  distanceKm?: number;
  updatedAt: Date;
};
