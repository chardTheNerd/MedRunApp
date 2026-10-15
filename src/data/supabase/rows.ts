import { NigerianState } from '../../core/config/nigeria';
import {
  ConsultationChannel,
  ConsultationStatus,
} from '../../domain/entities/Consultation';
import { DosageForm } from '../../domain/entities/Medicine';
import {
  FulfillmentType,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../domain/entities/Order';
import {
  OperatingHours,
  PharmacyAddress,
  PharmacyVerification,
  StaffRole,
} from '../../domain/entities/Pharmacy';
import { DeliveryAddress, UserRole } from '../../domain/entities/User';

/**
 * Supabase row shapes. Columns are snake_case and timestamps are ISO-8601
 * strings. JSONB columns reuse the domain shapes directly.
 *
 * IMPORTANT: PostgREST serializes Postgres `numeric` and `bigint` columns as
 * STRINGS, not numbers. Any future numeric column with those types must be
 * declared `number | string` here so the compiler forces the mapper to coerce
 * it with `toNumber` (see ./coerce) instead of trusting it as a number.
 * Getting this wrong crashes render code (e.g. `.toFixed` on a string).
 */
export type UserRow = {
  id: string;
  role: UserRole;
  display_name: string;
  email: string | null;
  phone_e164: string | null;
  photo_url: string | null;
  locale: 'en-NG';
  addresses: DeliveryAddress[];
  created_at: string;
  updated_at: string;
};

export type PharmacyRow = {
  id: string;
  name: string;
  pcn_license_number: string;
  owner_id: string;
  phone_e164: string;
  email: string | null;
  address: PharmacyAddress;
  latitude: number | string;
  longitude: number | string;
  geohash: string;
  verification_status: PharmacyVerification;
  is_active: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_radius_km: number | string;
  rating_avg: number | string;
  review_count: number | string;
  operating_hours: OperatingHours;
  created_at: string;
  updated_at: string;
};

export type PharmacyStaffRow = {
  pharmacy_id: string;
  user_id: string;
  role: StaffRole;
  invited_at: string;
};

export type MedicineRow = {
  id: string;
  generic_name: string;
  brand_names: string[];
  form: DosageForm;
  strength: string;
  prescription_required: boolean;
  nafdac_numbers: string[];
  created_at: string;
  updated_at: string;
};

export type ListingRow = {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  brand_name: string;
  generic_name: string;
  form: DosageForm;
  strength: string;
  nafdac_number: string | null;
  pack_size: string;
  quantity: number | string;
  price_kobo: number | string;
  currency: 'NGN';
  prescription_required: boolean;
  expiry_date: string | null;
  latitude: number | string;
  longitude: number | string;
  geohash: string;
  state: NigerianState;
  lga: string;
  city: string;
  is_available: boolean;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  patient_id: string;
  pharmacy_id: string;
  items: OrderItem[];
  subtotal_kobo: number | string;
  delivery_fee_kobo: number | string;
  total_kobo: number | string;
  currency: 'NGN';
  fulfillment: FulfillmentType;
  delivery_address: DeliveryAddress | null;
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    reference: string | null;
  };
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ConsultationRow = {
  id: string;
  patient_id: string;
  consultant_id: string | null;
  pharmacy_id: string | null;
  channel: ConsultationChannel;
  status: ConsultationStatus;
  chief_complaint: string;
  prescription_issued: boolean;
  related_order_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ConsultationMessageRow = {
  id: string;
  consultation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
