import { randomUUID } from 'crypto';
import {
  ApiKeyRecord,
  AuditLogEntry,
  DemoRequest,
  DomainVerificationChallenge,
  FinancialTransactionRecord,
  IngestJob,
  IntegrationConnection,
  InventoryRecord,
  NotificationChannel,
  OAuthStateRecord,
  RefreshSession,
  Tenant,
  User
} from '../../types/domain';

export interface SftpIngestConfig {
  id: string;
  tenantId: string;
  host: string;
  username: string;
  encryptedPrivateKey: string;
  remotePath: string;
  enabled: boolean;
  lastRunAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface StoreShape {
  tenants: Tenant[];
  users: User[];
  refreshSessions: RefreshSession[];
  domainChallenges: DomainVerificationChallenge[];
  oauthStates: OAuthStateRecord[];
  connections: IntegrationConnection[];
  apiKeys: ApiKeyRecord[];
  ingestJobs: IngestJob[];
  inventory: InventoryRecord[];
  transactions: FinancialTransactionRecord[];
  notificationChannels: NotificationChannel[];
  demoRequests: DemoRequest[];
  auditLogs: AuditLogEntry[];
  sftpConfigs: SftpIngestConfig[];
  processedWebhookEvents: Set<string>;
}

const now = (): string => new Date().toISOString();

/**
 * Reference in-memory persistence adapter.
 *
 * The public methods intentionally mirror the Postgres repository contract and
 * always take a `tenantId` when reading/writing tenant-owned data. Swapping this
 * file for Drizzle/Prisma/Kysely does not change any service or route.
 */
class InMemoryStore {
  private readonly db: StoreShape = {
    tenants: [],
    users: [],
    refreshSessions: [],
    domainChallenges: [],
    oauthStates: [],
    connections: [],
    apiKeys: [],
    ingestJobs: [],
    inventory: [],
    transactions: [],
    notificationChannels: [],
    demoRequests: [],
    auditLogs: [],
    sftpConfigs: [],
    processedWebhookEvents: new Set<string>()
  };

  readonly tenants = {
    findById: (id: string) => this.db.tenants.find((tenant) => tenant.id === id),
    findByDomain: (domain: string) => {
      const normalized = domain.toLowerCase();
      return this.db.tenants.find((tenant) => {
        const primary = tenant.primaryDomain.toLowerCase();
        const ssoDomains = tenant.sso?.domains.map((item) => item.toLowerCase()) ?? [];
        return primary === normalized || ssoDomains.includes(normalized);
      });
    },
    findByTaxId: (taxId: string) => this.db.tenants.find((tenant) => tenant.taxId === taxId),
    list: () => [...this.db.tenants],
    create: (input: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Tenant => {
      const tenant: Tenant = {
        ...input,
        id: randomUUID(),
        createdAt: now(),
        updatedAt: now()
      };
      this.db.tenants.push(tenant);
      return tenant;
    },
    update: (tenantId: string, patch: Partial<Tenant>): Tenant => {
      const index = this.db.tenants.findIndex((tenant) => tenant.id === tenantId);
      if (index < 0) throw new Error('Tenant not found');
      const updated: Tenant = { ...this.db.tenants[index], ...patch, updatedAt: now() };
      this.db.tenants[index] = updated;
      return updated;
    }
  };

  readonly users = {
    findById: (tenantId: string, userId: string) =>
      this.db.users.find((user) => user.tenantId === tenantId && user.id === userId),
    findByEmail: (email: string) =>
      this.db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()),
    listByTenant: (tenantId: string) => this.db.users.filter((user) => user.tenantId === tenantId),
    create: (input: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
      const user: User = { ...input, id: randomUUID(), createdAt: now(), updatedAt: now() };
      this.db.users.push(user);
      return user;
    },
    update: (tenantId: string, userId: string, patch: Partial<User>): User => {
      const index = this.db.users.findIndex(
        (user) => user.tenantId === tenantId && user.id === userId
      );
      if (index < 0) throw new Error('User not found');
      const updated: User = { ...this.db.users[index], ...patch, updatedAt: now() };
      this.db.users[index] = updated;
      return updated;
    }
  };

  readonly refreshSessions = {
    create: (input: Omit<RefreshSession, 'id' | 'createdAt'>): RefreshSession => {
      const session: RefreshSession = { ...input, id: randomUUID(), createdAt: now() };
      this.db.refreshSessions.push(session);
      return session;
    },
    findByHash: (tokenHash: string) =>
      this.db.refreshSessions.find(
        (session) => session.tokenHash === tokenHash && !session.revokedAt
      ),
    revoke: (id: string): void => {
      const session = this.db.refreshSessions.find((entry) => entry.id === id);
      if (session) session.revokedAt = now();
    },
    revokeAllForUser: (tenantId: string, userId: string): void => {
      this.db.refreshSessions
        .filter((session) => session.tenantId === tenantId && session.userId === userId)
        .forEach((session) => {
          session.revokedAt = now();
        });
    }
  };

