import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, parse } from '../../lib/http';
import { notFound } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { store } from '../../repositories/inMemory/store';
import { encryptSecret } from '../../lib/crypto';
import { audit } from '../audit/auditService';

const router = Router();

const updateTenantSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  dataRetention: z.enum(['standard', 'zero_retention']).optional()
});

const ssoSchema = z.object({
  provider: z.enum(['saml', 'oidc']),
  idpName: z.string().trim().min(2).max(120),
  issuer: z.string().url(),
  clientId: z.string().trim().min(2).max(256),
  clientSecret: z.string().trim().min(8).max(512).optional(),
  authorizationEndpoint: z.string().url().optional(),
  tokenEndpoint: z.string().url().optional(),
  userInfoEndpoint: z.string().url().optional(),
  samlEntryPoint: z.string().url().optional(),
  samlCertificate: z.string().optional(),
  domains: z.array(z.string().trim().toLowerCase()).min(1),
  autoRoute: z.boolean().default(true)
});

router.get(
  '/current',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = store.tenants.findById(req.auth!.tenantId);
    if (!tenant) throw notFound('Tenant');
    const { sso, ...safeTenant } = tenant;
    return ok(res, {
      ...safeTenant,
      sso: sso
        ? {
            provider: sso.provider,
            enabled: sso.enabled,
            idpName: sso.idpName,
            issuer: sso.issuer,
            clientId: sso.clientId,
            domains: sso.domains,
            autoRoute: sso.autoRoute,
            hasClientSecret: Boolean(sso.encryptedClientSecret)
          }
        : null
    });
  })
);

router.patch(
  '/current',
  requireAuth,
  requirePermission('tenant:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(updateTenantSchema, req.body);
    const tenant = store.tenants.update(req.auth!.tenantId, input);
    audit(req, {
      tenantId: tenant.id,
      actorId: req.auth!.userId,
      action: 'tenant.updated',
      resourceType: 'tenant',
      resourceId: tenant.id,
      metadata: input
    });
    return ok(res, tenant);
  })
);

/** Enterprise SSO configuration — secrets are encrypted with AES-256-GCM. */
router.put(
  '/current/sso',
  requireAuth,
  requirePermission('tenant:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(ssoSchema, req.body);
    const tenant = store.tenants.findById(req.auth!.tenantId);
    if (!tenant) throw notFound('Tenant');
    if (tenant.plan !== 'enterprise') {
      throw notFound('Enterprise SSO');
    }

    const now = new Date().toISOString();
    const updated = store.tenants.update(tenant.id, {
      sso: {
        provider: input.provider,
        enabled: true,
        idpName: input.idpName,
        issuer: input.issuer,
        clientId: input.clientId,
        encryptedClientSecret: input.clientSecret
          ? encryptSecret(input.clientSecret)
          : tenant.sso?.encryptedClientSecret,
        authorizationEndpoint: input.authorizationEndpoint,
        tokenEndpoint: input.tokenEndpoint,
        userInfoEndpoint: input.userInfoEndpoint,
        samlEntryPoint: input.samlEntryPoint,
        samlCertificate: input.samlCertificate,
        domains: input.domains,
        autoRoute: input.autoRoute,
        createdAt: tenant.sso?.createdAt ?? now,
        updatedAt: now
      }
    });

    audit(req, {
      tenantId: tenant.id,
      actorId: req.auth!.userId,
      action: 'tenant.sso_configured',
      resourceType: 'sso',
      metadata: { provider: input.provider, idpName: input.idpName, domains: input.domains }
    });

    return ok(res, {
      provider: updated.sso?.provider,
      idpName: updated.sso?.idpName,
      domains: updated.sso?.domains,
      autoRoute: updated.sso?.autoRoute
    });
  })
);

router.delete(
  '/current/sso',
  requireAuth,
  requirePermission('tenant:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = store.tenants.findById(req.auth!.tenantId);
    if (!tenant) throw notFound('Tenant');
    store.tenants.update(tenant.id, { sso: undefined });
    return ok(res, { disabled: true });
  })
);

router.get(
  '/current/audit',
  requireAuth,
  requirePermission('audit:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, store.auditLogs.list(req.auth!.tenantId));
  })
);

export default router;
