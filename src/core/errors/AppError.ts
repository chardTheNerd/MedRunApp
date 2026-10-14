export type AppErrorCode =
  | 'unauthenticated'
  | 'not-found'
  | 'permission-denied'
  | 'validation'
  | 'unavailable'
  | 'conflict'
  | 'not-configured'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }

  static fromUnknown(error: unknown, fallback = 'Something went wrong'): AppError {
    if (error instanceof AppError) {
      return error;
    }
    const maybeCode = (error as { code?: string })?.code;
    if (maybeCode === 'permission-denied') {
      return new AppError('permission-denied', 'You do not have access to this resource.', error);
    }
    if (maybeCode === 'unauthenticated') {
      return new AppError('unauthenticated', 'Please sign in to continue.', error);
    }
    return new AppError('unknown', fallback, error);
  }
}
