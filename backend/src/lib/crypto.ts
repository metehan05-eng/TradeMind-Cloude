import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

/**
 * Derives a deterministic 256-bit key. Operators may supply a 32-byte base64,
 * hex or raw key; passphrases are stretched with scrypt. In production the
 * master key should come from KMS/Vault and be rotated with ENCRYPTION_KEY_VERSION.
 */
export const deriveEncryptionKey = (): Buffer => {
  if (cachedKey) return cachedKey;

  const raw = env.encryption.masterKey;
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    cachedKey = Buffer.from(raw, 'hex');
  } else if (/^[A-Za-z0-9+/=]{44}$/.test(raw)) {
    cachedKey = Buffer.from(raw, 'base64');
  } else {
    cachedKey = scryptSync(raw, 'trademind-kdf-salt', 32);
  }

  if (cachedKey.length !== 32) {
    throw new Error('Encryption key must resolve to exactly 32 bytes.');
  }
  return cachedKey;
};

/**
 * Encrypts credentials with AES-256-GCM. Output format:
 *   v<version>.<base64 iv>.<base64 authTag>.<base64 ciphertext>
 * The version prefix enables online key rotation without a data migration.
 */
export const encryptSecret = (plaintext: string): string => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    `v${env.encryption.keyVersion}`,
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64')
  ].join('.');
};

export const decryptSecret = (envelope: string): string => {
  const parts = envelope.split('.');
  if (parts.length !== 4 || !parts[0].startsWith('v')) {
    throw new Error('Malformed encrypted credential envelope.');
  }
  const [, ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  if (iv.length !== IV_BYTES || tag.length !== AUTH_TAG_BYTES) {
    throw new Error('Invalid encrypted credential parameters.');
  }

  const decipher = createDecipheriv(ALGORITHM, deriveEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
};

export const sha256 = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

export const hmacSha256 = (secret: string, payload: string): string =>
  createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

export const sha256Buffer = (value: Buffer): string =>
  createHash('sha256').update(value).digest('hex');

/** RFC 7636 PKCE code challenge. */
export const sha256Base64Url = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('base64url');

export const randomToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');

export const randomId = (prefix: string): string => `${prefix}_${randomBytes(12).toString('hex')}`;

export const timingSafeCompare = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
};

/**
 * Generates a high-entropy API key. Only the hash is persisted; the plaintext
 * is returned exactly once to the user dashboard.
 */
export const generateApiKey = (): { plaintext: string; prefix: string; hashed: string } => {
  const prefix = `${env.security.apiKeyPrefix}_${randomBytes(4).toString('hex')}`;
  const secret = randomBytes(28).toString('base64url');
  const plaintext = `${prefix}_${secret}`;
  return { plaintext, prefix, hashed: sha256(plaintext) };
};
