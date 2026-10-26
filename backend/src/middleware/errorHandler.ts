import { NextFunction, Request, Response } from 'express';
import { AppError, isAppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const appError = isAppError(error)
    ? error
    : new AppError(500, 'INTERNAL_ERROR', 'Unexpected server error', {
        expose: false,
        cause: error
      });

  const logContext = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    tenantId: req.auth?.tenantId,
    userId: req.auth?.userId,
    status: appError.status,
    code: appError.code,
    error: error instanceof Error ? error.message : String(error)
  };

  if (appError.status >= 500) logger.error('Request failed', logContext);
  else logger.warn('Request rejected', logContext);

  res.status(appError.status).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.expose ? appError.message : 'Internal server error',
      ...(appError.expose && appError.details ? { details: appError.details } : {})
    },
    requestId: req.requestId
  });
};
