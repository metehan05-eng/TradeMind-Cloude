import { NextFunction, Request, Response } from 'express';
import { forbidden } from '../lib/errors';
import { Permission } from '../types/domain';

/**
 * Route-level RBAC gate. Usage:
 *   router.get('/financials', requireAuth, requirePermission('financials:read'), handler)
 */
export const requirePermission =
  (...required: Permission[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(forbidden('Authentication context missing'));
      return;
    }
    const missing = required.filter((permission) => !req.auth?.permissions.includes(permission));
    if (missing.length > 0) {
      next(forbidden(`Missing permission(s): ${missing.join(', ')}`));
      return;
    }
    next();
  };

export const requireAnyPermission =
  (...required: Permission[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(forbidden('Authentication context missing'));
      return;
    }
    const allowed = required.some((permission) => req.auth?.permissions.includes(permission));
    if (!allowed) {
      next(forbidden(`Requires one of: ${required.join(', ')}`));
      return;
    }
    next();
  };
