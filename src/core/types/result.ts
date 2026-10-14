import { AppError } from '../errors/AppError';

export type Ok<T> = { ok: true; value: T };
export type Err<E = AppError> = { ok: false; error: E };
export type Result<T, E = AppError> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E = AppError>(error: E): Err<E> => ({ ok: false, error });
