import { env } from '../../../config/env';
import { badRequest, conflict, integrationError, notFound, unauthorized } from '../../../lib/errors';
import { decryptSecret, encryptSecret, randomToken, sha256, sha256Base64Url } from '../../../lib/crypto';
import { logger } from '../../../lib/logger';
import { eventBus } from '../../../lib/events';
import { store } from '../../../repositories/inMemory/store';
import { IntegrationConnection, MarketplaceProvider } from '../../../types/domain';
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  getProviderDefinition,
  listProviderDefinitions,
  OAuthTokenSet,
  refreshProviderToken
} from './providers';

export interface PublicConnection {
  id: string;
  provider: MarketplaceProvider;
  accountLabel: string;
  status: IntegrationConnection['status'];
  scopes: string[];
  expiresAt?: string;
  lastRefreshedAt?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

const sanitize = (connection: IntegrationConnection): PublicConnection => ({
  id: connection.id,
  provider: connection.provider,
  accountLabel: connection.accountLabel,
  status: connection.status,
  scopes: connection.scopes,
  expiresAt: connection.expiresAt,
  lastRefreshedAt: connection.lastRefreshedAt,
  createdAt: connection.createdAt,
  metadata: connection.metadata
});

/**
 * OAuth 2.0 Authorization Code service for marketplace connectors.
 *
 * Security properties:
 *  - state is single-use, TTL-bound and tenant/user-bound.
 *  - PKCE (S256) is used for Etsy.
 *  - access/refresh tokens are encrypted with AES-256-GCM before persistence.
 *  - token values never leave the backend; only connection metadata is returned.
 */
export class OAuthIntegrationService {
  listProviders() {
    return listProviderDefinitions().map((provider) => ({
      key: provider.key,
      label: provider.label,
      scopes: provider.scopes,
      configured: provider.configured,
      requiresShopDomain: provider.requiresShopDomain
    }));
  }

  begin(input: {
    provider: MarketplaceProvider;
    tenantId: string;
    userId: string;
    email: string;
    shopDomain?: string;
  }): { authorizationUrl: string; state: string; mockMode: boolean } {
    const definition = getProviderDefinition(input.provider);
    const state = randomToken(24);
    const redirectUri = `${env.publicApiUrl}/api/v1/integrations/oauth/${input.provider}/callback`;
    const codeVerifier = definition.usesPkce ? randomToken(48) : undefined;

    store.oauthStates.create({
      tenantId: input.tenantId,
      userId: input.userId,
      provider: input.provider,
      state,
      codeVerifier,
      redirectUri,
      expiresAt: new Date(Date.now() + env.oauth.stateTtlMinutes * 60_000).toISOString()
    });

    const authorizationUrl = buildAuthorizationUrl({
      provider: input.provider,
      state,
      redirectUri,
      shopDomain: input.shopDomain,
      codeChallenge: codeVerifier ? sha256Base64Url(codeVerifier) : undefined,
      email: input.email
    });

    return {
      authorizationUrl,
      state,
      mockMode: !env.isProduction && !definition.configured
    };
  }

  async complete(input: {
    provider: MarketplaceProvider;
    code: string;
    state: string;
    shopDomain?: string;
  }): Promise<PublicConnection> {
    const stateRecord = store.oauthStates.consume(input.state);
    if (!stateRecord) throw unauthorized('OAuth state is invalid or expired');
    if (stateRecord.provider !== input.provider) throw unauthorized('OAuth provider mismatch');
    if (Date.parse(stateRecord.expiresAt) < Date.now()) throw unauthorized('OAuth state expired');
    if (!input.code) throw badRequest('Authorization code is required');

    const tokens = await exchangeAuthorizationCode({
      provider: input.provider,
      code: input.code,
      redirectUri: stateRecord.redirectUri,
      shopDomain: input.shopDomain,
      codeVerifier: stateRecord.codeVerifier
    });

    return this.persistConnection(stateRecord.tenantId, stateRecord.userId, input.provider, tokens);
  }

  /** Development-only shortcut that creates a fully encrypted mock connection. */
  async connectSandbox(
    tenantId: string,
    userId: string,
    provider: MarketplaceProvider,
    accountLabel?: string
  ): Promise<PublicConnection> {
    if (env.isProduction) throw notFound('Sandbox connector');
    const definition = getProviderDefinition(provider);
    return this.persistConnection(tenantId, userId, provider, {
      accessToken: `mock_access_${provider}_${randomToken(12)}`,
      refreshToken: provider === 'shopify' ? undefined : `mock_refresh_${provider}_${randomToken(12)}`,
      expiresIn: 3600,
      scopes: [...definition.scopes],
      accountLabel: accountLabel ?? `${definition.label} Sandbox`,
      metadata: { mocked: true }
    });
  }

