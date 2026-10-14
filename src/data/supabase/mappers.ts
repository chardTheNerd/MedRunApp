import { NigerianState } from '../../core/config/nigeria';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Medicine } from '../../domain/entities/Medicine';
import { OperatingHours, Pharmacy, PharmacyVerification } from '../../domain/entities/Pharmacy';
import { DeliveryAddress, User } from '../../domain/entities/User';

/* ---------- Pharmacies ---------- */

export type PharmacyRow = {
  id: string;
  owner_id: string | null;
  name: string;
  pcn_license_number: string;
  phone_e164: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  lga: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  verification_status: string;
  is_active: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_radius_km: number | string;
  rating_avg: number | string;
  review_count: number;
  operating_hours: unknown;
  created_at: string;
  updated_at: string;
};

export function pharmacyFromRow(row: PharmacyRow): Pharmacy {
  return {
    id: row.id,
    name: row.name,
    pcnLicenseNumber: row.pcn_license_number,
    ownerId: row.owner_id ?? '',
    phoneE164: row.phone_e164 ?? '',
    email: row.email,
    address: {
      street: row.street ?? '',
      city: row.city ?? '',
      lga: row.lga ?? '',
      state: row.state as NigerianState,
      country: 'NG',
    },
    location: { latitude: row.latitude, longitude: row.longitude },
    verificationStatus: row.verification_status as PharmacyVerification,
    isActive: row.is_active,
    deliveryEnabled: row.delivery_enabled,
    pickupEnabled: row.pickup_enabled,
    deliveryRadiusKm: Number(row.delivery_radius_km),
    ratingAvg: Number(row.rating_avg),
    reviewCount: row.review_count,
    operatingHours: row.operating_hours as OperatingHours,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/* ---------- Listings and medicines ---------- */

export type ListingRow = {
  id: string; pharmacy_id: string; medicine_id: string; brand_name: string; generic_name: string;
  form: string | null; strength: string | null; nafdac_number: string | null; pack_size: string | null;
  quantity: number; price_kobo: number | string; prescription_required: boolean;
  expiry_date: string | null; latitude: number; longitude: number;
  state: string | null; lga: string | null; city: string | null; is_available: boolean; updated_at: string;
};

export type MedicineRow = {
  id: string; generic_name: string; brand_names: string[]; form: string | null; strength: string | null;
  prescription_required: boolean; nafdac_numbers: string[]; created_at: string; updated_at: string;
};

export function listingFromRow(r: ListingRow): InventoryListing {
  return {
    id: r.id,
    pharmacyId: r.pharmacy_id,
    medicineId: r.medicine_id,
    brandName: r.brand_name,
    genericName: r.generic_name,
    form: r.form as InventoryListing['form'],
    strength: r.strength ?? '',
    nafdacNumber: r.nafdac_number,
    packSize: r.pack_size ?? '',
    quantity: r.quantity,
    priceKobo: Number(r.price_kobo),
    currency: 'NGN',
    prescriptionRequired: r.prescription_required,
    expiryDate: r.expiry_date ? new Date(r.expiry_date) : null,
    location: { latitude: r.latitude, longitude: r.longitude },
    state: r.state as InventoryListing['state'],
    lga: r.lga ?? '',
    city: r.city ?? '',
    isAvailable: r.is_available,
    updatedAt: new Date(r.updated_at),
  };
}

export function medicineFromRow(r: MedicineRow): Medicine {
  return {
    id: r.id,
    genericName: r.generic_name,
    brandNames: r.brand_names,
    form: r.form as Medicine['form'],
    strength: r.strength ?? '',
    prescriptionRequired: r.prescription_required,
    nafdacNumbers: r.nafdac_numbers,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

/* ---------- Users ---------- */

export type UserRow = {
  id: string; role: string; display_name: string; email: string | null;
  phone_e164: string | null; photo_url: string | null; locale: string;
  addresses: unknown; created_at: string; updated_at: string;
};

export function userFromRow(r: UserRow): User {
  return {
    id: r.id,
    role: r.role as User['role'],
    displayName: r.display_name,
    email: r.email,
    phoneE164: r.phone_e164,
    photoUrl: r.photo_url,
    locale: 'en-NG',
    addresses: (r.addresses as DeliveryAddress[]) ?? [],
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}
