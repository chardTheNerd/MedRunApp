import { NigerianState } from '../../core/config/nigeria';
import { GeoIndexedLocation } from '../../core/types/geo';

export type UserRole = 'patient' | 'pharmacy_admin' | 'pharmacist' | 'consultant';

export type DeliveryAddress = {
  id: string;
  label: string;
  street: string;
  city: string;
  lga: string;
  state: NigerianState;
  country: 'NG';
  location?: GeoIndexedLocation;
  isDefault: boolean;
};

export type User = {
  id: string;
  role: UserRole;
  displayName: string;
  email: string | null;
  phoneE164: string | null;
  photoUrl: string | null;
  locale: 'en-NG';
  addresses: DeliveryAddress[];
  createdAt: Date;
  updatedAt: Date;
};
