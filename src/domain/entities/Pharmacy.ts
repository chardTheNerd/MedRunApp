import { NigerianState } from '../../core/config/nigeria';
import { GeoIndexedLocation } from '../../core/types/geo';

export type PharmacyVerification = 'pending' | 'verified' | 'rejected';
export type StaffRole = 'admin' | 'pharmacist';

export type DayHours = { open: string; close: string } | null;

export type OperatingHours = {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
};

export type PharmacyAddress = {
  street: string;
  city: string;
  lga: string;
  state: NigerianState;
  country: 'NG';
};

export type Pharmacy = {
  id: string;
  name: string;
  pcnLicenseNumber: string;
  ownerId: string;
  phoneE164: string;
  email: string | null;
  address: PharmacyAddress;
  location: GeoIndexedLocation;
  verificationStatus: PharmacyVerification;
  isActive: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryRadiusKm: number;
  ratingAvg: number;
  reviewCount: number;
  operatingHours: OperatingHours;
  createdAt: Date;
  updatedAt: Date;
};

export type PharmacyStaff = {
  userId: string;
  pharmacyId: string;
  role: StaffRole;
};
