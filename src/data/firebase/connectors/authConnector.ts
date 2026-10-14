import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants/collections';
import { AppError } from '../../../core/errors/AppError';
import { RegisterInput } from '../../../domain/repositories/AuthRepository';
import { User } from '../../../domain/entities/User';
import { getFirebase } from '../FirebaseClient';
import { userFromDoc } from '../mappers';
import { UserDoc } from '../schema';

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.users, userId));
  if (!snap.exists()) {
    return null;
  }
  return userFromDoc(snap.id, snap.data() as UserDoc);
}

export async function registerWithEmail(input: RegisterInput): Promise<User> {
  const { auth, db } = getFirebase();
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  await updateProfile(credential.user, { displayName: input.displayName });

  const now = serverTimestamp();
  const payload: Omit<UserDoc, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    role: input.role ?? 'patient',
    displayName: input.displayName,
    email: input.email,
    phoneE164: input.phoneE164,
    photoUrl: credential.user.photoURL,
    locale: 'en-NG',
    addresses: [],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.users, credential.user.uid), payload);
  const created = await fetchUserProfile(credential.user.uid);
  if (!created) {
    throw new AppError('unavailable', 'Account was created but the patient profile could not be loaded.');
  }
  return created;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { auth } = getFirebase();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await fetchUserProfile(credential.user.uid);
  if (!profile) {
    throw new AppError('not-found', 'No patient profile exists for this account.');
  }
  return profile;
}

export async function signOutCurrentUser(): Promise<void> {
  const { auth } = getFirebase();
  await firebaseSignOut(auth);
}

export function observeAuthState(onChange: (user: User | null) => void): () => void {
  const { auth } = getFirebase();
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      onChange(null);
      return;
    }
    const profile = await fetchUserProfile(firebaseUser.uid);
    onChange(profile);
  });
}

export async function currentAuthUser(): Promise<User | null> {
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    return null;
  }
  return fetchUserProfile(auth.currentUser.uid);
}
