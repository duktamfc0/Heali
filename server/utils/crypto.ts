import crypto from 'node:crypto';
import { config } from '../config.js';

const ENC_PREFIX = 'enc:v1:';

export function generateSecureToken(prefix = 'hl'): string {
  return `${prefix}_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashToken(token: string): string {
  return crypto
    .createHmac('sha256', config.sessionSecret)
    .update(token, 'utf8')
    .digest('hex');
}

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPin(pin: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt:')) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const actualBuf = crypto.scryptSync(pin, salt, 64);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export function generateRecoveryCode(): string {
  const raw = crypto.randomBytes(10).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}`;
}

export function hashRecoveryCode(code: string): string {
  const normalized = code.replace(/[\s-]/g, '').toUpperCase();
  return hashPin(normalized);
}

export function verifyRecoveryCode(code: string, storedHash: string): boolean {
  const normalized = code.replace(/[\s-]/g, '').toUpperCase();
  return verifyPin(normalized, storedHash);
}

export function encryptSensitiveText(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', config.dataEncryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptSensitiveText(payload: string | null | undefined): string {
  if (!payload) return '';
  if (!payload.startsWith(ENC_PREFIX)) {
    return payload;
  }
  const body = payload.slice(ENC_PREFIX.length);
  const parts = body.split(':');
  if (parts.length !== 3) return '';
  try {
    const iv = Buffer.from(parts[0], 'base64url');
    const tag = Buffer.from(parts[1], 'base64url');
    const encrypted = Buffer.from(parts[2], 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', config.dataEncryptionKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}
