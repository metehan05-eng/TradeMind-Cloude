import bcrypt from 'bcryptjs';
import { store } from './store';
import { Tenant, User } from '../../types/domain';

const now = new Date().toISOString();

const baseTenant = {
  country: 'TR',
  plan: 'enterprise' as const,
  status: 'active' as const,
  dataRetention: 'zero_retention' as const,
  domainVerificationLevel: 'dns' as const,
  domainVerifiedAt: now,
  createdAt: now,
  updatedAt: now
};

const demoTenant: Omit<Tenant, 'id'> = {
  ...baseTenant,
  legalName: 'TechTrend E-Ticaret A.Ş.',
  displayName: 'TechTrend',
  slug: 'techtrend',
  taxId: '8492019385',
  taxIdType: 'vkn',
  primaryDomain: 'techtrend.com',
  kyb: {
    status: 'verified',
    legalEntityName: 'TechTrend E-Ticaret A.Ş.',
    country: 'TR',
    taxIdType: 'vkn',
    taxId: '8492019385',
    registryProvider: 'mock-tr-gib',
    registryReference: 'MOCK-TR-8492019385',
    verifiedAt: now
  }
};

const ssoTenant: Omit<Tenant, 'id'> = {
  ...baseTenant,
  legalName: 'Global Holding A.Ş.',
  displayName: 'Global Holding',
  slug: 'global-holding',
  taxId: '1234567890',
  taxIdType: 'vkn',
  primaryDomain: 'globalholding.com',
  kyb: {
    status: 'verified',
    legalEntityName: 'Global Holding A.Ş.',
    country: 'TR',
    taxIdType: 'vkn',
    taxId: '1234567890',
    registryProvider: 'mock-tr-gib',
    registryReference: 'MOCK-TR-1234567890',
    verifiedAt: now
  },
  sso: {
    provider: 'oidc',
    enabled: true,
    idpName: 'Microsoft Entra ID',
    issuer: 'https://login.microsoftonline.com/mock-tenant-id/v2.0',
    clientId: 'mock-global-holding-client-id',
    authorizationEndpoint:
      'https://login.microsoftonline.com/mock-tenant-id/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/mock-tenant-id/oauth2/v2.0/token',
    userInfoEndpoint: 'https://graph.microsoft.com/oidc/userinfo',
    domains: ['globalholding.com'],
    autoRoute: true,
    createdAt: now,
    updatedAt: now
  }
};

/**
 * Deterministic development seed. In production, tenants arrive through KYB and
 * the demo-request provisioning pipeline instead.
 */
export const seedStore = (): void => {
  if (store.tenants.list().length > 0) return;

  const techTrend = store.tenants.create(demoTenant);
  const globalHolding = store.tenants.create(ssoTenant);

  const demoUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
    tenantId: techTrend.id,
    email: 'demo@techtrend.com',
    fullName: 'Demo Yönetici',
    jobTitle: 'Head of Global Trade',
    role: 'owner_admin',
    status: 'active',
    emailVerified: true,
    passwordHash: bcrypt.hashSync('admin', 10)
  };
  store.users.create(demoUser);

  store.users.create({
    tenantId: globalHolding.id,
    email: 'cfo@globalholding.com',
    fullName: 'Global CFO',
    jobTitle: 'Chief Financial Officer',
    role: 'cfo',
    status: 'active',
    emailVerified: true,
    passwordHash: bcrypt.hashSync('GlobalDemo123!', 10)
  });

  store.inventory.upsertMany([
    {
      id: 'seed-inv-1',
      tenantId: techTrend.id,
      sku: 'TM-NVDA-CHIP',
      productName: 'AI Accelerator Module',
      quantity: 120,
      unitCost: 1840,
      currency: 'USD',
      warehouse: 'Istanbul DC',
      source: 'bulk_upload',
      updatedAt: now
    }
  ]);

  store.transactions.insertMany([
    {
      id: 'seed-tx-1',
      tenantId: techTrend.id,
      type: 'invoice',
      amount: 148500,
      currency: 'USD',
      description: 'Q3 EU marketplace settlement',
      counterparty: 'Amazon EU SARL',
      occurredAt: now,
      source: 'oauth_sync',
      createdAt: now
    }
  ]);
};
