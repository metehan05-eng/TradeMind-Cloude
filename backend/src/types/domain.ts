/**
 * Shared domain model for TradeMind AI.
 *
 * Every tenant-owned record embeds `tenantId`. Repositories and middleware
 * always require it explicitly, which mirrors the Postgres Row-Level Security
 * policies in backend/db/migrations.
 */

export type TenantPlan = 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'pending' | 'active' | 'suspended';
export type KybStatus = 'not_started' | 'pending' | 'verified' | 'failed' | 'manual_review';
export type DomainVerificationLevel = 'none' | 'email' | 'dns' | 'document';
export type DataRetentionMode = 'standard' | 'zero_retention';
export type TaxIdType = 'vkn' | 'mersis' | 'duns' | 'eu_vat' | 'other';

export type RoleKey =
  | 'owner_admin'
  | 'cfo'
  | 'procurement_manager'
  | 'logistics_specialist'
  | 'auditor';

export type Permission =
  | 'tenant:manage'
  | 'tenant:billing'
  | 'members:manage'
  | 'integrations:manage'
  | 'integrations:read'
  | 'financials:read'
  | 'financials:write'
  | 'supplychain:read'
  | 'supplychain:write'
  | 'market:read'
  | 'simulations:run'
  | 'alerts:manage'
  | 'audit:read'
  | 'ingestion:write';

export interface RoleDefinition {
  key: RoleKey;
  name: string;
  description: string;
  permissions: readonly Permission[];
  /** UI hint: component-level gates consume the same permission list. */
  uiScopes: readonly string[];
}

export interface KybProfile {
  status: KybStatus;
  legalEntityName: string;
  country: string;
  taxIdType: TaxIdType;
  taxId: string;
  registryProvider?: string;
  registryReference?: string;
  verifiedAt?: string;
  reason?: string;
  /** Raw provider response is persisted only for audit; never returned in full. */
  providerPayload?: Record<string, unknown>;
}

