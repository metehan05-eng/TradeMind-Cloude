import { KybProfile, TaxIdType } from '../../types/domain';
import { logger } from '../../lib/logger';

export interface KybCheckInput {
  legalEntityName: string;
  country: string;
  taxIdType: TaxIdType;
  taxId: string;
}

export interface KybCheckResult {
  status: 'verified' | 'failed' | 'manual_review';
  registryProvider: string;
  registryReference?: string;
  confidence: number;
  reason?: string;
  payload?: Record<string, unknown>;
}

/**
 * Adapter contract for tax/company registries (GİB, MERSİS, D&B, Companies House,
 * EU VIES, etc.). Implementations must never log raw tax identifiers.
 */
export interface KybProvider {
  readonly name: string;
  verify(input: KybCheckInput): Promise<KybCheckResult>;
}

/**
 * Deterministic mock provider used in local/demo environments.
 *
 * Production swap: `new KybVerificationService(new GibTrProvider(...))` or a
 * composed provider that routes by country. No calling code changes required.
 */
export class MockKybProvider implements KybProvider {
  readonly name = 'mock-registry';

  async verify(input: KybCheckInput): Promise<KybCheckResult> {
    const normalized = input.taxId.replace(/\s/g, '');
    const isTurkey = input.country === 'TR';

    if (!input.legalEntityName.trim()) {
      return {
        status: 'failed',
        registryProvider: this.name,
        confidence: 0,
        reason: 'Legal entity name is missing'
      };
    }

    if (normalized === '0000000000' || normalized === '9999999999') {
      return {
        status: 'failed',
        registryProvider: this.name,
        confidence: 0,
        reason: 'Registry reports the company as inactive'
      };
    }

    if (input.taxIdType === 'vkn' && (!isTurkey || !/^\d{10}$/.test(normalized))) {
      return {
        status: 'failed',
        registryProvider: this.name,
        confidence: 0,
        reason: 'VKN must be a 10-digit Turkish tax number'
      };
    }

    if (input.taxIdType === 'mersis' && !/^\d{16}$/.test(normalized)) {
      return {
        status: 'failed',
        registryProvider: this.name,
        confidence: 0,
        reason: 'MERSİS number must contain 16 digits'
      };
    }

    if (input.taxIdType === 'duns' && !/^\d{9}$/.test(normalized)) {
      return {
        status: 'failed',
        registryProvider: this.name,
        confidence: 0,
        reason: 'DUNS number must contain 9 digits'
      };
    }

    // A small deterministic branch exercises manual-review UX.
    if (input.taxIdType === 'other') {
      return {
        status: 'manual_review',
        registryProvider: this.name,
        confidence: 0.4,
        reason: 'Unsupported registry type requires compliance review'
      };
    }

    return {
      status: 'verified',
      registryProvider: this.name,
      registryReference: `MOCK-${input.country}-${normalized.slice(-4)}`,
      confidence: 0.93,
      payload: {
        active: true,
        incorporated: true,
        country: input.country,
        checkedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * Wrapper around one or more KYB providers. It normalizes results into the
 * tenant `KybProfile`, enforces fail-closed behaviour and keeps provider payloads
 * out of API responses.
 */
export class KYBVerificationService {
  constructor(private readonly provider: KybProvider = new MockKybProvider()) {}

  async verify(input: KybCheckInput): Promise<KybProfile> {
    const checkedAt = new Date().toISOString();

    try {
      const result = await this.provider.verify(input);
      logger.info('KYB registry check completed', {
        provider: this.provider.name,
        country: input.country,
        taxIdType: input.taxIdType,
        status: result.status
      });

      const status =
        result.status === 'verified'
          ? 'verified'
          : result.status === 'manual_review'
            ? 'manual_review'
            : 'failed';

      return {
        status,
        legalEntityName: input.legalEntityName,
        country: input.country,
        taxIdType: input.taxIdType,
        taxId: input.taxId,
        registryProvider: result.registryProvider,
        registryReference: result.registryReference,
        verifiedAt: status === 'verified' ? checkedAt : undefined,
        reason: result.reason,
        providerPayload: result.payload
      };
    } catch (error) {
      logger.error('KYB provider failure', { provider: this.provider.name });
      return {
        status: 'manual_review',
        legalEntityName: input.legalEntityName,
        country: input.country,
        taxIdType: input.taxIdType,
        taxId: input.taxId,
        registryProvider: this.provider.name,
        reason: `Provider unavailable: ${(error as Error).message}`
      };
    }
  }
}

export const kybVerificationService = new KYBVerificationService();
