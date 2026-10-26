import { Request, Response, Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../../config/env';
import { asyncHandler, created, ok, parse } from '../../../lib/http';
import { badRequest, notFound } from '../../../lib/errors';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/rbac';
import { bulkIngestionService } from './bulkService';
import { audit } from '../../audit/auditService';
import { store } from '../../../repositories/inMemory/store';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.security.maxUploadBytes, files: 1 }
});

const querySchema = z.object({
  dataset: z.enum(['auto', 'inventory', 'transactions']).default('auto')
});

/** POST /api/v1/ingest/bulk — multipart CSV/XLSX/JSON upload. */
router.post(
  '/bulk',
  requireAuth,
  requirePermission('ingestion:write'),
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw badRequest('A file field named "file" is required');
    const { dataset } = parse(querySchema, { dataset: req.query.dataset ?? req.body?.dataset });

    const job = bulkIngestionService.start({
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      file: req.file,
      dataset
    });

    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'ingestion.bulk_uploaded',
      resourceType: 'ingest_job',
      resourceId: job.id,
      metadata: { fileName: job.fileName, format: job.format, dataset }
    });

    return created(res, {
      job,
      pollUrl: `/api/v1/ingest/jobs/${job.id}`,
      message: 'Upload accepted. Parsing and column mapping run asynchronously.'
    });
  })
);

router.get(
  '/jobs/:jobId',
  requireAuth,
  requirePermission('integrations:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const job = store.ingestJobs.findById(req.auth!.tenantId, jobId);
    if (!job) throw notFound('Ingestion job');
    return ok(res, job);
  })
);

router.get(
  '/inventory',
  requireAuth,
  requirePermission('supplychain:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, store.inventory.list(req.auth!.tenantId));
  })
);

router.get(
  '/transactions',
  requireAuth,
  requirePermission('financials:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, store.transactions.list(req.auth!.tenantId));
  })
);

export default router;
