import { AppError } from '../../core/errors/AppError';

type SupabaseErrorLike = { message: string; code?: string; status?: number };

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