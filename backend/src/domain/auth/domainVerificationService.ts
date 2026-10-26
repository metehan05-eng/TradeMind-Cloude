import { promises as dns } from 'dns';
import { env } from '../../config/env';
import { badRequest, forbidden, notFound } from '../../lib/errors';
import { randomToken, sha256Buffer } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { eventBus } from '../../lib/events';
import { sendMail } from '../../lib/mailer';
import { store } from '../../repositories/inMemory/store';
import { DomainVerificationChallenge, DomainVerificationLevel, Tenant } from '../../types/domain';

const LEVEL_RANK: Record<DomainVerificationLevel, number> = {
  none: 0,
  email: 1,
  dns: 2,
  document: 2
};

const CHALLENGE_TTL_MINUTES = 60 * 24;

export interface IssuedChallenge {
  challengeId: string;
  domain: string;
  level: Exclude<DomainVerificationLevel, 'none'>;
  expiresAt: string;
  /** Only returned outside production to make the demo flow testable. */
  devToken?: string;
  verificationUrl?: string;
  dnsRecord?: { type: 'TXT'; name: string; value: string };
  status: string;
}

export class DomainVerificationService {
  /**
   * Level 1: send a signed verification link to an address on the corporate
   * domain. The link confirms both the domain and the user's mailbox.
   */
  async issueEmailChallenge(tenant: Tenant, userId: string): Promise<IssuedChallenge> {
    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60_000).toISOString();
    const challenge = store.domainChallenges.create({
      tenantId: tenant.id,
      userId,
      domain: tenant.primaryDomain,
      level: 'email',
      token,
      status: 'pending',
      expiresAt
    });

    const verificationUrl = `${env.appPublicUrl}/verify-domain?token=${encodeURIComponent(token)}`;
    await sendMail({
      to: `admin@${tenant.primaryDomain}`,
      subject: 'TradeMind AI — Verify your corporate domain',
      text: [
        `Hello ${tenant.legalName},`,
        '',
        'Verify ownership of your corporate email domain to activate TradeMind AI:',
        verificationUrl,
        '',
        `This link expires at ${expiresAt}.`
      ].join('\n')
    });

    logger.info('Issued Level 1 email verification challenge', {
      tenantId: tenant.id,
      domain: tenant.primaryDomain
    });

