import { randomUUID } from 'crypto';
import { store } from '../../../repositories/inMemory/store';
import { IngestJob, Permission } from '../../../types/domain';
import { logger } from '../../../lib/logger';
import { eventBus } from '../../../lib/events';

interface NormalizedEvent {
  eventId: string;
  eventType: 'invoice.created' | 'inventory.delta' | 'cashflow.transaction';
  occurredAt: string;
  payload: Record<string, unknown>;
}

const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : value == null ? fallback : String(value);

/**
 * ERP event ingestion. Each event is idempotent by `eventId` and updates the
 * tenant-scoped ledger/inventory projections used by analytics and simulations.
 */
export class ErpIngestionService {
  ingest(tenantId: string, event: NormalizedEvent, userId: string): {
    duplicate: boolean;
    job: IngestJob;
    processedRows: number;
  } {
    const claimed = store.webhookEvents.claim(tenantId, event.eventId);
    if (!claimed) {
      const job = store.ingestJobs.create({
        tenantId,
        source: 'erp_webhook',
        status: 'completed',
        totalRows: 0,
        processedRows: 0,
        failedRows: 0,
        errors: [],
        createdBy: userId,
        completedAt: new Date().toISOString()
      });
      return { duplicate: true, job, processedRows: 0 };
    }

    const job = store.ingestJobs.create({
      tenantId,
      source: 'erp_webhook',
      status: 'parsing',
      totalRows: 1,
      processedRows: 0,
      failedRows: 0,
      errors: [],
      createdBy: userId
    });

    try {
      const payload = event.payload;
      if (event.eventType === 'inventory.delta') {
        this.applyInventoryDelta(tenantId, job, payload);
      } else {
        this.applyLedgerEntry(tenantId, event);
      }

      const updated = store.ingestJobs.update(tenantId, job.id, {
        status: 'completed',
        processedRows: 1,
        completedAt: new Date().toISOString()
      });
      eventBus.publish({ type: 'ingestion.completed', tenantId, jobId: job.id, rows: 1 });
      return { duplicate: false, job: updated, processedRows: 1 };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ingestion error';
      logger.error('ERP webhook ingestion failed', { tenantId, eventId: event.eventId, message });
      const updated = store.ingestJobs.update(tenantId, job.id, {
        status: 'failed',
        failedRows: 1,
        errors: [{ row: 1, message }],
        completedAt: new Date().toISOString()
      });
      return { duplicate: false, job: updated, processedRows: 0 };
    }
  }

  private applyInventoryDelta(
    tenantId: string,
    job: IngestJob,
    payload: Record<string, unknown>
  ): void {
    const sku = str(payload.sku).trim();
    if (!sku) throw new Error('inventory.delta requires payload.sku');

    const existing = store.inventory.list(tenantId).find((item) => item.sku === sku);
    const quantity = Math.max(0, (existing?.quantity ?? 0) + num(payload.quantityDelta));
    store.inventory.upsertMany([
      {
        id: existing?.id ?? randomUUID(),
        tenantId,
        sku,
        productName: str(payload.productName, existing?.productName ?? sku),
        quantity,
        unitCost: num(payload.unitCost, existing?.unitCost ?? 0),
        currency: str(payload.currency, existing?.currency ?? 'USD').toUpperCase(),
        warehouse: str(payload.warehouse, existing?.warehouse ?? ''),
        source: 'erp_webhook',
        updatedAt: new Date().toISOString()
      }
    ]);
    store.transactions.insertMany([
      {
        id: randomUUID(),
        tenantId,
        externalId: `${job.id}:inventory`,
        type: 'inventory_delta',
        amount: num(payload.quantityDelta),
        currency: str(payload.currency, 'USD').toUpperCase(),
        description: `Inventory delta for ${sku}`,
        occurredAt: new Date().toISOString(),
        source: 'erp_webhook',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  private applyLedgerEntry(tenantId: string, event: NormalizedEvent): void {
    const payload = event.payload;
    const foreignId = str(payload.externalId, event.eventId);
    const alreadyStored = store.transactions
      .list(tenantId)
      .some((transaction) => transaction.externalId === foreignId);
    if (alreadyStored) return;

    store.transactions.insertMany([
      {
        id: randomUUID(),
        tenantId,
        externalId: foreignId,
        type: event.eventType === 'invoice.created' ? 'invoice' : 'cash_flow',
        amount: num(payload.amount),
        currency: str(payload.currency, 'USD').toUpperCase(),
        description: str(
          payload.description,
          event.eventType === 'invoice.created' ? 'ERP invoice' : 'ERP cash-flow transaction'
        ),
        counterparty: str(payload.counterparty) || undefined,
        occurredAt: str(payload.occurredAt, event.occurredAt),
        source: 'erp_webhook',
        createdAt: new Date().toISOString()
      }
    ]);
  }
}

export const erpIngestionService = new ErpIngestionService();
export type { NormalizedEvent };
export type ErpScope = Permission;