  readonly domainChallenges = {
    create: (
      input: Omit<DomainVerificationChallenge, 'id' | 'createdAt'>
    ): DomainVerificationChallenge => {
      const challenge: DomainVerificationChallenge = {
        ...input,
        id: randomUUID(),
        createdAt: now()
      };
      this.db.domainChallenges.push(challenge);
      return challenge;
    },
    latest: (tenantId: string, level: DomainVerificationChallenge['level']) =>
      [...this.db.domainChallenges]
        .filter((item) => item.tenantId === tenantId && item.level === level)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    findByToken: (token: string) =>
      this.db.domainChallenges.find((item) => item.token === token),
    update: (id: string, patch: Partial<DomainVerificationChallenge>) => {
      const challenge = this.db.domainChallenges.find((item) => item.id === id);
      if (!challenge) throw new Error('Domain challenge not found');
      Object.assign(challenge, patch);
      return challenge;
    }
  };

  readonly oauthStates = {
    create: (input: Omit<OAuthStateRecord, 'id' | 'createdAt'>): OAuthStateRecord => {
      const record: OAuthStateRecord = { ...input, id: randomUUID(), createdAt: now() };
      this.db.oauthStates.push(record);
      return record;
    },
    consume: (state: string): OAuthStateRecord | undefined => {
      const index = this.db.oauthStates.findIndex((record) => record.state === state);
      if (index < 0) return undefined;
      const [record] = this.db.oauthStates.splice(index, 1);
      return record;
    }
  };

  readonly connections = {
    list: (tenantId: string) =>
      this.db.connections.filter((connection) => connection.tenantId === tenantId),
    findById: (tenantId: string, id: string) =>
      this.db.connections.find(
        (connection) => connection.tenantId === tenantId && connection.id === id
      ),
    findByProvider: (tenantId: string, provider: string) =>
      this.db.connections.find(
        (connection) => connection.tenantId === tenantId && connection.provider === provider
      ),
    create: (input: Omit<IntegrationConnection, 'id' | 'createdAt' | 'updatedAt'>) => {
      const connection: IntegrationConnection = {
        ...input,
        id: randomUUID(),
        createdAt: now(),
        updatedAt: now()
      };
      this.db.connections.push(connection);
      return connection;
    },
    update: (tenantId: string, id: string, patch: Partial<IntegrationConnection>) => {
      const index = this.db.connections.findIndex(
        (connection) => connection.tenantId === tenantId && connection.id === id
      );
      if (index < 0) throw new Error('Integration connection not found');
      const updated = { ...this.db.connections[index], ...patch, updatedAt: now() };
      this.db.connections[index] = updated;
      return updated;
    },
    remove: (tenantId: string, id: string): void => {
      const index = this.db.connections.findIndex(
        (connection) => connection.tenantId === tenantId && connection.id === id
      );
      if (index >= 0) this.db.connections.splice(index, 1);
    },
    allConnected: () =>
      this.db.connections.filter((connection) => connection.status === 'connected')
  };

  readonly apiKeys = {
    list: (tenantId: string) =>
      this.db.apiKeys.filter((key) => key.tenantId === tenantId && !key.revokedAt),
    findById: (tenantId: string, id: string) =>
      this.db.apiKeys.find((key) => key.tenantId === tenantId && key.id === id),
    findByPrefix: (prefix: string) =>
      this.db.apiKeys.find((key) => key.prefix === prefix && !key.revokedAt),
    create: (input: Omit<ApiKeyRecord, 'id' | 'createdAt'>): ApiKeyRecord => {
      const record: ApiKeyRecord = { ...input, id: randomUUID(), createdAt: now() };
      this.db.apiKeys.push(record);
      return record;
    },
    revoke: (tenantId: string, id: string) => {
      const record = this.db.apiKeys.find((key) => key.tenantId === tenantId && key.id === id);
      if (record) record.revokedAt = now();
      return record;
    },
    touch: (id: string) => {
      const record = this.db.apiKeys.find((key) => key.id === id);
      if (record) record.lastUsedAt = now();
    }
  };

  readonly ingestJobs = {
    create: (input: Omit<IngestJob, 'id' | 'createdAt' | 'updatedAt'>): IngestJob => {
      const job: IngestJob = {
        ...input,
        id: randomUUID(),
        createdAt: now(),
        updatedAt: now()
      };
      this.db.ingestJobs.push(job);
      return job;
    },
    findById: (tenantId: string, id: string) =>
      this.db.ingestJobs.find((job) => job.tenantId === tenantId && job.id === id),
    list: (tenantId: string) =>
      this.db.ingestJobs.filter((job) => job.tenantId === tenantId),
    update: (tenantId: string, id: string, patch: Partial<IngestJob>) => {
      const index = this.db.ingestJobs.findIndex(
        (job) => job.tenantId === tenantId && job.id === id
      );
      if (index < 0) throw new Error('Ingest job not found');
      const updated = { ...this.db.ingestJobs[index], ...patch, updatedAt: now() };
      this.db.ingestJobs[index] = updated;
      return updated;
    }
  };

