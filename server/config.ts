import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'data');

function loadOrCreateDevKey(filename: string, envValue?: string): Buffer {
  if (envValue && envValue.trim().length >= 16) {
    return crypto.createHash('sha256').update(envValue.trim(), 'utf8').digest();
  }

  // In production without an explicit key, still avoid a static hardcoded string in source code.
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const keyFile = path.resolve(DATA_DIR, filename);
  if (fs.existsSync(keyFile)) {
    const hex = fs.readFileSync(keyFile, 'utf-8').trim();
    if (/^[0-9a-f]{64}$/i.test(hex)) {
      return Buffer.from(hex, 'hex');
    }
  }
  const generated = crypto.randomBytes(32);
  fs.writeFileSync(keyFile, generated.toString('hex'), { mode: 0o600 });
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      `[Heali Security] ${filename} generated locally because env var was unset. Configure HEALI_DATA_KEY and HEALI_SESSION_SECRET in environment secrets.`
    );
  }
  return generated;
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  isProd: process.env.NODE_ENV === 'production',
  dataDir: DATA_DIR,
  dbPath: path.resolve(DATA_DIR, 'heali.db'),
  legacyJsonDbPath: path.resolve(DATA_DIR, 'heali_db.json'),
  dataEncryptionKey: loadOrCreateDevKey('.heali_data.key', process.env.HEALI_DATA_KEY),
  sessionSecret: loadOrCreateDevKey('.heali_session.key', process.env.HEALI_SESSION_SECRET),
  featurePaidSpiritual: process.env.FEATURE_PAID_SPIRITUAL === 'true',
  adminPasscode: (process.env.HEALI_ADMIN_PASSCODE || '').trim(),
  allowedOrigins: (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  sessionTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  pinUnlockTtlMs: 30 * 60 * 1000, // 30 minutes
  adminSessionTtlMs: 8 * 60 * 60 * 1000, // 8 hours
};
