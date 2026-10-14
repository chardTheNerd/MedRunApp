import { AppError } from '../../../core/errors/AppError';
import { User } from '../../../domain/entities/User';
import { RegisterInput } from '../../../domain/repositories/AuthRepository';
import { getSupabase } from '../SupabaseClient';
import { throwIfError, mapAuthError } from '../errors';
import { userFromRow } from '../mappers';
import { UserRow } from '../rows';
import { TABLES } from '../tables';

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.users)
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  throwIfError(error);
  return data ? userFromRow(data as UserRow) : null;
}

export async function registerWithEmail(input: RegisterInput): Promise<User> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        phone: input.phoneE164,
        role: input.role ?? 'patient',
      },
    },
  });
  if (error) {
    throw mapAuthError(error);
  }
  const authUser = data.user;
  if (!authUser) {
    throw new AppError('unavailable', 'Account could not be created.');
  }

  // Email confirmation ON → no session yet. The handle_new_user trigger has
  // already created the profile row server-side, so return a provisional user
  // (role is always 'patient' at signup; promotion is an admin action).
  // The UI should route to a "check your email" screen from here.
  if (!data.session) {
    return {
      id: authUser.id,
      role: 'patient',
      displayName: input.displayName,
      email: input.email,
      phoneE164: input.phoneE164,
      photoUrl: null,
      locale: 'en-NG',
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Session present (confirmation OFF or auto-confirmed): backfill/confirm the
  // trigger-created row. created_at is left to the database default.
  const { error: profileError } = await supabase.from(TABLES.users).upsert(
    {
      id: authUser.id,
      role: 'patient',
      display_name: input.displayName,
      email: input.email,
      phone_e164: input.phoneE164,
      photo_url: null,
      locale: 'en-NG',
      addresses: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  throwIfError(profileError);

  const created = await fetchUserProfile(authUser.id);
  if (!created) {
    throw new AppError('unavailable', 'Account was created but the patient profile could not be loaded.');
  }
  return created;
}

export async function resendSignupConfirmation(email: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) {
    throw mapAuthError(error);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw mapAuthError(error);
  }
  const profile = await currentAuthUser();
  if (!profile) {
    throw new AppError('not-found', 'No patient profile exists for this account.');
  }
  return profile;
}

export async function signOutCurrentUser(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw mapAuthError(error);
  }
}

export function observeAuthState(onChange: (user: User | null) => void): () => void {
  const supabase = getSupabase();
  let active = true;

  // onAuthStateChange does not fire for the current session, so emit it once.
  supabase.auth.getSession().then(async ({ data }) => {
    if (!active) {
      return;
    }
    const authUserId = data.session?.user.id;
    onChange(authUserId ? await fetchUserProfile(authUserId) : null);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const authUserId = session?.user.id;
    onChange(authUserId ? await fetchUserProfile(authUserId) : null);
  });

  return () => {
    active = false;
    listener.subscription.unsubscribe();
  };
}

export async function currentAuthUser(): Promise<User | null> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const authUserId = data.session?.user.id;
  if (!authUserId) {
    return null;
  }
  return fetchUserProfile(authUserId);
}
