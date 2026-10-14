import { AppError } from '../../core/errors/AppError';
import { err, ok, Result } from '../../core/types/result';

export async function wrap<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(AppError.fromUnknown(error));
  }
}