  readonly inventory = {
    upsertMany: (rows: InventoryRecord[]): number => {
      rows.forEach((row) => {
        const index = this.db.inventory.findIndex(
          (item) => item.tenantId === row.tenantId && item.sku === row.sku
        );
        if (index >= 0) this.db.inventory[index] = row;
        else this.db.inventory.push(row);
      });
      return rows.length;
    },
    list: (tenantId: string) =>
      this.db.inventory.filter((item) => item.tenantId === tenantId)
  };

  readonly transactions = {
    insertMany: (rows: FinancialTransactionRecord[]): number => {
      this.db.transactions.push(...rows);
      return rows.length;
    },
    list: (tenantId: string) =>
      this.db.transactions.filter((item) => item.tenantId === tenantId)
  };

  readonly notificationChannels = {
    list: (tenantId: string) =>
      this.db.notificationChannels.filter((channel) => channel.tenantId === tenantId),
    findById: (tenantId: string, id: string) =>
      this.db.notificationChannels.find(
        (channel) => channel.tenantId === tenantId && channel.id === id
      ),
    create: (input: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>) => {
      const channel: NotificationChannel = {
        ...input,
        id: randomUUID(),
        createdAt: now(),
        updatedAt: now()
      };
      this.db.notificationChannels.push(channel);
      return channel;
    },
    update: (tenantId: string, id: string, patch: Partial<NotificationChannel>) => {
      const index = this.db.notificationChannels.findIndex(
        (channel) => channel.tenantId === tenantId && channel.id === id
      );
      if (index < 0) throw new Error('Notification channel not found');
      const updated = { ...this.db.notificationChannels[index], ...patch, updatedAt: now() };
      this.db.notificationChannels[index] = updated;
      return updated;
    },
    remove: (tenantId: string, id: string) => {
      const index = this.db.notificationChannels.findIndex(
        (channel) => channel.tenantId === tenantId && channel.id === id
      );
      if (index >= 0) this.db.notificationChannels.splice(index, 1);
    }
  };

  readonly demoRequests = {
    create: (input: Omit<DemoRequest, 'id' | 'createdAt'>): DemoRequest => {
      const request: DemoRequest = { ...input, id: randomUUID(), createdAt: now() };
      this.db.demoRequests.push(request);
      return request;
    },
    findByTokenHash: (hash: string) =>
      this.db.demoRequests.find((request) => request.confirmationTokenHash === hash),
    findById: (id: string) => this.db.demoRequests.find((request) => request.id === id),
    list: () => [...this.db.demoRequests],
    update: (id: string, patch: Partial<DemoRequest>): DemoRequest => {
      const index = this.db.demoRequests.findIndex((request) => request.id === id);
      if (index < 0) throw new Error('Demo request not found');
      const updated = { ...this.db.demoRequests[index], ...patch };
      this.db.demoRequests[index] = updated;
      return updated;
    }
  };

  readonly auditLogs = {
    append: (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): AuditLogEntry => {
      const log: AuditLogEntry = { ...entry, id: randomUUID(), createdAt: now() };
      this.db.auditLogs.push(log);
      return log;
    },
    list: (tenantId: string) =>
      this.db.auditLogs.filter((entry) => entry.tenantId === tenantId)
  };

  readonly sftpConfigs = {
    find: (tenantId: string) =>
      this.db.sftpConfigs.find((config) => config.tenantId === tenantId),
    upsert: (input: SftpIngestConfig): SftpIngestConfig => {
      const index = this.db.sftpConfigs.findIndex((config) => config.tenantId === input.tenantId);
      if (index >= 0) this.db.sftpConfigs[index] = { ...input, updatedAt: now() };
      else this.db.sftpConfigs.push(input);
      return input;
    }
  };

  readonly webhookEvents = {
    /** Idempotency guard. Production: unique index on (tenant_id, event_id). */
    claim: (tenantId: string, eventId: string): boolean => {
      const key = `${tenantId}:${eventId}`;
      if (this.db.processedWebhookEvents.has(key)) return false;
      this.db.processedWebhookEvents.add(key);
      return true;
    }
  };

  /** Test/seed helper only. Not exposed through HTTP. */
  reset(): void {
    Object.values(this.db).forEach((collection) => {
      (collection as unknown[]).length = 0;
    });
  }
}

export const store = new InMemoryStore();
