import dotenv from 'dotenv';

dotenv.config();

const toBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

if (isProduction && !process.env.CREDENTIAL_ENCRYPTION_KEY) {
  throw new Error('CREDENTIAL_ENCRYPTION_KEY must be configured in production.');
}

/**
 * Central, typed runtime configuration.
 *
 * Security note: development fallbacks are intentionally obvious and must never
 * be reused in production. The process refuses to boot in production without
 * an explicit JWT secret and credential-encryption key.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  port: toNumber(process.env.PORT, 3000),
  publicApiUrl: process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  appPublicUrl: process.env.APP_PUBLIC_URL ?? 'http://localhost:5173',

  jwt: {
    secret: process.env.JWT_SECRET ?? 'trade-mind-development-jwt-secret-do-not-use-in-production',
    issuer: process.env.JWT_ISSUER ?? 'trademind.ai',
    audience: process.env.JWT_AUDIENCE ?? 'trademind-api',
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '30m',
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? '30d',
    demoTokenTtl: process.env.DEMO_TOKEN_TTL ?? '7d'
  },

  encryption: {
    // Accepts a 32-byte base64/hex key or a passphrase. The crypto helper
    // derives a deterministic 256-bit key with scrypt when a passphrase is used.
    masterKey: process.env.CREDENTIAL_ENCRYPTION_KEY ?? 'trade-mind-development-encryption-passphrase',
    keyVersion: toNumber(process.env.ENCRYPTION_KEY_VERSION, 1)
  },

  database: {
    url: process.env.DATABASE_URL ?? '',
    // The reference implementation ships with an in-memory adapter so the
    // architecture can be exercised locally; production uses Postgres + RLS.
    driver: (process.env.DATABASE_DRIVER ?? 'memory') as 'memory' | 'postgres'
  },

  email: {
    from: process.env.EMAIL_FROM ?? 'no-reply@trademind.ai',
    verificationTtlMinutes: toNumber(process.env.EMAIL_VERIFICATION_TTL_MINUTES, 60),
    provider: process.env.EMAIL_PROVIDER ?? 'console'
  },

  oauth: {
    stateTtlMinutes: toNumber(process.env.OAUTH_STATE_TTL_MINUTES, 10),
    tokenRefreshIntervalMinutes: toNumber(process.env.TOKEN_REFRESH_INTERVAL_MINUTES, 15),
    providers: {
      amazon: {
        clientId: process.env.AMAZON_CLIENT_ID ?? '',
        clientSecret: process.env.AMAZON_CLIENT_SECRET ?? '',
        authorizeUrl: process.env.AMAZON_AUTHORIZE_URL ?? 'https://sellercentral.amazon.com/apps/authorize/consent',
        tokenUrl: process.env.AMAZON_TOKEN_URL ?? 'https://api.amazon.com/auth/o2/token',
        scopes: ['sellingpartnerapi::migration']
      },
      shopify: {
        clientId: process.env.SHOPIFY_CLIENT_ID ?? '',
        clientSecret: process.env.SHOPIFY_CLIENT_SECRET ?? '',
        authorizeUrl: process.env.SHOPIFY_AUTHORIZE_URL ?? 'https://{shop}.myshopify.com/admin/oauth/authorize',
        tokenUrl: process.env.SHOPIFY_TOKEN_URL ?? 'https://{shop}.myshopify.com/admin/oauth/access_token',
        scopes: ['read_orders', 'read_products', 'read_inventory']
      },
      etsy: {
        clientId: process.env.ETSY_CLIENT_ID ?? '',
        clientSecret: process.env.ETSY_CLIENT_SECRET ?? '',
        authorizeUrl: process.env.ETSY_AUTHORIZE_URL ?? 'https://www.etsy.com/oauth/connect',
        tokenUrl: process.env.ETSY_TOKEN_URL ?? 'https://api.etsy.com/v3/public/oauth/token',
        scopes: ['transactions_r', 'listings_r']
      },
      trendyol: {
        clientId: process.env.TRENDYOL_CLIENT_ID ?? '',
        clientSecret: process.env.TRENDYOL_CLIENT_SECRET ?? '',
        authorizeUrl: process.env.TRENDYOL_AUTHORIZE_URL ?? 'https://apigw.trendyol.com/integration/oauth/authorize',
        tokenUrl: process.env.TRENDYOL_TOKEN_URL ?? 'https://apigw.trendyol.com/integration/oauth/token',
        scopes: ['orders:read', 'products:read']
      }
    }
  },

  sso: {
    // Domain -> IdP routing is persisted per tenant. These defaults keep the
    // discovery endpoint useful in local development.
    defaultRedirectPath: '/api/v1/auth/sso/callback',
    oidcDiscoveryTtlMinutes: toNumber(process.env.OIDC_DISCOVERY_TTL_MINUTES, 60)
  },

  queue: {
    concurrency: toNumber(process.env.INGESTION_QUEUE_CONCURRENCY, 2),
    maxRetries: toNumber(process.env.INGESTION_QUEUE_MAX_RETRIES, 3)
  },

  security: {
    maxUploadBytes: toNumber(process.env.MAX_UPLOAD_BYTES, 15 * 1024 * 1024),
    zeroDataRetention: toBoolean(process.env.LLM_ZERO_DATA_RETENTION, true),
    apiKeyPrefix: process.env.API_KEY_PREFIX ?? 'tm',
    adminApiKey: process.env.ADMIN_API_KEY ?? ''
  },

  notifications: {
    demoLeadSlackWebhookUrl: process.env.DEMO_LEAD_SLACK_WEBHOOK_URL ?? '',
    hubspotWebhookUrl: process.env.HUBSPOT_WEBHOOK_URL ?? '',
    emailWebhookUrl: process.env.EMAIL_WEBHOOK_URL ?? ''
  },

  sftp: {
    host: process.env.SFTP_HOST ?? '',
    port: toNumber(process.env.SFTP_PORT, 22),
    username: process.env.SFTP_USERNAME ?? '',
    privateKey: process.env.SFTP_PRIVATE_KEY ?? '',
    remotePath: process.env.SFTP_REMOTE_PATH ?? '/inbound/trademind'
  }
} as const;

export type AppEnv = typeof env;
