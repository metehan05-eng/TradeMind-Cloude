import { EventEmitter } from 'events';
import { logger } from './logger';

export type TradeMindEvent =
  | { type: 'tenant.kyb_verified'; tenantId: string; legalName: string }
  | { type: 'integration.connected'; tenantId: string; provider: string }
  | { type: 'ingestion.completed'; tenantId: string; jobId: string; rows: number }
  | { type: 'alert.arbitrage'; tenantId: string; title: string; detail: string }
  | { type: 'demo.requested'; tenantId?: string; requestId: string; companyName: string }
  | { type: 'demo.provisioned'; tenantId: string; requestId: string };

class DomainEventBus extends EventEmitter {
  publish(event: TradeMindEvent): void {
    this.emit(event.type, event);
  }

  subscribe<T extends TradeMindEvent['type']>(
    type: T,
    handler: (event: Extract<TradeMindEvent, { type: T }>) => void
  ): () => void {
    const wrapped = (event: TradeMindEvent) => {
      void Promise.resolve(handler(event as Extract<TradeMindEvent, { type: T }>)).catch((error) =>
        logger.error('Event handler failed', { type, error: (error as Error).message })
      );
    };
    this.on(type, wrapped);
    return () => this.off(type, wrapped);
  }
}

export const eventBus = new DomainEventBus();
