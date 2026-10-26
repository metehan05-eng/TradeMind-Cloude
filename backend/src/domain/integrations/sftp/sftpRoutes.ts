import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, parse } from '../../../lib/http';
import { requireAuth } from '../../../middleware/auth';
import { requirePermission } from '../../../middleware/rbac';
import { sftpIngestionService } from './sftpService';
import { audit } from '../../audit/auditService';

const router = Router();

const configSchema = z.object({
  host: z.string().trim().min(3).max(255),
  username: z.string().trim().min(1).max(120),
  privateKey: z.string().min(32),
  remotePath: z.string().trim().min(1).max(500),
  enabled: z.boolean().default(true)
});

router.get(
  '/sftp/config',
  requireAuth,
  requirePermission('integrations:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, sftpIngestionService.sanitizedConfig(req.auth!.tenantId));
  })
);

router.put(
  '/sftp/config',
  requireAuth,
  requirePermission('integrations:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(configSchema, req.body);
    const config = sftpIngestionService.configure({
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      ...input
    });
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'sftp.configured',
      resourceType: 'sftp',
      resourceId: config.id,
      metadata: { host: config.host, remotePath: config.remotePath }
    });
    return ok(res, config);
  })
);

router.post(
  '/sftp/run',
  requireAuth,
  requirePermission('ingestion:write'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sftpIngestionService.run(req.auth!.tenantId, req.auth!.userId);
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'sftp.ingestion_started',
      resourceType: 'sftp',
      metadata: { files: result.files }
    });
    return ok(res, result);
  })
);

export default router;
