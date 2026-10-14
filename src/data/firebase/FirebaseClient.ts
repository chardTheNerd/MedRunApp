import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { env, isFirebaseConfigured } from '../../core/config/env';
import { AppError } from '../../core/errors/AppError';

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

let cached: FirebaseServices | null = null;

const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence?: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
  }
).getReactNativePersistence;

function createAuth(app: FirebaseApp): Auth {
  if (getReactNativePersistence) {
    try {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      return getAuth(app);
    }
  }
  return getAuth(app);
}

export function getFirebase(): FirebaseServices {
  if (!isFirebaseConfigured()) {
    throw new AppError(
      'not-configured',
      'Firebase env values are missing. Copy .env.example to .env and add your project keys.',
    );
  }

  if (cached) {
    return cached;
  }

  const app = getApps().length ? getApp() : initializeApp(env.firebase);
  cached = {
    app,
    auth: createAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return cached;
}

export function tryGetFirebase(): FirebaseServices | null {
  try {
    return getFirebase();
  } catch {
    return null;
  }
}
