import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodTypeAny, z } from 'zod';
import { badRequest } from './errors';

export type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps async handlers and forwards rejections to the central error handler. */
export const asyncHandler = (handler: AsyncRoute): RequestHandler =>
  (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };

export const ok = <T>(res: Response, data: T, meta?: Record<string, unknown>): Response =>
  res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });

export const created = <T>(res: Response, data: T): Response =>
  res.status(201).json({ success: true, data });

/** Validates unknown input with Zod and returns a fully typed payload. */
export const parse = <T extends ZodTypeAny>(schema: T, input: unknown): z.infer<T> => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw badRequest('Request validation failed', result.error.flatten());
  }
  return result.data;
};

export const getPagination = (req: Request): { limit: number; offset: number } => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  return { limit, offset };
};
