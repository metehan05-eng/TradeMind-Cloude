import axios from 'axios';
import { env } from '../../config/env';
import { badRequest, notFound } from '../../lib/errors';
import { decryptSecret, encryptSecret, maskEmail } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { eventBus } from '../../lib/events';
import { sendMail } from '../../lib/mailer';
import { store } from '../../repositories/inMemory/store';
import { DemoRequest, NotificationChannel } from '../../types/domain';

export type NotificationChannelType = 'slack' | 'teams' | 'email';

export interface ChannelInput {
  type: NotificationChannelType;
  label: string;
  endpoint: string;
  events: string[];
  enabled?: boolean;
}

const maskEndpoint = (type: NotificationChannelType, endpoint: string): string => {
  if (type === 'email') return maskEmail(endpoint);
  try {
    const url = new URL(endpoint);
    return `${url.protocol}//${url.host}/***`;
  } catch {
    return '***';
  }
};

const sanitize = (channel: NotificationChannel) => {
  let plain = '';
  try {
    plain = decryptSecret(channel.endpoint);
  } catch {
    plain = '';
  }
  return {
    id: channel.id,
    type: channel.type,
    label: channel.label,
    endpointPreview: maskEndpoint(channel.type, plain),
    events: channel.events,
    enabled: channel.enabled,
    createdAt: channel.createdAt
  };
};

/**
 * Event-driven notification fan-out to Slack, Microsoft Teams and email.
 *
 * Webhook endpoints are stored encrypted because Slack/Teams URLs are bearer
 * secrets. Delivery is best-effort with structured logging; production should
 * add retries with exponential backoff and a dead-letter queue.
 */
export class NotificationService {
  initialize(): void {
    eventBus.subscribe('alert.arbitrage', (event) => {
      void this.dispatch(event.tenantId, 'alert.arbitrage', event.title, event.detail);
    });
    eventBus.subscribe('demo.requested', (event) => {
      logger.info('Demo lead captured', {
        requestId: event.requestId,
        companyName: event.companyName
      });
    });
  }

  createChannel(tenantId: string, userId: string, input: ChannelInput) {
    this.validateEndpoint(input);
    const channel = store.notificationChannels.create({
      tenantId,
      type: input.type,
      label: input.label,
      endpoint: encryptSecret(input.endpoint),
      events: input.events.length > 0 ? input.events : ['alert.arbitrage'],
      enabled: input.enabled ?? true,
      createdBy: userId
    });
    return sanitize(channel);
  }

  listChannels(tenantId: string) {
    return store.notificationChannels.list(tenantId).map(sanitize);
  }

  updateChannel(
    tenantId: string,
    userId: string,
    channelId: string,
    input: Partial<ChannelInput>
  ) {
    const existing = store.notificationChannels.findById(tenantId, channelId);
    if (!existing) throw notFound('Notification channel');
    if (input.endpoint) this.validateEndpoint({ ...input, type: input.type ?? existing.type } as ChannelInput);

    const updated = store.notificationChannels.update(tenantId, channelId, {
      ...(input.label ? { label: input.label } : {}),
      ...(input.events ? { events: input.events } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.endpoint ? { endpoint: encryptSecret(input.endpoint) } : {})
    });
    return sanitize(updated);
  }

  removeChannel(tenantId: string, channelId: string): void {
    const existing = store.notificationChannels.findById(tenantId, channelId);
    if (!existing) throw notFound('Notification channel');
    store.notificationChannels.remove(tenantId, channelId);
  }

  async testChannel(tenantId: string, channelId: string): Promise<{ delivered: boolean }> {
    const channel = store.notificationChannels.findById(tenantId, channelId);
    if (!channel) throw notFound('Notification channel');
    await this.deliver(channel, {
      title: 'TradeMind AI test notification',
      detail: 'Your alert channel is configured correctly.',
      event: 'test'
    });
    return { delivered: true };
  }

  async dispatch(
    tenantId: string,
    event: string,
    title: string,
    detail: string
  ): Promise<void> {
    const channels = store.notificationChannels
      .list(tenantId)
      .filter(
        (channel) =>
          channel.enabled && (channel.events.includes(event) || channel.events.includes('*'))
      );

    await Promise.allSettled(
      channels.map((channel) => this.deliver(channel, { title, detail, event }))
    );
  }

  private async deliver(
    channel: NotificationChannel,
    payload: { title: string; detail: string; event: string }
  ): Promise<void> {
    try {
      const endpoint = decryptSecret(channel.endpoint);
      if (channel.type === 'email') {
        await sendMail({
          to: endpoint,
          subject: `[TradeMind AI] ${payload.title}`,
          text: payload.detail
        });
        return;
      }

      const body =
        channel.type === 'teams'
          ? {
              '@type': 'MessageCard',
              '@context': 'https://schema.org/extensions',
              summary: payload.title,
              themeColor: '3B82F6',
              title: payload.title,
              text: payload.detail
            }
          : { text: `*${payload.title}*\n${payload.detail}` };

      await axios.post(endpoint, body, { timeout: 8000 });
    } catch (error) {
      logger.error('Notification delivery failed', {
        tenantId: channel.tenantId,
        channelId: channel.id,
        type: channel.type,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Forwards demo leads to Slack and HubSpot in parallel. This is the CRM
   * hand-off used by sales for LinkedIn follow-up.
   */
  async forwardDemoLead(
    request: DemoRequest,
    confirmationUrl: string
  ): Promise<{ slack: boolean; hubspot: boolean }> {
    const slackText = [
      ':rotating_light: *New institutional demo request*',
      `*Company:* ${request.companyName}`,
      `*Contact:* ${request.businessEmail} — ${request.jobTitle}`,
      `*Volume:* ${request.annualTradeVolume}`,
      `*ERP:* ${request.primaryErp} | *Marketplace:* ${request.primaryMarketplace}`,
      `*Lead score:* ${request.leadScore}/100`,
      `*Request ID:* ${request.id}`
    ].join('\n');

    const slackPromise = env.notifications.demoLeadSlackWebhookUrl
      ? axios.post(env.notifications.demoLeadSlackWebhookUrl, { text: slackText }, { timeout: 8000 })
      : Promise.resolve(null);

    const hubspotPromise = env.notifications.hubspotWebhookUrl
      ? axios.post(
          env.notifications.hubspotWebhookUrl,
          {
            properties: {
              company: request.companyName,
              email: request.businessEmail,
              jobtitle: request.jobTitle,
              annual_trade_volume: request.annualTradeVolume,
              primary_erp: request.primaryErp,
              primary_marketplace: request.primaryMarketplace,
              lead_score: request.leadScore,
              trademind_request_id: request.id
            },
            confirmationUrl
          },
          { timeout: 8000 }
        )
      : Promise.resolve(null);

    const [slack, hubspot] = await Promise.allSettled([slackPromise, hubspotPromise]);

    if (!env.notifications.demoLeadSlackWebhookUrl && !env.notifications.hubspotWebhookUrl) {
      logger.info('Demo lead CRM webhooks not configured; lead stored locally', {
        requestId: request.id,
        score: request.leadScore
      });
    }

    return {
      slack: slack.status === 'fulfilled',
      hubspot: hubspot.status === 'fulfilled'
    };
  }

  private validateEndpoint(input: ChannelInput): void {
    if (input.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.endpoint)) {
        throw badRequest('A valid email endpoint is required');
      }
      return;
    }
    if (!/^https:\/\//i.test(input.endpoint)) {
      throw badRequest('Slack/Teams webhook endpoints must use HTTPS');
    }
  }
}

export const notificationService = new NotificationService();
