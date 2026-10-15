import { PostgrestError } from '@supabase/supabase-js';
import { AppError } from '../../core/errors/AppError';

type SupabaseErrorLike = { message: string; code?: string; status?: number };

type AuthErrorLike = { message?: string; code?: string | null; status?: number };

export function toAppError(error: SupabaseErrorLike): AppError {
  const code = error.code ?? '';
  const msg = error.message ?? '';

  if (code === 'PGRST116') return new AppError('not-found', 'Not found.', error);
  if (code === '42501' || error.status === 403)
    return new AppError('permission-denied', 'You do not have access to this resource.', error);
  if (code === 'invalid_credentials')
    return new AppError('unauthenticated', 'Incorrect email or password.', error);
  if (code === 'email_not_confirmed')
    return new AppError('unauthenticated', 'Please confirm your email, then sign in.', error);
  if (error.status === 401) return new AppError('unauthenticated', 'Please sign in to continue.', error);
  if (code === '23505' || code === 'user_already_exists' || code === 'email_exists')
    return new AppError('conflict', 'This already exists.', error);
  if (code === 'weak_password' || code === 'validation_failed' || ['23502', '23514', '22P02'].includes(code))
    return new AppError('validation', msg, error);
  if ((error.status ?? 0) >= 500 || /network|fetch failed/i.test(msg))
    return new AppError('unavailable', 'Service is unavailable. Check your connection and try again.', error);

  return new AppError('unknown', msg || 'Something went wrong', error);
}

/**
 * Throw the matching AppError when a PostgREST call failed, otherwise no-op.
 * `.single()` on zero rows surfaces as PGRST116 — surfaced as 'not-found'
 * with the caller's message (e.g. 'Order was not found.').
 */
export function throwIfError(error: PostgrestError | null, notFoundMessage?: string): void {
  if (!error) {
    return;
  }
  if (error.code === 'PGRST116') {
    throw new AppError('not-found', notFoundMessage ?? 'Not found.', error);
  }
  throw toAppError(error);
}

/** Map a Supabase Auth error (signUp/signIn/resend/signOut) to an AppError. */
export function mapAuthError(error: AuthErrorLike): AppError {
  return toAppError({
    message: error.message ?? 'Authentication failed.',
    code: error.code ?? undefined,
    status: error.status,
  });
}