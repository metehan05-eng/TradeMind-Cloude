import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { asyncHandler, created, ok, parse } from '../../../lib/http';
import { forbidden } from '../../../lib/errors';
import { requireAuth } from '../../../middleware/auth';
import { requireApiKey } from '../../../middleware/apiKeyAuth';
import { requirePermission } from '../../../middleware/rbac';
import { apiKeyService } from './apiKeyService';
import { erpIngestionService } from './erpIngestionService';
import { audit } from '../../audit/auditService';
import { store } from '../../../repositories/inMemory/store';

const apiKeyRouter = Router();
const webhookRouter = Router();

const createKeySchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z
    .array(
      z.enum([
        'ingestion:write',
        'financials:read',
        'financials:write',
        'supplychain:read',
        'supplychain:write',
        'market:read'
      ])
    )
    .min(1),
  expiresInDays: z.number().int().min(1).max(3650).optional()
});

const webhookSchema = z.object({
  eventId: z.string().trim().min(3).max(200),
  eventType: z.enum(['invoice.created', 'inventory.delta', 'cashflow.transaction']),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  payload: z.record(z.string(), z.unknown())
});

apiKeyRouter.post(
  '/api-keys',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(createKeySchema, req.body);
    const key = apiKeyService.create({
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      name: input.name,
      scopes: input.scopes,
      expiresInDays: input.expiresInDays
    });
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'api_key.created',
      resourceType: 'api_key',
      resourceId: key.id,
      metadata: { scopes: key.scopes }
    });
    return created(res, {
      ...key,
      warning: 'Store the API key and signing secret now. They cannot be retrieved again.'
    });
  })
);

apiKeyRouter.get(
  '/api-keys',
  requireAuth,
  requirePermission('integrations:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, apiKeyService.list(req.auth!.tenantId));
  })
);

apiKeyRouter.delete(
  '/api-keys/:keyId',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const keyId = Array.isArray(req.params.keyId) ? req.params.keyId[0] : req.params.keyId;
    apiKeyService.revoke(req.auth!.tenantId, keyId);
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'api_key.revoked',
      resourceType: 'api_key',
      resourceId: keyId
    });
    return ok(res, { revoked: true });
  })
);

/**
 * POST /api/v1/ingest/webhooks/erp
 *
 * Authentication: x-api-key. Integrity: x-trademind-signature (HMAC-SHA256 over
 * the raw request body). Idempotent by eventId.
 */
webhookRouter.post(
  '/webhooks/erp',
  requireApiKey(['ingestion:write']),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(webhookSchema, req.body);
    const signatureHeader = req.headers['x-trademind-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body);

    const valid = apiKeyService.verifySignature(
      req.apiKey!.tenantId,
      req.apiKey!.id,
      signature,
      rawBody
    );
    if (!valid) throw forbidden('Webhook signature verification failed');

    const result = erpIngestionService.ingest(
      req.apiKey!.tenantId,
      {
        eventId: input.eventId,
        eventType: input.eventType,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        payload: input.payload
      },
      `api_key:${req.apiKey!.id}`
    );

    return ok(res, {
      accepted: true,
      duplicate: result.duplicate,
      jobId: result.job.id,
      status: result.job.status,
      processedRows: result.processedRows
    });
  })
);

webhookRouter.get(
  '/jobs',
  requireAuth,
  requirePermission('integrations:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, store.ingestJobs.list(req.auth!.tenantId).slice(-100).reverse());
  })
);

export { apiKeyRouter, webhookRouter };
export default apiKeyRouter;
