import { env } from '../../../config/env';
import { eventBus } from '../../../lib/events';
import { logger } from '../../../lib/logger';
import { store } from '../../../repositories/inMemory/store';
import { parseFile, FileFormat } from './parsers';
import { detectDataset, DatasetKind, mapRows } from './columnMapper';

export interface IngestionQueueItem {
  tenantId: string;
  jobId: string;
  userId: string;
  buffer: Buffer;
  format: FileFormat;
  dataset: DatasetKind | 'auto';
  source: 'bulk_upload' | 'sftp';
}

/**
 * In-process asynchronous ingestion worker.
 *
 * The interface is deliberately queue-shaped so it can be replaced with BullMQ,
 * SQS or Cloud Tasks without changing routes. Production deployments should run
 * workers as separate processes and stream large files from object storage.
 */
class IngestionQueue {
  private readonly queue: IngestionQueueItem[] = [];
  private active = 0;

  enqueue(item: IngestionQueueItem): void {
    this.queue.push(item);
    setImmediate(() => this.drain());
  }

  private drain(): void {
    while (this.active < env.queue.concurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;
      this.active += 1;
      void this.process(item)
        .catch((error) => {
          logger.error('Unhandled ingestion worker error', {
            jobId: item.jobId,
            error: error instanceof Error ? error.message : String(error)
          });
        })
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }

  private async process(item: IngestionQueueItem): Promise<void> {
    const { tenantId, jobId } = item;
    try {
      store.ingestJobs.update(tenantId, jobId, { status: 'parsing' });

      // Simulate I/O yielding so the queue remains responsive.
      await new Promise((resolve) => setImmediate(resolve));
      const rows = parseFile(item.buffer, item.format);
      const dataset = item.dataset === 'auto' ? detectDataset(rows) : item.dataset;
      store.ingestJobs.update(tenantId, jobId, { status: 'mapping', totalRows: rows.length });

      const mapped = mapRows(tenantId, rows, dataset, item.source);
      if (dataset === 'inventory') {
        store.inventory.upsertMany(mapped.records as never);
      } else {
        store.transactions.insertMany(mapped.records as never);
      }

      store.ingestJobs.update(tenantId, jobId, {
        status: mapped.errors.length === rows.length ? 'failed' : 'completed',
        processedRows: mapped.records.length,
        failedRows: mapped.errors.length,
        errors: mapped.errors.slice(0, 50),
        mapping: mapped.mapping,
        completedAt: new Date().toISOString()
      });

      if (mapped.records.length > 0) {
        eventBus.publish({
          type: 'ingestion.completed',
          tenantId,
          jobId,
          rows: mapped.records.length
        });
      }
      logger.info('Bulk ingestion completed', {
        tenantId,
        jobId,
        dataset,
        rows: mapped.records.length,
        failed: mapped.errors.length
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parsing error';
      store.ingestJobs.update(tenantId, jobId, {
        status: 'failed',
        errors: [{ row: 0, message }],
        completedAt: new Date().toISOString()
      });
      logger.error('Bulk ingestion failed', { tenantId, jobId, message });
    }
  }
}

export const ingestionQueue = new IngestionQueue();
