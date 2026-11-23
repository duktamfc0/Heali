import type { Request, Response, NextFunction } from 'express';
import { sqliteDb } from '../db/database.js';
import { hashToken } from '../utils/crypto.js';
import type { DbUserRow, SafeUserDto } from '../types.js';

export function extractBearerToken(req: Request): string {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const headerToken = req.headers['x-heali-token'];
  if (typeof headerToken === 'string') {
    return headerToken.trim();
  }
  return '';
}

export function extractPinToken(req: Request): string {
  const raw = req.headers['x-heali-pin-token'];
  return typeof raw === 'string' ? raw.trim() : '';
}

export function isPinSessionValid(userId: string, rawPinToken: string): boolean {
  if (!rawPinToken) return false;
  const row = sqliteDb
    .prepare('SELECT expires_at FROM pin_unlock_sessions WHERE token_hash = ? AND user_id = ?')
    .get(hashToken(rawPinToken), userId) as { expires_at: string } | undefined;
  if (!row) return false;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    sqliteDb.prepare('DELETE FROM pin_unlock_sessions WHERE token_hash = ?').run(hashToken(rawPinToken));
    return false;
  }
  return true;
}

export function toSafeUserDto(row: DbUserRow, pinUnlocked: boolean): SafeUserDto {
  let blockedUserIds: string[] = [];
  let reportedPostIds: string[] = [];
  try {
    blockedUserIds = JSON.parse(row.blocked_user_ids_json || '[]');
  } catch {
    blockedUserIds = [];
  }
  try {
    reportedPostIds = JSON.parse(row.reported_post_ids_json || '[]');
  } catch {
    reportedPostIds = [];
  }

  return {
    id: row.id,
    nickname: row.nickname,
    avatar: row.avatar,
    statusMessage: row.status_message,
    hasPin: Boolean(row.pin_hash),
    pinUnlocked: !row.pin_hash || pinUnlocked,
    hasRecoveryCode: Boolean(row.recovery_code_hash),
    blockedUserIds,
    reportedPostIds,
    isBanned: Boolean(row.is_banned),
    createdAt: row.created_at,
  };
}

export function findUserByRawToken(rawToken: string): DbUserRow | null {
  if (!rawToken || rawToken.length < 16) return null;
  const row = sqliteDb
    .prepare('SELECT * FROM users WHERE token_hash = ?')
    .get(hashToken(rawToken)) as DbUserRow | undefined;
  if (!row) return null;
  if (new Date(row.token_expires_at).getTime() <= Date.now()) {
    return null;
  }
  return row;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  const row = findUserByRawToken(token);
  if (!row) {
    res.status(401).json({ error: 'Phiên truy cập không hợp lệ hoặc đã hết hạn.' });
    return;
  }

  const pinTok = extractPinToken(req);
  const pinUnlocked = isPinSessionValid(row.id, pinTok);
  req.authUser = row;
  req.safeUser = toSafeUserDto(row, pinUnlocked);
  req.pinUnlocked = !row.pin_hash || pinUnlocked;
  next();
}

export function requirePinUnlocked(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Thiếu xác thực phiên.' });
    return;
  }
  if (req.authUser.pin_hash && !req.pinUnlocked) {
    res.status(423).json({
      error: 'Không gian riêng tư đang khóa. Vui lòng nhập mã PIN để mở.',
      pinRequired: true,
    });
    return;
  }
  next();
}

export function createRateLimiter(options: { windowMs: number; max: number; keyPrefix: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodic cleanup of expired rate limit buckets
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits.entries()) {
      if (v.resetAt <= now) hits.delete(k);
    }
  }, Math.max(30_000, options.windowMs));
  timer.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = req.authUser?.id || 'anon';
    const bucketKey = `${options.keyPrefix}:${ip}:${userId}`;
    const now = Date.now();
    const existing = hits.get(bucketKey);

    if (!existing || existing.resetAt <= now) {
      hits.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      res.status(429).json({
        error: 'Bạn thao tác hơi nhanh một chút. Hãy nghỉ vài giây rồi thử lại nhé.',
      });
      return;
    }

    existing.count += 1;
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      authUser?: DbUserRow;
      safeUser?: SafeUserDto;
      pinUnlocked?: boolean;
    }
  }
}