  private persistConnection(
    tenantId: string,
    userId: string,
    provider: MarketplaceProvider,
    tokens: OAuthTokenSet
  ): PublicConnection {
    if (!tokens.accessToken) throw integrationError('Provider returned an empty access token');
    const existing = store.connections.findByProvider(tenantId, provider);
    if (existing && existing.status === 'connected') {
      // Reconnecting the same provider replaces credentials (e.g. after reauth).
      const updated = store.connections.update(tenantId, existing.id, {
        status: 'connected',
        accountLabel: tokens.accountLabel,
        scopes: tokens.scopes,
        encryptedAccessToken: encryptSecret(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encryptSecret(tokens.refreshToken)
          : existing.encryptedRefreshToken,
        expiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
          : undefined,
        metadata: { ...existing.metadata, ...tokens.metadata },
        lastRefreshedAt: new Date().toISOString(),
        lastError: undefined
      });
      eventBus.publish({ type: 'integration.connected', tenantId, provider });
      return sanitize(updated);
    }

    const connection = store.connections.create({
      tenantId,
      provider,
      accountLabel: tokens.accountLabel,
      status: 'connected',
      scopes: tokens.scopes,
      encryptedAccessToken: encryptSecret(tokens.accessToken),
      encryptedRefreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : undefined,
      expiresAt: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
        : undefined,
      metadata: tokens.metadata,
      lastRefreshedAt: new Date().toISOString(),
      createdBy: userId
    });

    eventBus.publish({ type: 'integration.connected', tenantId, provider });
    logger.info('Marketplace integration connected', { tenantId, provider });
    return sanitize(connection);
  }

  list(tenantId: string): PublicConnection[] {
    return store.connections.list(tenantId).map(sanitize);
  }

  disconnect(tenantId: string, connectionId: string): void {
    const connection = store.connections.findById(tenantId, connectionId);
    if (!connection) throw notFound('Integration');
    store.connections.remove(tenantId, connectionId);
  }

  async refreshConnection(tenantId: string, connectionId: string): Promise<PublicConnection> {
    const connection = store.connections.findById(tenantId, connectionId);
    if (!connection) throw notFound('Integration');
    if (!connection.encryptedRefreshToken) {
      throw conflict('This provider does not expose a refresh token; reconnect is required');
    }
    return this.refresh(connection);
  }

  /**
   * Background refresh sweep. Invoked every 15 minutes by the scheduler and
   * refreshes tokens expiring within the next 20 minutes.
   */
  async refreshExpiringConnections(force = false): Promise<{ refreshed: number; failed: number }> {
    const threshold = Date.now() + 20 * 60_000;
    const candidates = store.connections
      .allConnected()
      .filter((connection) => {
        if (!connection.encryptedRefreshToken) return false;
        if (force) return true;
        return connection.expiresAt ? Date.parse(connection.expiresAt) <= threshold : false;
      });

    let refreshed = 0;
    let failed = 0;
    for (const connection of candidates) {
      try {
        await this.refresh(connection);
        refreshed += 1;
      } catch (error) {
        failed += 1;
        store.connections.update(connection.tenantId, connection.id, {
          status: 'error',
          lastError: error instanceof Error ? error.message : 'refresh failed'
        });
      }
    }
    return { refreshed, failed };
  }

  private async refresh(connection: IntegrationConnection): Promise<PublicConnection> {
    const refreshToken = decryptSecret(connection.encryptedRefreshToken!);
    const tokens = await refreshProviderToken(connection.provider, refreshToken);
    const updated = store.connections.update(connection.tenantId, connection.id, {
      status: 'connected',
      encryptedAccessToken: encryptSecret(tokens.accessToken),
      encryptedRefreshToken: tokens.refreshToken
        ? encryptSecret(tokens.refreshToken)
        : connection.encryptedRefreshToken,
      expiresAt: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
        : connection.expiresAt,
      lastRefreshedAt: new Date().toISOString(),
      lastError: undefined
    });
    logger.info('OAuth token refreshed', {
      tenantId: connection.tenantId,
      provider: connection.provider
    });
    return sanitize(updated);
  }

  /** Used by sync workers; raw tokens are decrypted only in memory. */
  getAccessToken(tenantId: string, connectionId: string): string {
    const connection = store.connections.findById(tenantId, connectionId);
    if (!connection) throw notFound('Integration');
    if (connection.status !== 'connected') throw conflict('Integration is not connected');
    return decryptSecret(connection.encryptedAccessToken);
  }

  /** Diagnostic hash for logs — never log the raw token. */
  tokenFingerprint(tenantId: string, connectionId: string): string {
    return sha256(this.getAccessToken(tenantId, connectionId)).slice(0, 12);
  }
}

export const oauthIntegrationService = new OAuthIntegrationService();
