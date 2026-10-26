import axios from 'axios';
import { env } from '../../config/env';
import { integrationError, notFound, unauthorized } from '../../lib/errors';
import { decryptSecret, randomToken } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { store } from '../../repositories/inMemory/store';
import { SsoConfiguration, Tenant } from '../../types/domain';
import { assertCorporateEmail } from './corporateDomainPolicy';
import { authService, IssuedSession, SessionMeta } from './authService';

interface SsoState {
  tenantId: string;
  email: string;
  redirectUri: string;
  provider: 'saml' | 'oidc';
  expiresAt: number;
}

export type SsoDiscovery =
  | {
      mode: 'sso';
      provider: 'saml' | 'oidc';
      tenantId: string;
      idpName: string;
      startUrl: string;
    }
  | { mode: 'password' }
  | { mode: 'blocked'; message: string };

/**
 * Identity-federation service for SAML 2.0 and OpenID Connect.
 *
 * Domain-matched auto-routing: once a tenant registers `enterprise.com`, any
 * login attempt from that domain is redirected to the tenant IdP before the
 * password form is rendered.
 *
 * State storage is in-memory for the reference implementation. Production must
 * use Redis with single-use, short-TTL keys to support multiple pods.
 */
export class SsoService {
  private readonly states = new Map<string, SsoState>();

  discover(rawEmail: string): SsoDiscovery {
    try {
      assertCorporateEmail(rawEmail);
    } catch {
      return {
        mode: 'blocked',
        message: 'Public webmail domains are not permitted. Use your corporate address.'
      };
    }

    const domain = rawEmail.split('@')[1]?.toLowerCase();
    if (!domain) return { mode: 'password' };

    const tenant = store.tenants.findByDomain(domain);
    if (!tenant?.sso?.enabled || !tenant.sso.autoRoute) return { mode: 'password' };
    if (!tenant.sso.domains.map((item) => item.toLowerCase()).includes(domain)) {
      return { mode: 'password' };
    }

    return {
      mode: 'sso',
      provider: tenant.sso.provider,
      tenantId: tenant.id,
      idpName: tenant.sso.idpName,
      startUrl: `${env.publicApiUrl}/api/v1/auth/sso/${tenant.sso.provider}/${tenant.id}/start?email=${encodeURIComponent(rawEmail)}`
    };
  }

  start(
    tenantId: string,
    provider: 'saml' | 'oidc',
    email: string
  ): { mode: 'oidc'; authorizationUrl: string } | { mode: 'saml'; entryPoint: string; relayState: string } {
    const tenant = this.getTenantSso(tenantId);
    const config = tenant.sso!;
    if (config.provider !== provider) {
      throw unauthorized('SSO provider does not match tenant configuration');
    }

    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    if (!config.domains.map((item) => item.toLowerCase()).includes(domain)) {
      throw unauthorized('Email domain is not federated for this tenant');
    }

    const state = randomToken(24);
    const redirectUri = `${env.publicApiUrl}/api/v1/auth/sso/callback`;
    this.states.set(state, {
      tenantId,
      email,
      redirectUri,
      provider,
      expiresAt: Date.now() + 10 * 60_000
    });
    this.pruneStates();

    if (provider === 'saml') {
      if (!config.samlEntryPoint) {
        throw integrationError('SAML entry point is not configured for this tenant');
      }
      return { mode: 'saml', entryPoint: config.samlEntryPoint, relayState: state };
    }

    if (!config.authorizationEndpoint || !config.clientId) {
      throw integrationError('OIDC authorization endpoint/client id is not configured');
    }

    const url = new URL(config.authorizationEndpoint);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('login_hint', email);

    return { mode: 'oidc', authorizationUrl: url.toString() };
  }

  /** OIDC authorization-code exchange + userinfo lookup + tenant session issuance. */
  async completeOidc(
    code: string,
    state: string,
    meta: SessionMeta
  ): Promise<{ session: IssuedSession; redirectTo: string }> {
    const stored = this.consumeState(state);
    if (!stored) throw unauthorized('Invalid or expired SSO state');
    if (stored.provider !== 'oidc') throw unauthorized('SSO provider mismatch');

    const tenant = this.getTenantSso(stored.tenantId);
    const config = tenant.sso!;

    let email = stored.email;
    const mockMode = !env.isProduction && (!config.encryptedClientSecret || process.env.SSO_MOCK_MODE === 'true');

    if (!mockMode) {
      if (!config.tokenEndpoint || !config.clientId) {
        throw integrationError('OIDC token endpoint is not configured');
      }
      const clientSecret = config.encryptedClientSecret
        ? decryptSecret(config.encryptedClientSecret)
        : '';

      const tokenResponse = await axios.post(
        config.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: stored.redirectUri,
          client_id: config.clientId,
          client_secret: clientSecret
        }).toString(),
        { headers: { 'content-type': 'application/x-www-form-urlencoded' }, timeout: 10_000 }
      );

