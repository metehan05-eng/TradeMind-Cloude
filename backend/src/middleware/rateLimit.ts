import { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Lightweight fixed-window limiter for auth/demo endpoints. Production should
 * use Redis (or an API gateway) so limits work across horizontally scaled pods.
 */
export const rateLimit =
  (options: { windowMs: number; max: number; keyPrefix: string }) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const buckets = (rateLimit as unknown as { buckets?: Map<string, Bucket> }).buckets ?? new Map();
    (rateLimit as unknown as { buckets: Map<string, Bucket> }).buckets = buckets;

    const key = `${options.keyPrefix}:${req.ip ?? 'unknown'}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please retry later.'));
      return;
    }
    next();
  };
