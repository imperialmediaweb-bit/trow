import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const key = Buffer.from(config.encryptionKey, 'hex');
  if (key.length !== 32) {
    throw new Error(
      `Invalid ENCRYPTION_KEY: expected 32 bytes (64 hex chars), got ${key.length} bytes.`,
    );
  }
  cachedKey = key;
  return cachedKey;
}

// Stored format: iv:tag:ciphertext (all hex). Used to distinguish encrypted
// values from legacy/plaintext values without silently swallowing errors.
const ENCRYPTED_FORMAT = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]*$/i;

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && ENCRYPTED_FORMAT.test(value);
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, tagHex, ciphertext] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Safely decrypts a stored value. If the value is in encrypted format it is
 * decrypted (and a failure is thrown, not swallowed — corrupted ciphertext
 * must not be silently returned as if it were plaintext). If the value is not
 * in encrypted format it is returned as-is (legacy plaintext rows).
 */
export function decryptStored(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!isEncrypted(value)) return value; // legacy plaintext
  return decrypt(value);
}
