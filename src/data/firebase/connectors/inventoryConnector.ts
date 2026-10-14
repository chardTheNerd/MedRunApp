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
import { InventoryListing } from '../../../domain/entities/InventoryListing';
import { Medicine } from '../../../domain/entities/Medicine';
import { NearbyListingQuery } from '../../../domain/repositories/InventoryRepository';
import { getFirebase } from '../FirebaseClient';
import { distanceKm, geoQueryBounds, toGeoIndexed } from '../geo';
import { listingFromDoc, medicineFromDoc } from '../mappers';
import { ListingDoc, MedicineDoc } from '../schema';

export async function searchNearbyListings(input: NearbyListingQuery): Promise<InventoryListing[]> {
  const { db } = getFirebase();
  const bounds = geoQueryBounds(input.center, input.radiusKm);
  const snaps = await Promise.all(
    bounds.map(([start, end]) =>
      getDocs(
        query(
          collection(db, COLLECTIONS.listings),
          where('isAvailable', '==', true),
          orderBy('geohash'),
          startAt(start),
          endAt(end),
        ),
      ),
    ),
  );

  const needle = input.genericName?.trim().toLowerCase();
  const seen = new Map<string, InventoryListing>();
  snaps.forEach((snap) => {
    snap.docs.forEach((item) => {
      const listing = listingFromDoc(item.id, item.data() as ListingDoc);
      const km = distanceKm(input.center, listing.location);
      if (km > input.radiusKm) {
        return;
      }
      if (input.state && listing.state !== input.state) {
        return;
      }
      if (needle && !listing.genericName.toLowerCase().includes(needle) && !listing.brandName.toLowerCase().includes(needle)) {
        return;
      }
      seen.set(listing.id, { ...listing, distanceKm: km });
    });
  });

  return [...seen.values()].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.priceKobo - b.priceKobo);
}

export async function listPharmacyInventory(pharmacyId: string): Promise<InventoryListing[]> {
  const { db } = getFirebase();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.listings), where('pharmacyId', '==', pharmacyId)),
  );
  return snap.docs.map((item) => listingFromDoc(item.id, item.data() as ListingDoc));
}

export async function upsertListing(
  listing: Omit<InventoryListing, 'id' | 'updatedAt' | 'distanceKm'> & { id?: string },
): Promise<InventoryListing> {
  const { db } = getFirebase();
  const location = toGeoIndexed(listing.location);
  const payload = {
    pharmacyId: listing.pharmacyId,
    medicineId: listing.medicineId,
    brandName: listing.brandName,
    genericName: listing.genericName,
    form: listing.form,
    strength: listing.strength,
    nafdacNumber: listing.nafdacNumber,
    packSize: listing.packSize,
    quantity: listing.quantity,
    priceKobo: listing.priceKobo,
    currency: 'NGN' as const,
    prescriptionRequired: listing.prescriptionRequired,
    expiryDate: listing.expiryDate,
    location: { latitude: location.latitude, longitude: location.longitude },
    geohash: location.geohash,
    state: listing.state,
    lga: listing.lga,
    city: listing.city,
    isAvailable: listing.isAvailable && listing.quantity > 0,
    updatedAt: serverTimestamp(),
  };

  const listingId = listing.id;
  if (listingId) {
    await setDoc(doc(db, COLLECTIONS.listings, listingId), payload, { merge: true });
    const snap = await getDoc(doc(db, COLLECTIONS.listings, listingId));
    return listingFromDoc(snap.id, snap.data() as ListingDoc);
  }

  const ref = await addDoc(collection(db, COLLECTIONS.listings), payload);
  const snap = await getDoc(ref);
  return listingFromDoc(snap.id, snap.data() as ListingDoc);
}

export async function getMedicineById(medicineId: string): Promise<Medicine> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.medicines, medicineId));
  if (!snap.exists()) {
    throw new AppError('not-found', 'Medicine was not found.');
  }
  return medicineFromDoc(snap.id, snap.data() as MedicineDoc);
}

export async function upsertMedicine(
  medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Medicine> {
  const { db } = getFirebase();
  const payload = {
    ...medicine,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.medicines), payload);
  const snap = await getDoc(ref);
  return medicineFromDoc(snap.id, snap.data() as MedicineDoc);
}
