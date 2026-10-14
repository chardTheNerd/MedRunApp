import { Timestamp } from 'firebase/firestore';
import { Consultation, ConsultationMessage } from '../../domain/entities/Consultation';
import { InventoryListing } from '../../domain/entities/InventoryListing';
import { Medicine } from '../../domain/entities/Medicine';
import { Order } from '../../domain/entities/Order';
import { Pharmacy } from '../../domain/entities/Pharmacy';
import { User } from '../../domain/entities/User';
import {
  ConsultationDoc,
  ListingDoc,
  MedicineDoc,
  MessageDoc,
  OrderDoc,
  PharmacyDoc,
  UserDoc,
} from './schema';

const toDate = (value: Timestamp | Date | null | undefined): Date => {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return value;
  }
  return value.toDate();
};

export function userFromDoc(id: string, data: UserDoc): User {
  return {
    id,
    role: data.role,
    displayName: data.displayName,
    email: data.email,
    phoneE164: data.phoneE164,
    photoUrl: data.photoUrl,
    locale: 'en-NG',
    addresses: data.addresses ?? [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function pharmacyFromDoc(id: string, data: PharmacyDoc): Pharmacy {
  return {
    id,
    name: data.name,
    pcnLicenseNumber: data.pcnLicenseNumber,
    ownerId: data.ownerId,
    phoneE164: data.phoneE164,
    email: data.email,
    address: data.address,
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      geohash: data.geohash,
    },
    verificationStatus: data.verificationStatus,
    isActive: data.isActive,
    deliveryEnabled: data.deliveryEnabled,
    pickupEnabled: data.pickupEnabled,
    deliveryRadiusKm: data.deliveryRadiusKm,
    ratingAvg: data.ratingAvg,
    reviewCount: data.reviewCount,
    operatingHours: data.operatingHours,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function medicineFromDoc(id: string, data: MedicineDoc): Medicine {
  return {
    id,
    genericName: data.genericName,
    brandNames: data.brandNames ?? [],
    form: data.form,
    strength: data.strength,
    prescriptionRequired: data.prescriptionRequired,
    nafdacNumbers: data.nafdacNumbers ?? [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function listingFromDoc(id: string, data: ListingDoc): InventoryListing {
  return {
    id,
    pharmacyId: data.pharmacyId,
    medicineId: data.medicineId,
    brandName: data.brandName,
    genericName: data.genericName,
    form: data.form,
    strength: data.strength,
    nafdacNumber: data.nafdacNumber,
    packSize: data.packSize,
    quantity: data.quantity,
    priceKobo: data.priceKobo,
    currency: 'NGN',
    prescriptionRequired: data.prescriptionRequired,
    expiryDate: data.expiryDate ? toDate(data.expiryDate) : null,
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      geohash: data.geohash,
    },
    state: data.state,
    lga: data.lga,
    city: data.city,
    isAvailable: data.isAvailable,
    updatedAt: toDate(data.updatedAt),
  };
}

export function orderFromDoc(id: string, data: OrderDoc): Order {
  return {
    id,
    patientId: data.patientId,
    pharmacyId: data.pharmacyId,
    items: data.items,
    subtotalKobo: data.subtotalKobo,
    deliveryFeeKobo: data.deliveryFeeKobo,
    totalKobo: data.totalKobo,
    currency: 'NGN',
    fulfillment: data.fulfillment,
    deliveryAddress: data.deliveryAddress,
    status: data.status,
    payment: data.payment,
    notes: data.notes,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function consultationFromDoc(id: string, data: ConsultationDoc): Consultation {
  return {
    id,
    patientId: data.patientId,
    consultantId: data.consultantId,
    pharmacyId: data.pharmacyId,
    channel: data.channel,
    status: data.status,
    chiefComplaint: data.chiefComplaint,
    prescriptionIssued: data.prescriptionIssued,
    relatedOrderId: data.relatedOrderId,
    startedAt: data.startedAt ? toDate(data.startedAt) : null,
    endedAt: data.endedAt ? toDate(data.endedAt) : null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function messageFromDoc(
  id: string,
  consultationId: string,
  data: MessageDoc,
): ConsultationMessage {
  return {
    id,
    consultationId,
    senderId: data.senderId,
    body: data.body,
    createdAt: toDate(data.createdAt),
  };
}
