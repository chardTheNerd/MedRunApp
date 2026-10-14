import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants/collections';
import { AppError } from '../../../core/errors/AppError';
import { Order, OrderStatus } from '../../../domain/entities/Order';
import { PlaceOrderInput } from '../../../domain/repositories/OrderRepository';
import { getFirebase } from '../FirebaseClient';
import { orderFromDoc } from '../mappers';
import { ListingDoc, OrderDoc } from '../schema';

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const { db } = getFirebase();
  const orderRef = doc(collection(db, COLLECTIONS.orders));

  await runTransaction(db, async (tx) => {
    for (const item of input.items) {
      const listingRef = doc(db, COLLECTIONS.listings, item.listingId);
      const listingSnap = await tx.get(listingRef);
      if (!listingSnap.exists()) {
        throw new AppError('not-found', `Listing ${item.listingId} was not found.`);
      }
      const listing = listingSnap.data() as ListingDoc;
      if (listing.pharmacyId !== input.pharmacyId) {
        throw new AppError('validation', 'Every item must belong to the same pharmacy.');
      }
      if (!listing.isAvailable || listing.quantity < item.quantity) {
        throw new AppError('conflict', `${listing.brandName} is out of stock.`);
      }
      const nextQty = listing.quantity - item.quantity;
      tx.update(listingRef, {
        quantity: nextQty,
        isAvailable: nextQty > 0,
        updatedAt: serverTimestamp(),
      });
    }

    tx.set(orderRef, {
      patientId: input.patientId,
      pharmacyId: input.pharmacyId,
      items: input.items,
      subtotalKobo: input.subtotalKobo,
      deliveryFeeKobo: input.deliveryFeeKobo,
      totalKobo: input.totalKobo,
      currency: 'NGN',
      fulfillment: input.fulfillment,
      deliveryAddress: input.deliveryAddress,
      status: input.status ?? 'pending',
      payment: input.payment,
      notes: input.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return getOrderById(orderRef.id);
}

export async function getOrderById(orderId: string): Promise<Order> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.orders, orderId));
  if (!snap.exists()) {
    throw new AppError('not-found', 'Order was not found.');
  }
  return orderFromDoc(snap.id, snap.data() as OrderDoc);
}

export async function listOrdersForPatient(patientId: string): Promise<Order[]> {
  const { db } = getFirebase();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.orders),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((item) => orderFromDoc(item.id, item.data() as OrderDoc));
}

export async function listOrdersForPharmacy(pharmacyId: string): Promise<Order[]> {
  const { db } = getFirebase();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.orders),
      where('pharmacyId', '==', pharmacyId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((item) => orderFromDoc(item.id, item.data() as OrderDoc));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const { db } = getFirebase();
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
  return getOrderById(orderId);
}
