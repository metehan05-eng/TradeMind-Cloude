import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import agentRoutes from './routes/agentRoutes';
import marketRoutes from './routes/marketRoutes';
import authRoutes from './domain/auth/authRoutes';
import tenantRoutes from './domain/tenants/tenantRoutes';
import rbacRoutes from './domain/rbac/rbacRoutes';
import oauthRoutes from './domain/integrations/oauth/oauthRoutes';
import { apiKeyRouter, webhookRouter } from './domain/integrations/erp/erpRoutes';
import bulkRoutes from './domain/integrations/bulk/bulkRoutes';
import sftpRoutes from './domain/integrations/sftp/sftpRoutes';
import simulationRoutes from './domain/simulation/simulationRoutes';
import notificationRoutes from './domain/notifications/notificationRoutes';
import demoRoutes from './domain/demo/demoRoutes';
import { seedStore } from './repositories/inMemory/seed';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { startSchedulers } from './jobs/scheduler';

dotenv.config();

seedStore();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? env.appPublicUrl)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
  })
);

/** Capture exact bytes for HMAC webhook signature verification. */
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buffer) => {
      (req as express.Request).rawBody = Buffer.from(buffer);
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use((req, res, next) => {
  req.requestId = req.header('x-request-id') ?? randomUUID();
  res.setHeader('x-request-id', req.requestId);

  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info('HTTP request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      tenantId: req.auth?.tenantId
    });
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'TradeMind AI Enterprise Platform',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    security: {
      zeroDataRetention: env.security.zeroDataRetention,
      multiTenantRls: true,
      credentialEncryption: 'AES-256-GCM'
    }
  });
});

// Legacy agentic + market endpoints
app.use('/api', agentRoutes);
app.use('/api/market', marketRoutes);

// Enterprise v1 API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/rbac', rbacRoutes);
app.use('/api/v1/integrations', oauthRoutes);
app.use('/api/v1/integrations', apiKeyRouter);
app.use('/api/v1/ingest', webhookRouter);
app.use('/api/v1/ingest', bulkRoutes);
app.use('/api/v1/ingest', sftpRoutes);
app.use('/api/v1/simulations', simulationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/demo', demoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  startSchedulers();
  app.listen(env.port, () => {
    logger.info('TradeMind AI Enterprise Platform started', {
      port: env.port,
      env: env.nodeEnv,
      zeroDataRetention: env.security.zeroDataRetention
    });
  });
}

export default app;
