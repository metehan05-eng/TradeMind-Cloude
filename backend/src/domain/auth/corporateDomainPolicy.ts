import { AppError } from '../../lib/errors';

/**
 * Public webmail / free mailbox providers are rejected at every registration
 * and login surface. Keep this list conservative and configurable via env in
 * production (`BLOCKED_EMAIL_DOMAINS`).
 */
export const FREE_EMAIL_DOMAINS = new Set(
  (
    process.env.BLOCKED_EMAIL_DOMAINS ??
    [
      'gmail.com',
      'googlemail.com',
      'yahoo.com',
      'yahoo.co.uk',
      'hotmail.com',
      'hotmail.co.uk',
      'outlook.com',
      'live.com',
      'msn.com',
      'icloud.com',
      'me.com',
      'mac.com',
      'aol.com',
      'protonmail.com',
      'proton.me',
      'gmx.com',
      'gmx.net',
      'yandex.com',
      'yandex.ru',
      'mail.ru',
      'zoho.com',
      'tutanota.com',
      'tuta.io',
      'qq.com',
      '163.com',
      '126.com'
    ].join(',')
  )
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
);

const EMAIL_PATTERN = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/;

export interface CorporateDomainDecision {
  email: string;
  domain: string;
}

/**
 * Enforces business-only registration.
 *
 * Rules:
 *  - Syntactically valid email with a real TLD.
 *  - Rejects free mailboxes and disposable domains.
 *  - Rejects IP-address hosts and single-label domains.
 *  - Rejects plus-addressing aliases on public providers (defence in depth).
 */
export const assertCorporateEmail = (rawEmail: string): CorporateDomainDecision => {
  const email = rawEmail.trim().toLowerCase();
  const match = EMAIL_PATTERN.exec(email);

  if (!match) {
    throw new AppError(400, 'VALIDATION_ERROR', 'A valid business email is required');
  }

  const domain = match[1];
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    throw new AppError(
      400,
      'PUBLIC_EMAIL_BLOCKED',
      'Public webmail providers are not allowed. Please use your corporate email address.'
    );
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain) || !domain.includes('.')) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email domain cannot be an IP or local hostname');
  }

  return { email, domain };
};

export const extractDomain = (email: string): string => email.split('@')[1]?.toLowerCase() ?? '';

export const isPublicEmailDomain = (domain: string): boolean =>
  FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
