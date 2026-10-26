import axios from 'axios';
import { env } from '../../../config/env';
import { integrationError } from '../../../lib/errors';
import { MarketplaceProvider } from '../../../types/domain';

interface ProviderEnv {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: readonly string[];
}

export interface ProviderDefinition {
  key: MarketplaceProvider;
  label: string;
  requiresShopDomain: boolean;
  usesPkce: boolean;
  scopes: readonly string[];
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  configured: boolean;
}

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scopes: string[];
  accountLabel: string;
  metadata: Record<string, unknown>;
}

const providerEnv = env.oauth.providers as Record<MarketplaceProvider, ProviderEnv>;

const LABELS: Record<MarketplaceProvider, string> = {
  amazon: 'Amazon Seller Central',
  shopify: 'Shopify',
  etsy: 'Etsy',
  trendyol: 'Trendyol'
};

const REQUIRES_SHOP: Record<MarketplaceProvider, boolean> = {
  amazon: false,
  shopify: true,
  etsy: false,
  trendyol: false
};

const USES_PKCE: Record<MarketplaceProvider, boolean> = {
  amazon: false,
  shopify: false,
  etsy: true,
  trendyol: false
};

export const getProviderDefinition = (provider: MarketplaceProvider): ProviderDefinition => {
  const config = providerEnv[provider];
  return {
    key: provider,
    label: LABELS[provider],
    requiresShopDomain: REQUIRES_SHOP[provider],
    usesPkce: USES_PKCE[provider],
    scopes: config.scopes,
    authorizeUrl: config.authorizeUrl,
    tokenUrl: config.tokenUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    configured: Boolean(config.clientId && config.clientSecret)
  };
};

export const listProviderDefinitions = (): ProviderDefinition[] =>
  (Object.keys(LABELS) as MarketplaceProvider[]).map(getProviderDefinition);

export const buildAuthorizationUrl = (input: {
  provider: MarketplaceProvider;
  state: string;
  redirectUri: string;
  shopDomain?: string;
  codeChallenge?: string;
  email?: string;
}): string => {
  const definition = getProviderDefinition(input.provider);
  let baseUrl = definition.authorizeUrl;

  if (definition.requiresShopDomain) {
    if (!input.shopDomain) throw integrationError('Shop domain is required for Shopify');
    baseUrl = baseUrl.replace('{shop}', input.shopDomain.replace(/\.myshopify\.com$/i, ''));
  }

  const url = new URL(baseUrl);
  url.searchParams.set('client_id', definition.clientId || 'not-configured');
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', input.state);
  url.searchParams.set('scope', definition.scopes.join(input.provider === 'etsy' ? ' ' : ','));

  if (input.codeChallenge) {
    url.searchParams.set('code_challenge', input.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  if (input.email) url.searchParams.set('login_hint', input.email);

  return url.toString();
};

/**
 * Exchanges the authorization code for tokens. Providers use slightly different
 * token request shapes; all secrets stay server-side.
 */
export const exchangeAuthorizationCode = async (input: {
  provider: MarketplaceProvider;
  code: string;
  redirectUri: string;
  shopDomain?: string;
  codeVerifier?: string;
}): Promise<OAuthTokenSet> => {
  const definition = getProviderDefinition(input.provider);
  const mock = !env.isProduction && !definition.configured && process.env.OAUTH_MOCK_MODE !== 'false';

  if (mock) {
    return mockTokenSet(input.provider, input.shopDomain);
  }

  let tokenUrl = definition.tokenUrl;
  if (definition.requiresShopDomain) {
    if (!input.shopDomain) throw integrationError('Shop domain is required for Shopify token exchange');
    tokenUrl = tokenUrl.replace('{shop}', input.shopDomain.replace(/\.myshopify\.com$/i, ''));
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: definition.clientId,
    client_secret: definition.clientSecret
  });
  if (input.codeVerifier) body.set('code_verifier', input.codeVerifier);

  try {
    const response = await axios.post(tokenUrl, body.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      timeout: 12_000
    });

    const data = response.data as Record<string, unknown>;
    const accessToken = String(data.access_token ?? '');
    if (!accessToken) throw new Error('Provider did not return access_token');

    return {
      accessToken,
      refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
      expiresIn: Number(data.expires_in) || undefined,
      scopes: String(data.scope ?? definition.scopes.join(','))
        .split(/[,\s]+/)
        .filter(Boolean),
      accountLabel: input.shopDomain ?? definition.label,
      metadata: {
        tokenType: data.token_type,
        provider: input.provider
      }
    };
  } catch (error) {
    throw integrationError(`OAuth code exchange failed for ${definition.label}`, {
      reason: error instanceof Error ? error.message : 'unknown'
    });
  }
};

export const refreshProviderToken = async (
  provider: MarketplaceProvider,
  refreshToken: string
): Promise<OAuthTokenSet> => {
  const definition = getProviderDefinition(provider);
  const mock = !env.isProduction && !definition.configured && process.env.OAUTH_MOCK_MODE !== 'false';
  if (mock) return mockTokenSet(provider);

  if (!refreshToken) throw integrationError(`${definition.label} does not support refresh tokens`);
  if (!definition.tokenUrl) throw integrationError(`${definition.label} token endpoint is missing`);

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: definition.clientId,
      client_secret: definition.clientSecret
    });
    const response = await axios.post(definition.tokenUrl, body.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      timeout: 12_000
    });
    const data = response.data as Record<string, unknown>;
    return {
      accessToken: String(data.access_token ?? ''),
      refreshToken: data.refresh_token ? String(data.refresh_token) : refreshToken,
      expiresIn: Number(data.expires_in) || undefined,
      scopes: String(data.scope ?? definition.scopes.join(','))
        .split(/[,\s]+/)
        .filter(Boolean),
      accountLabel: definition.label,
      metadata: { provider, refreshed: true }
    };
  } catch (error) {
    throw integrationError(`Token refresh failed for ${definition.label}`, {
      reason: error instanceof Error ? error.message : 'unknown'
    });
  }
};

const mockTokenSet = (provider: MarketplaceProvider, shopDomain?: string): OAuthTokenSet => ({
  accessToken: `mock_access_${provider}_${Date.now()}`,
  refreshToken: provider === 'shopify' ? undefined : `mock_refresh_${provider}_${Date.now()}`,
  expiresIn: 3600,
  scopes: [...getProviderDefinition(provider).scopes],
  accountLabel: shopDomain ?? `${LABELS[provider]} Sandbox`,
  metadata: { mocked: true, provider }
});
