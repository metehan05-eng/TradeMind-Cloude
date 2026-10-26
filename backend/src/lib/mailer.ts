import axios from 'axios';
import { env } from '../config/env';
import { logger } from './logger';

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Provider-agnostic transactional email facade.
 *
 * - `console` (default): logs the message for local development.
 * - `webhook`: forwards to an email service (Postmark/SES adapter) without
 *   coupling the domain layer to a specific vendor SDK.
 */
export const sendMail = async (input: MailInput): Promise<void> => {
  if (env.email.provider === 'webhook' && env.notifications.emailWebhookUrl) {
    await axios.post(
      env.notifications.emailWebhookUrl,
      { from: env.email.from, ...input },
      { timeout: 8000 }
    );
    return;
  }

  logger.info('Transactional email (console provider)', {
    to: input.to,
    subject: input.subject,
    preview: input.text.slice(0, 300)
  });
};
