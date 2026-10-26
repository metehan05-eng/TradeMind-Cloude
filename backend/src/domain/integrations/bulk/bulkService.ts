import { badRequest } from '../../../lib/errors';
import { store } from '../../../repositories/inMemory/store';
import { detectFormat } from './parsers';
import { DatasetKind } from './columnMapper';
import { ingestionQueue } from './ingestionQueue';
import { IngestJob } from '../../../types/domain';

export class BulkIngestionService {
  start(input: {
    tenantId: string;
    userId: string;
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer };
    dataset: DatasetKind | 'auto';
    source?: 'bulk_upload' | 'sftp';
  }): IngestJob {
    if (!input.file.buffer.length) throw badRequest('Uploaded file is empty');
    const format = detectFormat(input.file.originalname, input.file.mimetype);

    const job = store.ingestJobs.create({
      tenantId: input.tenantId,
      source: input.source ?? 'bulk_upload',
      status: 'queued',
      fileName: input.file.originalname.slice(0, 200),
      format,
      totalRows: 0,
      processedRows: 0,
      failedRows: 0,
      errors: [],
      createdBy: input.userId
    });

    ingestionQueue.enqueue({
      tenantId: input.tenantId,
      jobId: job.id,
      userId: input.userId,
      buffer: input.file.buffer,
      format,
      dataset: input.dataset,
      source: input.source ?? 'bulk_upload'
    });

    return job;
  }
}

export const bulkIngestionService = new BulkIngestionService();
