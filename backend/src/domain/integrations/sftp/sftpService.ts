import { randomUUID } from 'crypto';
import { env } from '../../../config/env';
import { integrationError, notFound } from '../../../lib/errors';
import { encryptSecret, decryptSecret } from '../../../lib/crypto';
import { store, SftpIngestConfig } from '../../../repositories/inMemory/store';
import { bulkIngestionService } from '../bulk/bulkService';
import { IngestJob } from '../../../types/domain';

export interface SftpFile {
  name: string;
  content: Buffer;
  modifiedAt: string;
}

/**
 * Adapter boundary for legacy SFTP ingestion. Production wires
 * `ssh2-sftp-client` (or an internal gateway) here, keeping credential handling
 * and the ingestion pipeline unchanged.
 */
export interface SftpClientAdapter {
  listFiles(): Promise<SftpFile[]>;
  archiveFile(name: string): Promise<void>;
}

const SAMPLE_CSV = [
  'sku,product_name,quantity,unit_cost,currency,warehouse',
  'LEGACY-001,Legacy ERP Widget,48,19.50,USD,Istanbul DC',
  'LEGACY-002,Legacy ERP Bearing,120,7.25,EUR,Istanbul DC'
].join('\n');

/** Development adapter that returns one inbound file. */
class SimulatedSftpAdapter implements SftpClientAdapter {
  async listFiles(): Promise<SftpFile[]> {
    return [
      {
        name: 'legacy_inventory.csv',
        content: Buffer.from(SAMPLE_CSV, 'utf8'),
        modifiedAt: new Date().toISOString()
      }
    ];
  }

  async archiveFile(): Promise<void> {
    // no-op
  }
}

export class SftpIngestionService {
  constructor(private readonly adapter: SftpClientAdapter = new SimulatedSftpAdapter()) {}

  configure(input: {
    tenantId: string;
    userId: string;
    host: string;
    username: string;
    privateKey: string;
    remotePath: string;
    enabled: boolean;
  }): { id: string; host: string; username: string; remotePath: string; enabled: boolean } {
    const now = new Date().toISOString();
    const config: SftpIngestConfig = {
      id: store.sftpConfigs.find(input.tenantId)?.id ?? randomUUID(),
      tenantId: input.tenantId,
      host: input.host,
      username: input.username,
      encryptedPrivateKey: encryptSecret(input.privateKey),
      remotePath: input.remotePath,
      enabled: input.enabled,
      createdBy: input.userId,
      createdAt: store.sftpConfigs.find(input.tenantId)?.createdAt ?? now,
      updatedAt: now
    };
    store.sftpConfigs.upsert(config);
    return {
      id: config.id,
      host: config.host,
      username: config.username,
      remotePath: config.remotePath,
      enabled: config.enabled
    };
  }

  sanitizedConfig(tenantId: string) {
    const config = store.sftpConfigs.find(tenantId);
    if (!config) return null;
    return {
      id: config.id,
      host: config.host,
      username: config.username,
      remotePath: config.remotePath,
      enabled: config.enabled,
      hasPrivateKey: Boolean(config.encryptedPrivateKey),
      lastRunAt: config.lastRunAt
    };
  }

  /**
   * Lists inbound files, enqueues each supported file into the shared bulk
   * parser and archives the source object after successful enqueue.
   */
  async run(tenantId: string, userId: string): Promise<{ jobs: IngestJob[]; files: string[] }> {
    const config = store.sftpConfigs.find(tenantId);
    if (!config) throw notFound('SFTP configuration');
    if (!config.enabled) throw notFound('Enabled SFTP configuration');

    // Credentials are decrypted only at the adapter boundary.
    const keyPresent = Boolean(decryptSecret(config.encryptedPrivateKey));
    if (!keyPresent) throw integrationError('SFTP private key could not be decrypted');

    if (env.isProduction && this.adapter instanceof SimulatedSftpAdapter) {
      throw integrationError('Configure the production SFTP adapter before enabling ingestion');
    }

    const files = await this.adapter.listFiles();
    const jobs: IngestJob[] = [];

    for (const file of files) {
      const job = bulkIngestionService.start({
        tenantId,
        userId,
        file: {
          originalname: file.name,
          mimetype: file.name.endsWith('.json') ? 'application/json' : 'text/csv',
          size: file.content.length,
          buffer: file.content
        },
        dataset: 'auto',
        source: 'sftp'
      });
      jobs.push(job);
      await this.adapter.archiveFile(file.name);
    }

    store.sftpConfigs.upsert({ ...config, lastRunAt: new Date().toISOString() });
    return { jobs, files: files.map((file) => file.name) };
  }
}

export const sftpIngestionService = new SftpIngestionService();
