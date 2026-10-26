import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, created, parse } from '../../../lib/http';
import { badRequest, notFound } from '../../../lib/errors';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/rbac';
import { oauthIntegrationService } from './oauthService';
import { audit } from '../../audit/auditService';
import { MarketplaceProvider } from '../../../types/domain';

const router = Router();

const providerSchema = z.enum(['amazon', 'shopify', 'etsy', 'trendyol']);
const beginSchema = z.object({
  shopDomain: z.string().trim().min(3).max(200).optional(),
  email: z.string().email().optional()
});
const sandboxSchema = z.object({
  accountLabel: z.string().trim().min(2).max(120).optional()
});

router.get(
  '/oauth/providers',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, oauthIntegrationService.listProviders());
  })
);

/** Creates the provider consent URL and a single-use state record. */
router.post(
  '/oauth/:provider/authorize',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const provider = parse(providerSchema, req.params.provider) as MarketplaceProvider;
    const input = parse(beginSchema, req.body ?? {});
    const result = oauthIntegrationService.begin({
      provider,
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      email: input.email ?? req.auth!.email,
      shopDomain: input.shopDomain
    });
    return created(res, result);
  })
);

/** OAuth redirect URI. The frontend is notified with a safe status redirect. */
router.get(
  '/oauth/:provider/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const provider = parse(providerSchema, req.params.provider) as MarketplaceProvider;
    const code = String(req.query.code ?? '');
    const state = String(req.query.state ?? '');
    const shopDomain = req.query.shop ? String(req.query.shop) : undefined;
    if (!code || !state) throw badRequest('OAuth code and state are required');

    const connection = await oauthIntegrationService.complete({
      provider,
      code,
      state,
      shopDomain
    });

    if (req.query.format === 'json') return ok(res, connection);
    const redirect = new URL('/settings', process.env.APP_PUBLIC_URL ?? 'http://localhost:5173');
    redirect.searchParams.set('integration', 'connected');
    redirect.searchParams.set('provider', provider);
    return res.redirect(redirect.toString());
  })
);

router.get(
  '/oauth/connections',
  requireAuth,
  requirePermission('integrations:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, oauthIntegrationService.list(req.auth!.tenantId));
  })
);

router.delete(
  '/oauth/connections/:connectionId',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const connectionId = Array.isArray(req.params.connectionId)
      ? req.params.connectionId[0]
      : req.params.connectionId;
    oauthIntegrationService.disconnect(req.auth!.tenantId, connectionId);
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'integration.disconnected',
      resourceType: 'integration',
      resourceId: connectionId
    });
    return ok(res, { disconnected: true });
  })
);

router.post(
  '/oauth/connections/:connectionId/refresh',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const connectionId = Array.isArray(req.params.connectionId)
      ? req.params.connectionId[0]
      : req.params.connectionId;
    return ok(
      res,
      await oauthIntegrationService.refreshConnection(req.auth!.tenantId, connectionId)
    );
  })
);

/**
 * Development-only sandbox connection. Allows the dashboard integration hub to
 * be exercised without real marketplace credentials.
 */
router.post(
  '/oauth/:provider/sandbox-connect',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const provider = parse(providerSchema, req.params.provider) as MarketplaceProvider;
    const input = parse(sandboxSchema, req.body ?? {});
    const connection = await oauthIntegrationService.connectSandbox(
      req.auth!.tenantId,
      req.auth!.userId,
      provider,
      input.accountLabel
    );
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'integration.sandbox_connected',
      resourceType: 'integration',
      resourceId: connection.id,
      metadata: { provider }
    });
    return created(res, connection);
  })
);

router.get(
  '/oauth/connections/:connectionId/token-fingerprint',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const connectionId = Array.isArray(req.params.connectionId)
      ? req.params.connectionId[0]
      : req.params.connectionId;
    if (!connectionId) throw notFound('Integration');
    return ok(res, {
      fingerprint: oauthIntegrationService.tokenFingerprint(req.auth!.tenantId, connectionId)
    });
  })
);

export default router;