export interface SsoConfiguration {
  provider: 'saml' | 'oidc';
  enabled: boolean;
  /** e.g. Microsoft Entra ID, Google Workspace, Okta. */
  idpName: string;
  issuer: string;
  clientId: string;
  /** Secrets are encrypted at rest, never exposed by the API. */
  encryptedClientSecret?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  samlEntryPoint?: string;
  samlCertificate?: string;
  /** Email domains routed to this tenant's IdP. */
  domains: string[];
  autoRoute: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  legalName: string;
  displayName: string;
  slug: string;
  country: string;
  taxId: string;
  taxIdType: TaxIdType;
  plan: TenantPlan;
  status: TenantStatus;
  kyb: KybProfile;
  primaryDomain: string;
  domainVerificationLevel: DomainVerificationLevel;
  domainVerifiedAt?: string;
  dataRetention: DataRetentionMode;
  sso?: SsoConfiguration;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  jobTitle: string;
  role: RoleKey;
  status: 'active' | 'invited' | 'disabled';
  emailVerified: boolean;
  passwordHash: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface RefreshSession {
  id: string;
  tenantId: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
  userAgent?: string;
  ip?: string;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
  role: RoleKey;
  permissions: readonly Permission[];
  isDemo: boolean;
  tokenId: string;
}

export interface JwtPayload {
  sub: string;
  tid: string;
  email: string;
  role: RoleKey;
  dem?: boolean;
  jti: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface DomainVerificationChallenge {
  id: string;
  tenantId: string;
  /** The user who initiated the challenge (email verification flow). */
  userId?: string;
  domain: string;
  level: Exclude<DomainVerificationLevel, 'none'>;
  token: string;
  status: 'pending' | 'verified' | 'expired';
  expiresAt: string;
  verifiedAt?: string;
  createdAt: string;
}

export type MarketplaceProvider = 'amazon' | 'shopify' | 'etsy' | 'trendyol';
export type IntegrationProvider = MarketplaceProvider | 'erp' | 'sftp';
export type IntegrationStatus = 'connected' | 'pending' | 'error' | 'revoked';

export interface IntegrationConnection {
  id: string;
  tenantId: string;
  provider: MarketplaceProvider;
  accountLabel: string;
  status: IntegrationStatus;
  scopes: string[];
  /** AES-256-GCM envelope, formatted as `v1.iv.tag.ciphertext`. */
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  expiresAt?: string;
  metadata: Record<string, unknown>;
  lastRefreshedAt?: string;
  lastError?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthStateRecord {
  id: string;
  tenantId: string;
  userId: string;
  provider: MarketplaceProvider;
  state: string;
  codeVerifier?: string;
  redirectUri: string;
  expiresAt: string;
  createdAt: string;
}

export interface ApiKeyRecord {
  id: string;
  tenantId: string;
  name: string;
  prefix: string;
  hashedKey: string;
  encryptedSigningSecret: string;
  scopes: Permission[];
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface IngestJob {
  id: string;
  tenantId: string;
  source: 'bulk_upload' | 'erp_webhook' | 'sftp' | 'oauth_sync';
  status: 'queued' | 'parsing' | 'mapping' | 'completed' | 'failed';
  fileName?: string;
  format?: 'csv' | 'xlsx' | 'json';
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: Array<{ row: number; message: string }>;
  mapping?: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface InventoryRecord {
  id: string;
  tenantId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  currency: string;
  warehouse?: string;
  source: IngestJob['source'];
  updatedAt: string;
}

export interface FinancialTransactionRecord {
  id: string;
  tenantId: string;
  externalId?: string;
  type: 'invoice' | 'payment' | 'cash_flow' | 'inventory_delta';
  amount: number;
  currency: string;
  description: string;
  counterparty?: string;
  occurredAt: string;
  source: IngestJob['source'];
  createdAt: string;
}

export interface NotificationChannel {
  id: string;
  tenantId: string;
  type: 'slack' | 'teams' | 'email';
  label: string;
  endpoint: string;
  encryptedSecret?: string;
  events: string[];
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationMacroInput {
  fxUsdTryChangePct: number;
  freightCostChangePct: number;
  commodityPriceChangePct: number;
  tariffChangePct: number;
  demandChangePct: number;
  logisticsDelayDays: number;
}

export interface SimulationBaseline {
  revenue: number;
  cogs: number;
  freight: number;
  opex: number;
  fxExposurePct: number;
  commodityExposurePct: number;
  currency: string;
}

export interface SimulationRequest {
  baseline: SimulationBaseline;
  macro: SimulationMacroInput;
  horizonMonths?: number;
}

export interface SimulationScenarioResult {
  scenario: string;
  revenue: number;
  cogs: number;
  freight: number;
  opex: number;
  netProfit: number;
  netMarginPct: number;
  marginDeltaPct: number;
  riskLevel: 'low' | 'medium' | 'high';
  drivers: string[];
}

export interface SimulationResult {
  baseline: SimulationScenarioResult;
  stressed: SimulationScenarioResult;
  sensitivity: Array<{ variable: string; marginImpactPct: number }>;
  recommendations: string[];
  generatedAt: string;
  dataRetention: DataRetentionMode;
}

export interface DemoRequest {
  id: string;
  businessEmail: string;
  companyName: string;
  jobTitle: string;
  annualTradeVolume: string;
  primaryErp: string;
  primaryMarketplace: string;
  country?: string;
  status: 'pending_confirmation' | 'confirmed' | 'provisioned' | 'rejected';
  confirmationTokenHash: string;
  source: 'landing' | 'auth';
  leadScore: number;
  provisionedTenantId?: string;
  provisionedUserId?: string;
  createdAt: string;
  confirmedAt?: string;
  provisionedAt?: string;
}

export interface DemoProvisionResult {
  tenantId: string;
  userId: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  seededPortfolio: string[];
}

export interface ErpWebhookEvent {
  eventId: string;
  eventType: 'invoice.created' | 'inventory.delta' | 'cashflow.transaction';
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}
