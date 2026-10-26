import { AuthContext } from './domain';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      requestId?: string;
      /** Populated by API-key authentication for ERP webhooks. */
      apiKey?: { id: string; tenantId: string; scopes: string[] };
      /** Exact request bytes captured for webhook HMAC verification. */
      rawBody?: Buffer;
    }
  }
}

export {};
