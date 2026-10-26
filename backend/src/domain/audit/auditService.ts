import { Request } from 'express';
import { store } from '../../repositories/inMemory/store';

export const audit = (
  req: Request,
  input: {
    tenantId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }
): void => {
  try {
    store.auditLogs.append({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ip: req.ip
    });
  } catch {
    // Audit failures must never break the primary business transaction; ship to
    // a durable queue/SIEM sink in production.
  }
};
