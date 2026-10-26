import { env } from '../config/env';
import { DataRetentionMode } from '../types/domain';
import { logger } from '../lib/logger';

/**
 * AI privacy boundary.
 *
 * TradeMind never sends tenant financial records to consumer AI endpoints in
 * zero-retention mode. This helper centralizes the provider contract flag and
 * request metadata so every external LLM call can be audited.
 */
export const aiRequestPolicy = (tenantRetention: DataRetentionMode = 'zero_retention') => {
  const zeroRetention = tenantRetention === 'zero_retention' && env.security.zeroDataRetention;
  if (!zeroRetention) {
    logger.warn('AI request without zero-retention guarantee', { tenantRetention });
  }
  return {
    zeroRetention,
    headers: {
      'X-TradeMind-Data-Retention': zeroRetention ? 'zero' : 'standard',
      'X-TradeMind-Purpose': 'tenant-analytics'
    },
    /** Never persist prompts/completions in application logs. */
    logPrompts: false,
    providerOptInForTraining: false
  } as const;
};
