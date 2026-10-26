import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, created, ok, parse } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { notificationService } from './notificationService';
import { audit } from '../audit/auditService';

const router = Router();

const channelSchema = z.object({
  type: z.enum(['slack', 'teams', 'email']),
  label: z.string().trim().min(2).max(120),
  endpoint: z.string().trim().min(5).max(500),
  events: z.array(z.string().trim().min(1).max(100)).default(['alert.arbitrage']),
  enabled: z.boolean().default(true)
});

const channelUpdateSchema = channelSchema.partial();

const idParam = (req: Request): string =>
  Array.isArray(req.params.channelId) ? req.params.channelId[0] : req.params.channelId;

router.get(
  '/channels',
  requireAuth,
  requirePermission('alerts:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, notificationService.listChannels(req.auth!.tenantId));
  })
);

router.post(
  '/channels',
  requireAuth,
  requirePermission('alerts:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(channelSchema, req.body);
    const channel = notificationService.createChannel(req.auth!.tenantId, req.auth!.userId, input);
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'notification.channel_created',
      resourceType: 'notification_channel',
      resourceId: channel.id,
      metadata: { type: input.type }
    });
    return created(res, channel);
  })
);

router.patch(
  '/channels/:channelId',
  requireAuth,
  requirePermission('alerts:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(channelUpdateSchema, req.body);
    return ok(
      res,
      notificationService.updateChannel(
        req.auth!.tenantId,
        req.auth!.userId,
        idParam(req),
        input
      )
    );
  })
);

router.delete(
  '/channels/:channelId',
  requireAuth,
  requirePermission('alerts:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    notificationService.removeChannel(req.auth!.tenantId, idParam(req));
    return ok(res, { deleted: true });
  })
);

router.post(
  '/channels/:channelId/test',
  requireAuth,
  requirePermission('alerts:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await notificationService.testChannel(req.auth!.tenantId, idParam(req)));
  })
);

export default router;
