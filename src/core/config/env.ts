import Constants from 'expo-constants';

type Extra = {
  defaultCountry?: string;
  defaultCurrency?: string;
  defaultLocale?: string;
  defaultTimezone?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  locale: {
    country: process.env.EXPO_PUBLIC_DEFAULT_COUNTRY ?? extra.defaultCountry ?? 'NG',
    currency: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY ?? extra.defaultCurrency ?? 'NGN',
    locale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE ?? extra.defaultLocale ?? 'en-NG',
    timezone: process.env.EXPO_PUBLIC_DEFAULT_TIMEZONE ?? extra.defaultTimezone ?? 'Africa/Lagos',
  },
  searchRadiusKm: Number(process.env.EXPO_PUBLIC_SEARCH_RADIUS_KM ?? 8),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabase.url && env.supabase.anonKey);
}

export function isFirebaseConfigured(): boolean {
  return Boolean(env.firebase.apiKey && env.firebase.projectId && env.firebase.appId);
}
