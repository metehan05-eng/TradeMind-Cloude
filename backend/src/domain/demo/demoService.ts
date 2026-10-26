import bcrypt from 'bcryptjs';
import { conflict, notFound } from '../../lib/errors';
import { randomToken, sha256 } from '../../lib/crypto';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { eventBus } from '../../lib/events';
import { sendMail } from '../../lib/mailer';
import { store } from '../../repositories/inMemory/store';
import { DemoProvisionResult, DemoRequest } from '../../types/domain';
import { assertCorporateEmail } from '../auth/corporateDomainPolicy';
import { notificationService } from '../notifications/notificationService';
import { DemoRequestInput } from './demoSchemas';

const VOLUME_SCORE: Record<string, number> = {
  under_500k: 10,
  '500k_2m': 20,
  '2m_10m': 35,
  '10m_50m': 50,
  '50m_plus': 60
};

const ERP_SCORE: Record<string, number> = {
  sap: 15,
  oracle_netsuite: 15,
  logo: 10,
  mikro: 10,
  odoo: 8,
  none: 0,
  other: 5
};

const MARKETPLACE_SCORE: Record<string, number> = {
  amazon: 10,
  shopify: 10,
  etsy: 5,
  trendyol: 8,
  none: 0,
  other: 3
};

const calculateLeadScore = (input: DemoRequestInput): number => {
  const title = input.jobTitle.toLowerCase();
  const seniority =
    /(cfo|chief|head|director|vp|vice president|owner|founder|genel müdür|yönetici)/.test(title)
      ? 15
      : /(manager|müdür|lead)/.test(title)
        ? 8
        : 0;
  return Math.min(
    100,
    VOLUME_SCORE[input.annualTradeVolume] +
      ERP_SCORE[input.primaryErp] +
      MARKETPLACE_SCORE[input.primaryMarketplace] +
      seniority
  );
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'demo';

const temporaryPassword = (): string => `Tm!A${randomToken(9)}9a`;

export class DemoService {
  /**
   * Lead workflow:
   *  1. Validate corporate email (public webmail rejected).
   *  2. Score lead and persist a pending request (token stored as a hash).
   *  3. Email a confirmation link; forward the lead to Slack/HubSpot.
   *  4. On confirmation, provision an isolated sandbox tenant + seeded data.
   */
  async request(input: DemoRequestInput): Promise<{
    requestId: string;
    status: string;
    leadScore: number;
    message: string;
    devConfirmationUrl?: string;
    devToken?: string;
    crm: { slack: boolean; hubspot: boolean };
  }> {
    const { email } = assertCorporateEmail(input.businessEmail);

    const recent = store.demoRequests
      .list()
      .find(
        (request) =>
          request.businessEmail === email &&
          request.status !== 'rejected' &&
          Date.now() - Date.parse(request.createdAt) < 30 * 86_400_000
      );
    if (recent) {
      throw conflict('A demo request for this email already exists. Please check your inbox.');
    }

    const token = randomToken(32);
    const leadScore = calculateLeadScore(input);
    const request = store.demoRequests.create({
      businessEmail: email,
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      annualTradeVolume: input.annualTradeVolume,
      primaryErp: input.primaryErp,
      primaryMarketplace: input.primaryMarketplace,
      country: input.country,
      status: 'pending_confirmation',
      confirmationTokenHash: sha256(token),
      source: input.source,
      leadScore
    });

    const confirmationUrl = `${env.appPublicUrl}/demo/confirm?token=${encodeURIComponent(token)}`;

    await sendMail({
      to: email,
      subject: 'TradeMind AI — Confirm your institutional demo',
      text: [
        `Hello ${input.jobTitle} at ${input.companyName},`,
        '',
        'Confirm your institutional demo request to instantly provision a sandbox account:',
        confirmationUrl,
        '',
        'The sandbox includes sample NVDA, BTC/USD and Brent Oil analytics.'
      ].join('\n')
    });

    const crm = await notificationService.forwardDemoLead(request, confirmationUrl);

    eventBus.publish({
      type: 'demo.requested',
      requestId: request.id,
      companyName: request.companyName
    });

    logger.info('Demo request captured', {
      requestId: request.id,
      leadScore,
      primaryErp: input.primaryErp
    });

    return {
      requestId: request.id,
      status: request.status,
      leadScore,
      message: 'Confirmation email sent. Confirm to provision your sandbox workspace.',
      ...(env.isProduction ? {} : { devConfirmationUrl: confirmationUrl, devToken: token }),
      crm
    };
  }

  /**
   * Confirming the email provisions an isolated demo tenant with pre-populated
   * market/portfolio data and a one-time temporary password.
   */
  async confirm(token: string): Promise<DemoProvisionResult & { requestId: string; alreadyProvisioned: boolean }> {
    const request = store.demoRequests.findByTokenHash(sha256(token));
    if (!request) throw notFound('Demo confirmation');
    if (request.status === 'provisioned') {
      throw conflict('This demo has already been provisioned. Use the credentials from the first confirmation.');
    }

    const { email, domain } = assertCorporateEmail(request.businessEmail);
    if (store.users.findByEmail(email)) {
      throw conflict('This email already belongs to an account. Please sign in instead.');
    }

    const tempPassword = temporaryPassword();
    const tenant = store.tenants.create({
      legalName: request.companyName,
      displayName: `${request.companyName} Demo`,
      slug: `${slugify(request.companyName)}-demo`,
      country: request.country ?? 'TR',
      taxId: `DEMO-${request.id.slice(0, 12)}`,
      taxIdType: 'other',
      plan: 'professional',
      status: 'active',
      kyb: {
        status: 'verified',
        legalEntityName: request.companyName,
        country: request.country ?? 'TR',
        taxIdType: 'other',
        taxId: `DEMO-${request.id.slice(0, 12)}`,
        registryProvider: 'sandbox-provisioner',
        registryReference: `DEMO-${request.id}`,
        verifiedAt: new Date().toISOString()
      },
      primaryDomain: domain,
      domainVerificationLevel: 'email',
      domainVerifiedAt: new Date().toISOString(),
      dataRetention: 'zero_retention'
    });

    const user = store.users.create({
      tenantId: tenant.id,
      email,
      fullName: request.jobTitle,
      jobTitle: request.jobTitle,
      role: 'owner_admin',
      status: 'active',
      emailVerified: true,
      passwordHash: bcrypt.hashSync(tempPassword, 12)
    });

    const seededPortfolio = [
      'NVDA — AI semiconductor equity analytics',
      'BTC/USD — treasury & volatility simulation',
      'Brent Oil — freight and commodity stress test'
    ];
    const now = new Date().toISOString();
    store.inventory.upsertMany([
      {
        id: `${tenant.id}-nvda`,
        tenantId: tenant.id,
        sku: 'DEMO-NVDA',
        productName: 'NVDA AI Portfolio Position',
        quantity: 120,
        unitCost: 118.4,
        currency: 'USD',
        warehouse: 'Sandbox',
        source: 'bulk_upload',
        updatedAt: now
      },
      {
        id: `${tenant.id}-btc`,
        tenantId: tenant.id,
        sku: 'DEMO-BTCUSD',
        productName: 'BTC/USD Treasury Allocation',
        quantity: 3,
        unitCost: 64200,
        currency: 'USD',
        warehouse: 'Sandbox',
        source: 'bulk_upload',
        updatedAt: now
      },
      {
        id: `${tenant.id}-brent`,
        tenantId: tenant.id,
        sku: 'DEMO-BRENT',
        productName: 'Brent Crude Hedge',
        quantity: 500,
        unitCost: 78.2,
        currency: 'USD',
        warehouse: 'Sandbox',
        source: 'bulk_upload',
        updatedAt: now
      }
    ]);
    store.transactions.insertMany([
      {
        id: `${tenant.id}-tx-1`,
        tenantId: tenant.id,
        type: 'invoice',
        amount: 248_000,
        currency: 'USD',
        description: 'Sandbox marketplace settlement (Amazon US + EU)',
        counterparty: 'Amazon',
        occurredAt: now,
        source: 'oauth_sync',
        createdAt: now
      },
      {
        id: `${tenant.id}-tx-2`,
        tenantId: tenant.id,
        type: 'cash_flow',
        amount: -18_400,
        currency: 'USD',
        description: 'Sandbox ocean freight & customs',
        counterparty: 'Maersk',
        occurredAt: now,
        source: 'erp_webhook',
        createdAt: now
      }
    ]);

    store.demoRequests.update(request.id, {
      status: 'provisioned',
      confirmedAt: now,
      provisionedAt: now,
      provisionedTenantId: tenant.id,
      provisionedUserId: user.id
    });

    eventBus.publish({
      type: 'demo.provisioned',
      tenantId: tenant.id,
      requestId: request.id
    });

    await sendMail({
      to: email,
      subject: 'TradeMind AI — Your sandbox is ready',
      text: [
        `Your sandbox workspace for ${request.companyName} is ready.`,
        `Login: ${env.appPublicUrl}`,
        `Email: ${email}`,
        'Use the temporary password shown after confirmation and rotate it immediately.'
      ].join('\n')
    });

    logger.info('Demo sandbox provisioned', {
      requestId: request.id,
      tenantId: tenant.id,
      leadScore: request.leadScore
    });

    return {
      requestId: request.id,
      alreadyProvisioned: false,
      tenantId: tenant.id,
      userId: user.id,
      email,
      temporaryPassword: tempPassword,
      loginUrl: env.appPublicUrl,
      seededPortfolio
    };
  }

  listRequests(): Array<Omit<DemoRequest, 'confirmationTokenHash'> & { confirmationTokenHash?: never }> {
    return store.demoRequests.list().map((request) => {
      const { confirmationTokenHash: _hash, ...safe } = request;
      return safe;
    });
  }

  getRequest(id: string) {
    const request = store.demoRequests.findById(id);
    if (!request) throw notFound('Demo request');
    const { confirmationTokenHash: _hash, ...safe } = request;
    return safe;
  }

  analytics(): {
    total: number;
    confirmed: number;
    provisioned: number;
    averageLeadScore: number;
    byErp: Record<string, number>;
    byMarketplace: Record<string, number>;
  } {
    const requests = store.demoRequests.list();
    const byErp: Record<string, number> = {};
    const byMarketplace: Record<string, number> = {};
    requests.forEach((request) => {
      byErp[request.primaryErp] = (byErp[request.primaryErp] ?? 0) + 1;
      byMarketplace[request.primaryMarketplace] =
        (byMarketplace[request.primaryMarketplace] ?? 0) + 1;
    });
    return {
      total: requests.length,
      confirmed: requests.filter((request) => request.confirmedAt).length,
      provisioned: requests.filter((request) => request.status === 'provisioned').length,
      averageLeadScore:
        requests.length > 0
          ? Math.round(
              requests.reduce((sum, request) => sum + request.leadScore, 0) / requests.length
            )
          : 0,
      byErp,
      byMarketplace
    };
  }
}

export const demoService = new DemoService();
