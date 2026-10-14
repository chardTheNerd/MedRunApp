import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants/collections';
import { AppError } from '../../../core/errors/AppError';
import { DeliveryAddress, User } from '../../../domain/entities/User';
import { getFirebase } from '../FirebaseClient';
import { userFromDoc } from '../mappers';
import { UserDoc } from '../schema';
import { fetchUserProfile } from './authConnector';

export async function getUserById(userId: string): Promise<User> {
  const profile = await fetchUserProfile(userId);
  if (!profile) {
    throw new AppError('not-found', 'User was not found.');
  }
  return profile;
}

export async function upsertUserProfile(user: User): Promise<User> {
  const { db } = getFirebase();
  const ref = doc(db, COLLECTIONS.users, user.id);
  const existing = await getDoc(ref);
  const payload = {
    role: user.role,
    displayName: user.displayName,
    email: user.email,
    phoneE164: user.phoneE164,
    photoUrl: user.photoUrl,
    locale: 'en-NG' as const,
    addresses: user.addresses,
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
  };
  await setDoc(ref, payload, { merge: true });
  return getUserById(user.id);
}

export async function saveUserAddress(userId: string, address: DeliveryAddress): Promise<User> {
  const { db } = getFirebase();
  const ref = doc(db, COLLECTIONS.users, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new AppError('not-found', 'User was not found.');
  }
  const data = snap.data() as UserDoc;
  const rest = (data.addresses ?? []).filter((item) => item.id !== address.id);
  const addresses = address.isDefault
    ? [address, ...rest.map((item) => ({ ...item, isDefault: false }))]
    : [...rest, address];
  await updateDoc(ref, { addresses, updatedAt: serverTimestamp() });
  return userFromDoc(snap.id, { ...data, addresses });
}
