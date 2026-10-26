import { NextFunction, Request, Response } from 'express';
import { sha256, timingSafeCompare } from '../lib/crypto';
import { forbidden, unauthorized } from '../lib/errors';
import { store } from '../repositories/inMemory/store';

/**
 * API-key authentication for ERP webhooks.
 *
 * Keys are formatted `tm_<prefix>_<secret>`. We index by the non-secret prefix
 * and verify the SHA-256 digest in constant time. Scopes are enforced by the
 * downstream route (e.g. `ingestion:write`).
 */
export const requireApiKey = (scopes: string[] = []) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers['x-api-key'];
    const raw = Array.isArray(header) ? header[0] : header;
    if (!raw) {
      next(unauthorized('Missing x-api-key header'));
      return;
    }

    const parts = raw.split('_');
    if (parts.length < 3) {
      next(unauthorized('Malformed API key'));
      return;
    }
    const prefix = `${parts[0]}_${parts[1]}`;
    const record = store.apiKeys.findByPrefix(prefix);
    if (!record) {
      next(unauthorized('Unknown API key'));
      return;
    }
    if (record.expiresAt && Date.parse(record.expiresAt) < Date.now()) {
      next(unauthorized('API key expired'));
      return;
    }
    if (!timingSafeCompare(sha256(raw), record.hashedKey)) {
      next(unauthorized('Invalid API key'));
      return;
    }
    const missing = scopes.filter((scope) => !record.scopes.includes(scope as never));
    if (missing.length > 0) {
      next(forbidden(`API key missing scopes: ${missing.join(', ')}`));
      return;
    }

    store.apiKeys.touch(record.id);
    req.apiKey = { id: record.id, tenantId: record.tenantId, scopes: record.scopes };
    next();
  };
