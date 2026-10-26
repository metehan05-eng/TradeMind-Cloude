import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, parse } from '../../lib/http';
import { badRequest, notFound } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { ROLE_DEFINITIONS, ROLE_KEYS } from './roles';
import { store } from '../../repositories/inMemory/store';
import { toPublicUser } from '../auth/authService';
import { audit } from '../audit/auditService';

const router = Router();

const roleUpdateSchema = z.object({
  role: z.enum(['owner_admin', 'cfo', 'procurement_manager', 'logistics_specialist', 'auditor'])
});

/** Role catalogue consumed by the dashboard to gate UI states. */
router.get(
  '/roles',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, ROLE_KEYS.map((key) => ROLE_DEFINITIONS[key]));
  })
);

router.get(
  '/members',
  requireAuth,
  requirePermission('members:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    return ok(
      res,
      store.users.listByTenant(req.auth!.tenantId).map((user) => ({
        ...toPublicUser(user),
        rbac: {
          role: user.role,
          permissions: ROLE_DEFINITIONS[user.role].permissions,
          uiScopes: ROLE_DEFINITIONS[user.role].uiScopes
        }
      }))
    );
  })
);

router.patch(
  '/members/:userId/role',
  requireAuth,
  requirePermission('members:manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(roleUpdateSchema, req.body);
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const user = store.users.findById(req.auth!.tenantId, userId);
    if (!user) throw notFound('Member');
    if (user.id === req.auth!.userId && input.role !== 'owner_admin') {
      throw badRequest('You cannot remove your own owner/admin role');
    }

    const updated = store.users.update(req.auth!.tenantId, user.id, { role: input.role });
    audit(req, {
      tenantId: req.auth!.tenantId,
      actorId: req.auth!.userId,
      action: 'rbac.role_changed',
      resourceType: 'user',
      resourceId: user.id,
      metadata: { previousRole: user.role, nextRole: input.role }
    });

    return ok(res, {
      ...toPublicUser(updated),
      rbac: {
        role: updated.role,
        permissions: ROLE_DEFINITIONS[updated.role].permissions,
        uiScopes: ROLE_DEFINITIONS[updated.role].uiScopes
      }
    });
  })
);

export default router;
