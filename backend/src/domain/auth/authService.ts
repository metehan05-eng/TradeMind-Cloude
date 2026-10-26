import bcrypt from 'bcryptjs';
import { AppError, conflict, forbidden, notFound, unauthorized } from '../../lib/errors';
import { randomToken, sha256 } from '../../lib/crypto';
import { signAccessToken } from '../../lib/jwt';
import { permissionsForRole, ROLE_DEFINITIONS } from '../rbac/roles';
import { kybVerificationService } from './kybVerificationService';
import { domainVerificationService } from './domainVerificationService';
import { assertCorporateEmail } from './corporateDomainPolicy';
import { store } from '../../repositories/inMemory/store';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { PublicUser, Tenant, User } from '../../types/domain';
import { CorporateRegisterInput } from './authSchemas';

const ACCESS_TTL_SECONDS = 30 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: PublicUser;
  tenant: {
    id: string;
    legalName: string;
    displayName: string;
    plan: Tenant['plan'];
    domain: string;
    domainVerificationLevel: Tenant['domainVerificationLevel'];
    dataRetention: Tenant['dataRetention'];
  };
  rbac: {
    role: User['role'];
    permissions: readonly string[];
    uiScopes: readonly string[];
  };
}

export const toPublicUser = (user: User): PublicUser => {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

export class AuthService {
  /**
   * Corporate registration pipeline:
   *
   *  email policy -> duplicate checks -> KYB -> tenant + admin user
   *  -> Level 1 email/domain challenge -> account stays `pending` until the
   *  domain link is confirmed (then `active` if KYB is verified).
   */
  async registerCorporate(input: CorporateRegisterInput): Promise<{
    tenantId: string;
    userId: string;
    status: string;
    kybStatus: string;
    nextStep: string;
    verification: Awaited<ReturnType<typeof domainVerificationService.issueEmailChallenge>>;
  }> {
    const { email, domain } = assertCorporateEmail(input.email);

    if (store.tenants.findByDomain(domain)) {
      throw conflict('A tenant with this corporate domain already exists');
    }
    if (store.tenants.findByTaxId(input.taxId)) {
      throw conflict('A tenant with this tax identifier already exists');
    }
    if (store.users.findByEmail(email)) {
      throw conflict('This email address is already registered');
    }

    const kyb = await kybVerificationService.verify({
      legalEntityName: input.companyLegalName,
      country: input.country,
      taxIdType: input.taxIdType,
      taxId: input.taxId.replace(/\s/g, '')
    });

    if (kyb.status === 'failed') {
      throw new AppError(422, 'KYB_FAILED', 'KYB verification failed', {
        details: { reason: kyb.reason ?? 'The company could not be verified in the registry' }
      });
    }

    const tenant = store.tenants.create({
      legalName: input.companyLegalName,
      displayName: input.displayName ?? input.companyLegalName,
      slug: slugify(input.companyLegalName),
      country: input.country,
      taxId: input.taxId.replace(/\s/g, ''),
      taxIdType: input.taxIdType,
      plan: input.plan,
      status: 'pending',
      kyb,
      primaryDomain: domain,
      domainVerificationLevel: 'none',
      dataRetention: input.plan === 'enterprise' ? 'zero_retention' : 'standard'
    });

    const user = store.users.create({
      tenantId: tenant.id,
      email,
      fullName: input.fullName,
      jobTitle: input.jobTitle,
      role: 'owner_admin',
      status: 'active',
      emailVerified: false,
      passwordHash: bcrypt.hashSync(input.password, 12)
    });

    const verification = await domainVerificationService.issueEmailChallenge(tenant, user.id);

    logger.info('Corporate registration created', {
      tenantId: tenant.id,
      userId: user.id,
      kybStatus: kyb.status,
      plan: tenant.plan
    });

    return {
      tenantId: tenant.id,
      userId: user.id,
      status: tenant.status,
      kybStatus: kyb.status,
      nextStep:
        kyb.status === 'manual_review'
          ? 'Confirm the email link. Compliance will review your registration documents.'
          : 'Confirm the verification email sent to your corporate mailbox to activate the tenant.',
      verification
    };
  }

  /** Password login with tenant/domain, email-verification and KYB gates. */
  async login(rawEmail: string, password: string, meta: SessionMeta): Promise<IssuedSession> {
    const { email } = assertCorporateEmail(rawEmail);
    const user = store.users.findByEmail(email);
    if (!user) throw unauthorized('Invalid email or password');

    const tenant = store.tenants.findById(user.tenantId);
    if (!tenant) throw unauthorized('Invalid email or password');
    if (tenant.status === 'suspended') throw forbidden('Tenant account is suspended');
    if (!user.emailVerified) {
      throw forbidden('Email address is not verified. Please confirm the corporate verification link.');
    }
    if (tenant.kyb.status === 'failed') {
      throw forbidden('KYB verification failed for this tenant');
    }
    if (tenant.status !== 'active') {
      throw forbidden('Tenant is pending compliance approval');
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      throw unauthorized('Invalid email or password');
    }

    store.users.update(tenant.id, user.id, { lastLoginAt: new Date().toISOString() });
    return this.issueSession(user, tenant, meta);
  }

  async refresh(rawRefreshToken: string, meta: SessionMeta): Promise<IssuedSession> {
    const tokenHash = sha256(rawRefreshToken);
    const session = store.refreshSessions.findByHash(tokenHash);
    if (!session) throw unauthorized('Refresh token is invalid or revoked');
    if (Date.parse(session.expiresAt) < Date.now()) {
      store.refreshSessions.revoke(session.id);
      throw unauthorized('Refresh token expired');
    }

    const user = store.users.findById(session.tenantId, session.userId);
    const tenant = store.tenants.findById(session.tenantId);
    if (!user || user.status !== 'active' || !tenant || tenant.status !== 'active') {
      store.refreshSessions.revoke(session.id);
      throw unauthorized('Session is no longer valid');
    }

    // Refresh-token rotation: the previous token is invalidated immediately.
    store.refreshSessions.revoke(session.id);
    return this.issueSession(user, tenant, meta);
  }

  logout(rawRefreshToken?: string): void {
    if (!rawRefreshToken) return;
    const session = store.refreshSessions.findByHash(sha256(rawRefreshToken));
    if (session) store.refreshSessions.revoke(session.id);
  }

  getMe(tenantId: string, userId: string): {
    user: PublicUser;
    tenant: Tenant;
    rbac: { role: User['role']; permissions: readonly string[]; uiScopes: readonly string[] };
  } {
    const user = store.users.findById(tenantId, userId);
    const tenant = store.tenants.findById(tenantId);
    if (!user || !tenant) throw notFound('User');

    return {
      user: toPublicUser(user),
      tenant,
      rbac: {
        role: user.role,
        permissions: permissionsForRole(user.role),
        uiScopes: ROLE_DEFINITIONS[user.role].uiScopes
      }
    };
  }

  issueSession(user: User, tenant: Tenant, meta: SessionMeta): IssuedSession {
    const refreshToken = randomToken(48);
    store.refreshSessions.create({
      tenantId: tenant.id,
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
      userAgent: meta.userAgent?.slice(0, 250),
      ip: meta.ip
    });

    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
      isDemo: user.email.endsWith('@demo.trademind.ai')
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TTL_SECONDS,
      tokenType: 'Bearer',
      user: toPublicUser(user),
      tenant: {
        id: tenant.id,
        legalName: tenant.legalName,
        displayName: tenant.displayName,
        plan: tenant.plan,
        domain: tenant.primaryDomain,
        domainVerificationLevel: tenant.domainVerificationLevel,
        dataRetention: tenant.dataRetention
      },
      rbac: {
        role: user.role,
        permissions: permissionsForRole(user.role),
        uiScopes: ROLE_DEFINITIONS[user.role].uiScopes
      }
    };
  }

  getSsoConfigForDomain(domain: string) {
    const tenant = store.tenants.findByDomain(domain);
    if (!tenant?.sso?.enabled) return null;
    if (!tenant.sso.autoRoute || !tenant.sso.domains.includes(domain)) return null;
    return { tenant, sso: tenant.sso };
  }
}

export const authService = new AuthService();
export const demoSessionTtl = env.jwt.demoTokenTtl;
