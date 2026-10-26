import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { forbidden, unauthorized } from '../lib/errors';
import { store } from '../repositories/inMemory/store';
import { permissionsForRole } from '../domain/rbac/roles';

/** Extracts a bearer token from the Authorization header. */
const readBearer = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
};

/**
 * JWT authentication middleware.
 *
 * 1. Verify signature, issuer, audience and expiry.
 * 2. Re-load the user and tenant on every request (supports instant revocation).
 * 3. Derive permissions from the role catalogue, never from the token payload.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = readBearer(req);
  if (!token) {
    next(unauthorized());
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const tenant = store.tenants.findById(payload.tid);
    if (!tenant || tenant.status !== 'active') {
      throw forbidden('Tenant is not active');
    }

    const user = store.users.findById(payload.tid, payload.sub);
    if (!user || user.status !== 'active') {
      throw unauthorized('User is disabled or missing');
    }

    req.auth = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: permissionsForRole(user.role),
      isDemo: payload.dem === true || tenant.plan === 'starter',
      tokenId: payload.jti
    };
    next();
  } catch (error) {
    next(error);
  }
};
