/**
 * Structured application errors keep HTTP status, machine-readable code and
 * safe client details consistent across every module.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTEGRATION_ERROR'
  | 'KYB_FAILED'
  | 'DOMAIN_NOT_VERIFIED'
  | 'PUBLIC_EMAIL_BLOCKED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly expose: boolean;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options: { details?: unknown; expose?: boolean; cause?: unknown } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = options.details;
    this.expose = options.expose ?? status < 500;
    if (options.cause) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, 'VALIDATION_ERROR', message, { details });

export const unauthorized = (message = 'Authentication required'): AppError =>
  new AppError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'Insufficient permissions'): AppError =>
  new AppError(403, 'FORBIDDEN', message);

export const notFound = (resource: string): AppError =>
  new AppError(404, 'NOT_FOUND', `${resource} not found`);

export const conflict = (message: string): AppError =>
  new AppError(409, 'CONFLICT', message);

export const integrationError = (message: string, details?: unknown): AppError =>
  new AppError(502, 'INTEGRATION_ERROR', message, { details });

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
