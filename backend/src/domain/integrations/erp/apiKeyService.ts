import { env } from '../../../config/env';
import { badRequest, notFound } from '../../../lib/errors';
import { decryptSecret, encryptSecret, generateApiKey, hmacSha256, randomToken, timingSafeCompare } from '../../../lib/crypto';
import { store } from '../../../repositories/inMemory/store';
import { ApiKeyRecord, Permission } from '../../../types/domain';

const ALLOWED_SCOPES: Permission[] = [
  'ingestion:write',
  'financials:read',
  'financials:write',
  'supplychain:read',
  'supplychain:write',
  'market:read'
];

export interface CreatedApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: Permission[];
  apiKey: string;
  signingSecret: string;
  expiresAt?: string;
}

const sanitize = (record: ApiKeyRecord) => ({
  id: record.id,
  name: record.name,
  prefix: record.prefix,
  scopes: record.scopes,
  createdAt: record.createdAt,
  lastUsedAt: record.lastUsedAt,
  expiresAt: record.expiresAt
});

/**
 * Enterprise API-key lifecycle for ERP gateways.
 * Plaintext key + HMAC signing secret are returned exactly once.
 */
export class ApiKeyService {
  create(input: {
    tenantId: string;
    userId: string;
    name: string;
    scopes: string[];
    expiresInDays?: number;
  }): CreatedApiKey {
    const scopes = input.scopes as Permission[];
    const invalid = scopes.filter((scope) => !ALLOWED_SCOPES.includes(scope));
    if (invalid.length > 0) throw badRequest(`Unsupported scopes: ${invalid.join(', ')}`);
    if (scopes.length === 0) throw badRequest('At least one scope is required');

    const { plaintext, prefix, hashed } = generateApiKey();
    const signingSecret = `whsec_${randomToken(24)}`;
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
      : undefined;

    const record = store.apiKeys.create({
      tenantId: input.tenantId,
      name: input.name,
      prefix,
      hashedKey: hashed,
      encryptedSigningSecret: encryptSecret(signingSecret),
      scopes,
      createdBy: input.userId,
      expiresAt
    });

    return {
      id: record.id,
      name: record.name,
      prefix,
      scopes,
      apiKey: plaintext,
      signingSecret,
      expiresAt
    };
  }

  list(tenantId: string) {
    return store.apiKeys.list(tenantId).map(sanitize);
  }

  revoke(tenantId: string, id: string): void {
    const record = store.apiKeys.revoke(tenantId, id);
    if (!record) throw notFound('API key');
  }

  /**
   * Verifies `x-trademind-signature: sha256=<hex>` against the exact raw body.
   * Legacy unsigned requests are allowed only outside production.
   */
  verifySignature(tenantId: string, apiKeyId: string, signature: string | undefined, rawBody: string): boolean {
    const record = store.apiKeys.findById(tenantId, apiKeyId);
    if (!record) return false;
    if (!signature) return !env.isProduction;

    const provided = signature.replace(/^sha256=/, '').trim();
    const expected = hmacSha256(decryptSecret(record.encryptedSigningSecret), rawBody);
    return timingSafeCompare(provided, expected);
  }

  scopesFor(tenantId: string, id: string): readonly Permission[] {
    return store.apiKeys.findById(tenantId, id)?.scopes ?? [];
  }
}

export const apiKeyService = new ApiKeyService();
