import { NextFunction, Request, Response, Router } from 'express';
import { asyncHandler, created, ok, parse } from '../../lib/http';
import { unauthorized } from '../../lib/errors';
import { env } from '../../config/env';
import { timingSafeCompare } from '../../lib/crypto';
import { rateLimit } from '../../middleware/rateLimit';
import { demoConfirmSchema, demoRequestSchema } from './demoSchemas';
import { demoService } from './demoService';

const router = Router();

/**
 * Public lead-capture endpoint used by the landing page and auth module.
 * Rate-limited and corporate-domain validated.
 */
router.post(
  '/requests',
  rateLimit({ windowMs: 10 * 60_000, max: 8, keyPrefix: 'demo-request' }),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(demoRequestSchema, req.body);
    return created(res, await demoService.request(input));
  })
);

/** Email confirmation link target: provisions the sandbox tenant. */
router.post(
  '/confirm',
  rateLimit({ windowMs: 10 * 60_000, max: 20, keyPrefix: 'demo-confirm' }),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(demoConfirmSchema, req.body);
    return ok(res, await demoService.confirm(input.token));
  })
);

/** GET variant for email link clicks in environments without SPA routing. */
router.get(
  '/confirm',
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(demoConfirmSchema, { token: req.query.token });
    return ok(res, await demoService.confirm(input.token));
  })
);

const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!env.security.adminApiKey && !env.isProduction) {
    next();
    return;
  }
  const provided = String(req.headers['x-admin-key'] ?? '');
  if (!provided || !timingSafeCompare(provided, env.security.adminApiKey)) {
    next(unauthorized('Admin key required'));
    return;
  }
  next();
};

/** Internal lead analytics for the sales/CRM dashboard. */
router.get(
  '/requests',
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, demoService.listRequests());
  })
);

router.get(
  '/requests/:requestId',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = Array.isArray(req.params.requestId)
      ? req.params.requestId[0]
      : req.params.requestId;
    return ok(res, demoService.getRequest(requestId));
  })
);

router.get(
  '/analytics',
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, demoService.analytics());
  })
);

export default router;