      const accessToken = tokenResponse.data?.access_token as string | undefined;
      if (!accessToken) throw integrationError('OIDC token exchange did not return an access token');

      if (!config.userInfoEndpoint) {
        throw integrationError('userinfo_endpoint is required to securely resolve the SSO identity');
      }

      const userInfo = await axios.get(config.userInfoEndpoint, {
        headers: { authorization: `Bearer ${accessToken}` },
        timeout: 10_000
      });
      email = String(userInfo.data?.email ?? userInfo.data?.preferred_username ?? stored.email);
    } else {
      logger.warn('OIDC mock exchange enabled (development only)', { tenantId: tenant.id });
    }

    const session = this.resolveTenantUser(tenant, email, meta);

    return {
      session,
      redirectTo: `${env.appPublicUrl}/sso/callback?accessToken=${encodeURIComponent(
        session.accessToken
      )}&refreshToken=${encodeURIComponent(session.refreshToken)}`
    };
  }

  /**
   * SAML ACS contract.
   *
   * This reference implementation supports a mock assertion in development.
   * Production deployments must plug a hardened SP library (e.g. @node-saml)
   * that validates signatures, audience, recipient and time conditions before
   * reaching `resolveTenantUser`.
   */
  async completeSaml(
    tenantId: string,
    samlResponse: string,
    meta: SessionMeta
  ): Promise<{ session: IssuedSession; redirectTo: string }> {
    const tenant = this.getTenantSso(tenantId);
    if (env.isProduction && process.env.SAML_SP_LIBRARY !== 'configured') {
      throw integrationError(
        'SAML ACS requires a configured signature-validating SP library in production'
      );
    }

    let email: string | undefined;
    try {
      const xml = Buffer.from(samlResponse, 'base64').toString('utf8');
      email = /<NameID[^>]*>([^<]+)<\/NameID>/i.exec(xml)?.[1]?.trim();
    } catch {
      throw unauthorized('Malformed SAML response');
    }
    if (!email) throw unauthorized('SAML assertion did not contain a NameID');

    const session = this.resolveTenantUser(tenant, email, meta);
    return {
      session,
      redirectTo: `${env.appPublicUrl}/sso/callback?accessToken=${encodeURIComponent(
        session.accessToken
      )}&refreshToken=${encodeURIComponent(session.refreshToken)}`
    };
  }

  getSamlMetadata(tenantId: string): string {
    const tenant = this.getTenantSso(tenantId);
    const acs = `${env.publicApiUrl}/api/v1/auth/sso/saml/${tenant.id}/acs`;
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"',
      `  entityID="${env.publicApiUrl}/api/v1/auth/sso/saml/${tenant.id}/metadata">`,
      '  <SPSSODescriptor AuthnRequestsSigned="true" WantAssertionsSigned="true"',
      '    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">',
      `    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"`,
      `      Location="${acs}" index="0"/>`,
      '  </SPSSODescriptor>',
      '</EntityDescriptor>'
    ].join('\n');
  }

  private resolveTenantUser(tenant: Tenant, email: string, meta: SessionMeta): IssuedSession {
    const normalized = email.toLowerCase();
    const user = store.users.findByEmail(normalized);
    if (!user || user.tenantId !== tenant.id) {
      throw unauthorized('SSO identity is not provisioned for this tenant');
    }
    if (user.status !== 'active') throw unauthorized('SSO user is disabled');
    if (tenant.status !== 'active') throw unauthorized('Tenant is not active');

    store.users.update(tenant.id, user.id, { lastLoginAt: new Date().toISOString() });
    return authService.issueSession(user, tenant, meta);
  }

  private getTenantSso(tenantId: string): Tenant & { sso: SsoConfiguration } {
    const tenant = store.tenants.findById(tenantId);
    if (!tenant?.sso?.enabled) throw notFound('SSO configuration');
    return tenant as Tenant & { sso: SsoConfiguration };
  }

  private consumeState(state: string): SsoState | undefined {
    const record = this.states.get(state);
    this.states.delete(state);
    if (!record || record.expiresAt < Date.now()) return undefined;
    return record;
  }

  private pruneStates(): void {
    const now = Date.now();
    for (const [key, value] of this.states.entries()) {
      if (value.expiresAt < now) this.states.delete(key);
    }
  }
}

export const ssoService = new SsoService();
