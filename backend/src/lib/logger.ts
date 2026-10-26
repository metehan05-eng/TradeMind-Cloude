type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const configuredLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';

const shouldLog = (level: LogLevel): boolean =>
  LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[configuredLevel];

const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'clientSecret',
  'encryptedAccessToken',
  'encryptedRefreshToken',
  'authorization',
  'apiKey',
  'secret'
]);

/**
 * Recursively redacts secrets before they reach stdout. Production deployments
 * should forward these JSON lines to a SIEM (e.g. Datadog, Grafana Loki).
 */
export const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        REDACTED_KEYS.has(key) ? '[REDACTED]' : redact(entry)
      ])
    );
  }
  return value;
};

const emit = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  if (!shouldLog(level)) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: redact(context) } : {})
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context)
};