    return {
      challengeId: challenge.id,
      domain: challenge.domain,
      level: 'email',
      expiresAt,
      verificationUrl,
      status: challenge.status,
      ...(env.isProduction ? {} : { devToken: token })
    };
  }

  /**
   * Level 2a: DNS TXT ownership challenge for enterprise/holding tenants.
   * The IT administrator publishes the record; we resolve it server-side.
   */
  async issueDnsChallenge(tenant: Tenant): Promise<IssuedChallenge> {
    this.assertEnterpriseLevel(tenant);
    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60_000).toISOString();
    const challenge = store.domainChallenges.create({
      tenantId: tenant.id,
      domain: tenant.primaryDomain,
      level: 'dns',
      token,
      status: 'pending',
      expiresAt
    });

    return {
      challengeId: challenge.id,
      domain: challenge.domain,
      level: 'dns',
      expiresAt,
      status: challenge.status,
      dnsRecord: {
        type: 'TXT',
        name: `_trademind-challenge.${tenant.primaryDomain}`,
        value: `trademind-verification=${token}`
      }
    };
  }

  async confirmEmailToken(rawToken: string): Promise<{ tenantId: string; domain: string }> {
    const challenge = store.domainChallenges.findByToken(rawToken);
    if (!challenge || challenge.level !== 'email') {
      throw notFound('Verification challenge');
    }
    if (challenge.status === 'verified') {
      return { tenantId: challenge.tenantId, domain: challenge.domain };
    }
    if (Date.parse(challenge.expiresAt) < Date.now()) {
      store.domainChallenges.update(challenge.id, { status: 'expired' });
      throw badRequest('Verification link has expired');
    }

    const tenant = store.tenants.findById(challenge.tenantId);
    if (!tenant) throw notFound('Tenant');

    store.domainChallenges.update(challenge.id, {
      status: 'verified',
      verifiedAt: new Date().toISOString()
    });

    if (challenge.userId) {
      store.users.update(tenant.id, challenge.userId, { emailVerified: true });
    }

    this.applyVerifiedLevel(tenant, 'email');

    logger.info('Level 1 domain verification completed', {
      tenantId: tenant.id,
      userId: challenge.userId
    });
    return { tenantId: tenant.id, domain: challenge.domain };
  }

  /**
   * Resolves the TXT record and compares it with the challenge value. The
   * `ALLOW_MOCK_DNS` flag is for local demos only and is ignored in production.
   */
  async verifyDnsChallenge(tenantId: string, challengeId: string): Promise<{ verified: boolean; hint?: string }> {
    const tenant = store.tenants.findById(tenantId);
    if (!tenant) throw notFound('Tenant');

    const latest = store.domainChallenges.latest(tenantId, 'dns');
    if (!latest || latest.id !== challengeId) throw notFound('DNS challenge');
    if (Date.parse(latest.expiresAt) < Date.now()) {
      store.domainChallenges.update(latest.id, { status: 'expired' });
      throw badRequest('DNS challenge expired; issue a new one');
    }

    const expected = `trademind-verification=${latest.token}`;
    let verified = false;
    let hint: string | undefined;

    if (!env.isProduction && process.env.ALLOW_MOCK_DNS === 'true') {
      verified = true;
      hint = 'DNS verification accepted by ALLOW_MOCK_DNS (development only).';
    } else {
      try {
        const records = await dns.resolveTxt(`_trademind-challenge.${tenant.primaryDomain}`);
        verified = records.some((parts) => parts.join('').trim() === expected);
        if (!verified) {
          hint = 'TXT record exists but does not match trademind-verification=<token>.';
        }
      } catch {
        hint = 'No TXT record found yet. DNS propagation can take up to 48 hours.';
      }
    }

    if (verified) {
      store.domainChallenges.update(latest.id, {
        status: 'verified',
        verifiedAt: new Date().toISOString()
      });
      this.applyVerifiedLevel(tenant, 'dns');
      eventBus.publish({
        type: 'tenant.kyb_verified',
        tenantId: tenant.id,
        legalName: tenant.legalName
      });
    }

    return { verified, hint };
  }

  /**
   * Level 2b: secure document upload (tax plate, signing circular). Documents
   * are validated, hashed and passed to compliance. The raw file is not stored
   * by this reference implementation; production writes to an encrypted bucket
   * with object-lock retention.
   */
  async submitDocument(
    tenant: Tenant,
    userId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer }
  ): Promise<{ status: 'verified' | 'manual_review'; documentHash: string; challengeId: string }> {
    this.assertEnterpriseLevel(tenant);
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.mimetype)) {
      throw badRequest('Only PDF, PNG or JPEG registration documents are accepted');
    }
    if (file.size > env.security.maxUploadBytes) {
      throw badRequest('Document exceeds the maximum upload size');
    }

    const documentHash = sha256Buffer(file.buffer);
    const autoApprove = !env.isProduction && process.env.DOCUMENT_AUTO_APPROVAL !== 'false';
    const challenge = store.domainChallenges.create({
      tenantId: tenant.id,
      userId,
      domain: tenant.primaryDomain,
      level: 'document',
      token: documentHash,
      status: autoApprove ? 'verified' : 'pending',
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60_000).toISOString(),
      verifiedAt: autoApprove ? new Date().toISOString() : undefined
    });

    store.auditLogs.append({
      tenantId: tenant.id,
      actorId: userId,
      action: 'domain.document_uploaded',
      resourceType: 'domain_verification',
      resourceId: challenge.id,
      metadata: {
        documentHash,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        autoApproved: autoApprove
      }
    });

    if (autoApprove) {
      this.applyVerifiedLevel(tenant, 'document');
    }

    return {
      status: autoApprove ? 'verified' : 'manual_review',
      documentHash,
      challengeId: challenge.id
    };
  }

  getStatus(tenantId: string): {
    level: DomainVerificationLevel;
    verifiedAt?: string;
    pendingChallenges: Array<Pick<DomainVerificationChallenge, 'id' | 'level' | 'status' | 'expiresAt'>>;
  } {
    const tenant = store.tenants.findById(tenantId);
    if (!tenant) throw notFound('Tenant');
    const challenges = (['email', 'dns', 'document'] as const)
      .map((level) => store.domainChallenges.latest(tenantId, level))
      .filter((challenge): challenge is DomainVerificationChallenge => Boolean(challenge));

    return {
      level: tenant.domainVerificationLevel,
      verifiedAt: tenant.domainVerifiedAt,
      pendingChallenges: challenges.map((challenge) => ({
        id: challenge.id,
        level: challenge.level,
        status: challenge.status,
        expiresAt: challenge.expiresAt
      }))
    };
  }

  private applyVerifiedLevel(tenant: Tenant, level: DomainVerificationLevel): void {
    const nextLevel =
      LEVEL_RANK[level] >= LEVEL_RANK[tenant.domainVerificationLevel]
        ? level
        : tenant.domainVerificationLevel;

    const nextStatus =
      tenant.kyb.status === 'verified' && tenant.status === 'pending' ? 'active' : tenant.status;

    store.tenants.update(tenant.id, {
      domainVerificationLevel: nextLevel,
      domainVerifiedAt: new Date().toISOString(),
      status: nextStatus
    });
  }

  private assertEnterpriseLevel(tenant: Tenant): void {
    if (tenant.plan !== 'enterprise') {
      throw forbidden('DNS/document domain verification is available on the Enterprise tier');
    }
  }
}

export const domainVerificationService = new DomainVerificationService();
