import { Consultation, ConsultationMessage } from '../../domain/entities/Consultation';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Medicine } from '../../domain/entities/Medicine';
import { Order } from '../../domain/entities/Order';
import { Pharmacy } from '../../domain/entities/Pharmacy';
import { DeliveryAddress, User } from '../../domain/entities/User';
import { ConsultationMessageRow, ConsultationRow, OrderRow, PharmacyRow } from './rows';
import { toKobo, toNumber } from './coerce';

/* ---------- Pharmacies ---------- */

export function pharmacyFromRow(row: PharmacyRow): Pharmacy {
  return {
    id: row.id,
    name: row.name,
    pcnLicenseNumber: row.pcn_license_number,
    ownerId: row.owner_id,
    phoneE164: row.phone_e164,
    email: row.email,
    address: row.address,
    location: { latitude: toNumber(row.latitude), longitude: toNumber(row.longitude), geohash: row.geohash },
    verificationStatus: row.verification_status,
    isActive: row.is_active,
    deliveryEnabled: row.delivery_enabled,
    pickupEnabled: row.pickup_enabled,
    deliveryRadiusKm: toNumber(row.delivery_radius_km),
    ratingAvg: toNumber(row.rating_avg),
    reviewCount: toNumber(row.review_count),
    operatingHours: row.operating_hours,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/* ---------- Listings and medicines ---------- */

export type ListingRow = {
  id: string; pharmacy_id: string; medicine_id: string; brand_name: string; generic_name: string;
  form: string | null; strength: string | null; nafdac_number: string | null; pack_size: string | null;
  quantity: number | string; price_kobo: number | string; prescription_required: boolean;
  expiry_date: string | null; latitude: number | string; longitude: number | string; geohash: string;
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
    quantity: toNumber(r.quantity),
    priceKobo: toKobo(r.price_kobo),
    currency: 'NGN',
    prescriptionRequired: r.prescription_required,
    expiryDate: r.expiry_date ? new Date(r.expiry_date) : null,
    location: { latitude: toNumber(r.latitude), longitude: toNumber(r.longitude), geohash: r.geohash },
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

/* ---------- Orders ---------- */

export function orderFromRow(r: OrderRow): Order {
  return {
    id: r.id,
    patientId: r.patient_id,
    pharmacyId: r.pharmacy_id,
    items: r.items,
    subtotalKobo: toKobo(r.subtotal_kobo),
    deliveryFeeKobo: toKobo(r.delivery_fee_kobo),
    totalKobo: toKobo(r.total_kobo),
    currency: 'NGN',
    fulfillment: r.fulfillment,
    deliveryAddress: r.delivery_address,
    status: r.status,
    payment: r.payment,
    notes: r.notes,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

/* ---------- Consultations ---------- */

export function consultationFromRow(r: ConsultationRow): Consultation {
  return {
    id: r.id,
    patientId: r.patient_id,
    consultantId: r.consultant_id,
    pharmacyId: r.pharmacy_id,
    channel: r.channel,
    status: r.status,
    chiefComplaint: r.chief_complaint,
    prescriptionIssued: r.prescription_issued,
    relatedOrderId: r.related_order_id,
    startedAt: r.started_at ? new Date(r.started_at) : null,
    endedAt: r.ended_at ? new Date(r.ended_at) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export function messageFromRow(r: ConsultationMessageRow): ConsultationMessage {
  return {
    id: r.id,
    consultationId: r.consultation_id,
    senderId: r.sender_id,
    body: r.body,
    createdAt: new Date(r.created_at),
  };
}
