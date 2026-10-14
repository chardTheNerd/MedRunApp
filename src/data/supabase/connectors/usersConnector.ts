import { AppError } from '../../../core/errors/AppError';
import { DeliveryAddress, User } from '../../../domain/entities/User';
import { getSupabase } from '../SupabaseClient';
import { throwIfError } from '../errors';
import { userFromRow } from '../mappers';
import { UserRow } from '../rows';
import { TABLES } from '../tables';
import { fetchUserProfile } from './authConnector';

export async function getUserById(userId: string): Promise<User> {
  const profile = await fetchUserProfile(userId);
  if (!profile) {
    throw new AppError('not-found', 'User was not found.');
  }
  return profile;
}

export async function upsertUserProfile(user: User): Promise<User> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLES.users).upsert(
    {
      id: user.id,
      role: user.role,
      display_name: user.displayName,
      email: user.email,
      phone_e164: user.phoneE164,
      photo_url: user.photoUrl,
      locale: 'en-NG',
      addresses: user.addresses,
      created_at: user.createdAt.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  throwIfError(error);
  return getUserById(user.id);
}

export async function saveUserAddress(userId: string, address: DeliveryAddress): Promise<User> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.users)
    .select('*')
    .eq('id', userId)
    .single();
  throwIfError(error, 'User was not found.');

  const row = data as UserRow;
  const rest = (row.addresses ?? []).filter((item) => item.id !== address.id);
  const addresses = address.isDefault
    ? [address, ...rest.map((item) => ({ ...item, isDefault: false }))]
    : [...rest, address];

  const { error: updateError } = await supabase
    .from(TABLES.users)
    .update({ addresses, updated_at: new Date().toISOString() })
    .eq('id', userId);
  throwIfError(updateError);

  return userFromRow({ ...row, addresses });
}
