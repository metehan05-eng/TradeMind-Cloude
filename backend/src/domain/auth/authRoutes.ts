import { Request, Response, Router } from 'express';
import multer from 'multer';
import { asyncHandler, created, ok, parse } from '../../lib/http';
import { badRequest, notFound } from '../../lib/errors';
import { env } from '../../config/env';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { rateLimit } from '../../middleware/rateLimit';
import { authService } from './authService';
import { domainVerificationService } from './domainVerificationService';
import { ssoService } from './ssoService';
import {
  corporateRegisterSchema,
  discoverSsoSchema,
  dnsVerifySchema,
  loginSchema,
  refreshSchema,
  resendVerificationSchema,
  verifyEmailTokenSchema
} from './authSchemas';
import { store } from '../../repositories/inMemory/store';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.security.maxUploadBytes, files: 1 }
});

const sessionMeta = (req: Request) => ({
  userAgent: req.get('user-agent'),
  ip: req.ip
});

/**
 * POST /api/v1/auth/register/corporate
 * Business-only registration + KYB + Level 1 domain challenge.
 */
router.post(
  '/register/corporate',
  rateLimit({ windowMs: 15 * 60_000, max: 10, keyPrefix: 'register' }),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(corporateRegisterSchema, req.body);
    const result = await authService.registerCorporate(input);
    return created(res, {
      ...result,
      message: 'Registration accepted. Verify your corporate email to activate the tenant.'
    });
  })
);

/** POST /api/v1/auth/login — email+password login (SSO is handled separately). */
router.post(
  '/login',
  rateLimit({ windowMs: 15 * 60_000, max: 20, keyPrefix: 'login' }),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(loginSchema, req.body);
    const session = await authService.login(input.email, input.password, sessionMeta(req));
    return ok(res, session);
  })
);

/** POST /api/v1/auth/refresh — rotates refresh token and issues a new access token. */
router.post(
  '/refresh',
  rateLimit({ windowMs: 15 * 60_000, max: 60, keyPrefix: 'refresh' }),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(refreshSchema, req.body);
    const session = await authService.refresh(input.refreshToken, sessionMeta(req));
    return ok(res, session);
  })
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const token = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined;
    authService.logout(token);
    return ok(res, { loggedOut: true });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, authService.getMe(req.auth!.tenantId, req.auth!.userId));
  })
);

/** Level 1 email/domain confirmation endpoint (link target). */
router.post(
  '/verify/email',
  rateLimit({ windowMs: 15 * 60_000, max: 30, keyPrefix: 'verify-email' }),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(verifyEmailTokenSchema, req.body);
    const result = await domainVerificationService.confirmEmailToken(input.token);
    const tenant = store.tenants.findById(result.tenantId);
    return ok(res, {
      verified: true,
      tenantId: result.tenantId,
      domain: result.domain,
      tenantStatus: tenant?.status,
      message:
        tenant?.status === 'active'
          ? 'Domain verified. You can now sign in.'
          : 'Domain verified. Compliance review is still in progress.'
    });
  })
);

router.get(
  '/verification/status',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, domainVerificationService.getStatus(req.auth!.tenantId));
  })
);

router.post(
  '/verification/email/resend',
  requireAuth,
  requirePermission('tenant:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    parse(resendVerificationSchema, req.body ?? {});
    const tenant = store.tenants.findById(req.auth!.tenantId);
    if (!tenant) throw notFound('Tenant');
    const challenge = await domainVerificationService.issueEmailChallenge(
      tenant,
      req.auth!.userId
    );
    return ok(res, challenge);
  })
);

/** Level 2a — issue a DNS TXT challenge (Enterprise tier only). */
router.post(
  '/verification/dns/issue',
  requireAuth,
  requirePermission('tenant:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = store.tenants.findById(req.auth!.tenantId);
    if (!tenant) throw notFound('Tenant');
    return created(res, await domainVerificationService.issueDnsChallenge(tenant));
  })
);

router.post(
  '/verification/dns/verify',
  requireAuth,
  requirePermission('tenant:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(dnsVerifySchema, req.body);
    return ok(
      res,
      await domainVerificationService.verifyDnsChallenge(req.auth!.tenantId, input.challengeId)
    );
  })
);

/** Level 2b — secure document upload for manual domain/company ownership review. */
router.post(
  '/verification/documents',
  requireAuth,
  requirePermission('tenant:manage'),
  upload.single('document'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = store.tenants.findById(req.auth!.tenantId);
    if (!tenant) throw notFound('Tenant');
    if (!req.file) throw badRequest('A document file is required');
    const result = await domainVerificationService.submitDocument(
      tenant,
      req.auth!.userId,
      req.file
    );
    return created(res, result);
  })
);

/** Domain-matched SSO discovery: user@enterprise.com -> corporate IdP. */
router.get(
  '/sso/discover',
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(discoverSsoSchema, { email: req.query.email });
    return ok(res, ssoService.discover(input.email));
  })
);

router.get(
  '/sso/:provider/:tenantId/start',
  asyncHandler(async (req: Request, res: Response) => {
    const provider = req.params.provider === 'saml' ? 'saml' : 'oidc';
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId;
    const email = String(req.query.email ?? '').toLowerCase();
    if (!email) throw badRequest('email query parameter is required');
    return ok(res, ssoService.start(tenantId, provider, email));
  })
);

/** OIDC redirect URI. In production exchange the session for a one-time SPA code. */
router.get(
  '/sso/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const code = String(req.query.code ?? '');
    const state = String(req.query.state ?? '');
    if (!code || !state) throw badRequest('OIDC code and state are required');
    const result = await ssoService.completeOidc(code, state, sessionMeta(req));
    if (req.query.format === 'json') return ok(res, result);
    return res.redirect(result.redirectTo);
  })
);

router.post(
  '/sso/saml/:tenantId/acs',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId;
    const samlResponse = String(req.body?.SAMLResponse ?? '');
    if (!samlResponse) throw badRequest('SAMLResponse is required');
    const result = await ssoService.completeSaml(tenantId, samlResponse, sessionMeta(req));
    if (req.query.format === 'json') return ok(res, result);
    return res.redirect(result.redirectTo);
  })
);

router.get(
  '/sso/saml/:tenantId/metadata',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = Array.isArray(req.params.tenantId)
      ? req.params.tenantId[0]
      : req.params.tenantId;
    res.type('application/samlmetadata+xml');
    return res.send(ssoService.getSamlMetadata(tenantId));
  })
);

export default router;
