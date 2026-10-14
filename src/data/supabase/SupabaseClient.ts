import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../../core/config/env';
import { AppError } from '../../core/errors/AppError';
import { Database } from './Database';

let cached: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      'not-configured',
      'Supabase env values are missing. Copy .env.example to .env and add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  if (cached) {
    return cached;
  }

  cached = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

export function tryGetSupabase(): SupabaseClient<Database> | null {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}
