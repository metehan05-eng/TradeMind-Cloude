import { env } from '../config/env';
import { logger } from '../lib/logger';
import { oauthIntegrationService } from '../domain/integrations/oauth/oauthService';

/**
 * Background access-token refresh job.
 * Runs every TOKEN_REFRESH_INTERVAL_MINUTES and refreshes tokens expiring within
 * 20 minutes. In a multi-instance deployment run this as a singleton worker or
 * distributed lock (e.g. BullMQ repeatable job).
 */
export const startTokenRefreshJob = (): NodeJS.Timeout => {
  const intervalMs = Math.max(env.oauth.tokenRefreshIntervalMinutes, 1) * 60_000;
  const timer = setInterval(() => {
    void oauthIntegrationService
      .refreshExpiringConnections()
      .then((result) => {
        if (result.refreshed > 0 || result.failed > 0) {
          logger.info('OAuth refresh sweep completed', result);
        }
      })
      .catch((error) =>
        logger.error('OAuth refresh sweep failed', {
          error: error instanceof Error ? error.message : String(error)
        })
      );
  }, intervalMs);

  timer.unref();
  return timer;
};
