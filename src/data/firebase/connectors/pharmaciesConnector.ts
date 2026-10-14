import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAt,
  endAt,
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants/collections';
import { AppError } from '../../../core/errors/AppError';
import { GeoCoordinate } from '../../../core/types/geo';
import { Pharmacy, PharmacyStaff } from '../../../domain/entities/Pharmacy';
import { getFirebase } from '../FirebaseClient';
import { distanceKm, geoQueryBounds, toGeoIndexed } from '../geo';
import { pharmacyFromDoc } from '../mappers';
import { PharmacyDoc } from '../schema';

export async function getPharmacyById(pharmacyId: string): Promise<Pharmacy> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.pharmacies, pharmacyId));
  if (!snap.exists()) {
    throw new AppError('not-found', 'Pharmacy was not found.');
  }
  return pharmacyFromDoc(snap.id, snap.data() as PharmacyDoc);
}

export async function createPharmacy(
  input: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Pharmacy> {
  const { db } = getFirebase();
  const location = toGeoIndexed(input.location);
  const payload = {
    name: input.name,
    pcnLicenseNumber: input.pcnLicenseNumber,
    ownerId: input.ownerId,
    phoneE164: input.phoneE164,
    email: input.email,
    address: { ...input.address, country: 'NG' as const },
    location: { latitude: location.latitude, longitude: location.longitude },
    geohash: location.geohash,
    verificationStatus: input.verificationStatus,
    isActive: input.isActive,
    deliveryEnabled: input.deliveryEnabled,
    pickupEnabled: input.pickupEnabled,
    deliveryRadiusKm: input.deliveryRadiusKm,
    ratingAvg: input.ratingAvg,
    reviewCount: input.reviewCount,
    operatingHours: input.operatingHours,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.pharmacies), payload);
  await setDoc(doc(db, COLLECTIONS.pharmacies, ref.id, COLLECTIONS.staff, input.ownerId), {
    role: 'admin',
    invitedAt: serverTimestamp(),
  });
  return getPharmacyById(ref.id);
}

export async function searchNearbyPharmacies(
  center: GeoCoordinate,
  radiusKm: number,
): Promise<Pharmacy[]> {
  const { db } = getFirebase();
  const bounds = geoQueryBounds(center, radiusKm);
  const snaps = await Promise.all(
    bounds.map(([start, end]) =>
      getDocs(
        query(
          collection(db, COLLECTIONS.pharmacies),
          where('isActive', '==', true),
          orderBy('geohash'),
          startAt(start),
          endAt(end),
        ),
      ),
    ),
  );

  const seen = new Map<string, Pharmacy>();
  snaps.forEach((snap) => {
    snap.docs.forEach((item) => {
      const pharmacy = pharmacyFromDoc(item.id, item.data() as PharmacyDoc);
      const km = distanceKm(center, pharmacy.location);
      if (km <= radiusKm) {
        seen.set(pharmacy.id, pharmacy);
      }
    });
  });
  return [...seen.values()];
}

export async function addPharmacyStaff(staff: PharmacyStaff): Promise<void> {
  const { db } = getFirebase();
  await setDoc(doc(db, COLLECTIONS.pharmacies, staff.pharmacyId, COLLECTIONS.staff, staff.userId), {
    role: staff.role,
    invitedAt: serverTimestamp(),
  });
}
