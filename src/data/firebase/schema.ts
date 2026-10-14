import { Timestamp } from 'firebase/firestore';
import { NigerianState } from '../../core/config/nigeria';
import { ConsultationChannel, ConsultationStatus } from '../../domain/entities/Consultation';
import { DosageForm } from '../../domain/entities/Medicine';
import { FulfillmentType, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '../../domain/entities/Order';
import { OperatingHours, PharmacyVerification, StaffRole } from '../../domain/entities/Pharmacy';
import { DeliveryAddress, UserRole } from '../../domain/entities/User';

/**
 * Firestore DTO shapes. Money is stored as integer kobo.
 * Pharmacy and listing documents denormalize GeoPoint + geohash for radius search.
 */
export type UserDoc = {
  role: UserRole;
  displayName: string;
  email: string | null;
  phoneE164: string | null;
  photoUrl: string | null;
  locale: 'en-NG';
  addresses: DeliveryAddress[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type PharmacyDoc = {
  name: string;
  pcnLicenseNumber: string;
  ownerId: string;
  phoneE164: string;
  email: string | null;
  address: {
    street: string;
    city: string;
    lga: string;
    state: NigerianState;
    country: 'NG';
  };
  location: { latitude: number; longitude: number };
  geohash: string;
  verificationStatus: PharmacyVerification;
  isActive: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryRadiusKm: number;
  ratingAvg: number;
  reviewCount: number;
  operatingHours: OperatingHours;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type StaffDoc = {
  role: StaffRole;
  invitedAt: Timestamp;
};

export type MedicineDoc = {
  genericName: string;
  brandNames: string[];
  form: DosageForm;
  strength: string;
  prescriptionRequired: boolean;
  nafdacNumbers: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ListingDoc = {
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
  expiryDate: Timestamp | null;
  location: { latitude: number; longitude: number };
  geohash: string;
  state: NigerianState;
  lga: string;
  city: string;
  isAvailable: boolean;
  updatedAt: Timestamp;
};

export type OrderDoc = {
  patientId: string;
  pharmacyId: string;
  items: OrderItem[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  currency: 'NGN';
  fulfillment: FulfillmentType;
  deliveryAddress: DeliveryAddress | null;
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    reference: string | null;
  };
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ConsultationDoc = {
  patientId: string;
  consultantId: string | null;
  pharmacyId: string | null;
  channel: ConsultationChannel;
  status: ConsultationStatus;
  chiefComplaint: string;
  prescriptionIssued: boolean;
  relatedOrderId: string | null;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type MessageDoc = {
  senderId: string;
  body: string;
  createdAt: Timestamp;
};
