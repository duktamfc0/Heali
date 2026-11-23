import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { sqliteDb } from '../db/database.js';
import { authMiddleware, createRateLimiter, extractBearerToken, extractPinToken, isPinSessionValid, toSafeUserDto } from '../middleware/auth.js';
import {
  decryptSensitiveText,
  generateRecoveryCode,
  generateSecureToken,
  hashPin,
  hashRecoveryCode,
  hashToken,
  verifyPin,
  verifyRecoveryCode,
} from '../utils/crypto.js';
import type { DbUserRow } from '../types.js';

export const authRouter = Router();

const sessionInitSchema = z.object({
  existingToken: z.string().max(200).nullish(),
  nickname: z.string().max(40).optional(),
  avatar: z.string().max(24).optional(),
});

const profilePatchSchema = z.object({
  nickname: z.string().min(1).max(40).optional(),
  avatar: z.enum(['heart', 'moon', 'sun', 'leaf', 'cloud', 'sparkles']).optional(),
  statusMessage: z.string().max(120).optional(),
  pinCode: z.union([z.string().min(4).max(8), z.literal(''), z.null()]).optional(),
  currentPin: z.string().max(8).optional(),
});

const pinVerifySchema = z.object({
  pinCode: z.string().min(1).max(12),
});

const recoveryRestoreSchema = z.object({
  userId: z.string().min(3).max(80),
  recoveryCode: z.string().min(8).max(40),
});

const pinAttemptLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  keyPrefix: 'pin_verify',
});

// 1. Create or resume anonymous session (returns raw token only on session issue/rotate, NEVER returns pinHash)
authRouter.post('/session', (req, res) => {
  const parsed = sessionInitSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Dữ liệu phiên không hợp lệ.' });
    return;
  }
  const { existingToken, nickname, avatar } = parsed.data;

  if (existingToken) {
    const existing = sqliteDb
      .prepare('SELECT * FROM users WHERE token_hash = ?')
      .get(hashToken(existingToken)) as DbUserRow | undefined;

    if (existing && new Date(existing.token_expires_at).getTime() > Date.now()) {
      // Extend sliding session TTL gently
      const newExpiry = new Date(Date.now() + config.sessionTtlMs).toISOString();
      sqliteDb.prepare('UPDATE users SET token_expires_at = ? WHERE id = ?').run(newExpiry, existing.id);
      const pinTok = extractPinToken(req);
      const pinUnlocked = isPinSessionValid(existing.id, pinTok);
      res.json({
        user: toSafeUserDto(existing, pinUnlocked),
        token: existingToken,
      });
      return;
    }
  }

  const randomSuffix = Math.floor(1000 + crypto.randomInt(0, 9000));
  const defaultNames = ['Gió Đêm', 'Hạt Nắng Nhỏ', 'Cỏ May', 'Đom Đóm', 'Mây Trắng', 'Cúc Hoa', 'Giọt Sương'];
  const chosenName = (nickname?.trim() || `${defaultNames[crypto.randomInt(0, defaultNames.length)]} #${randomSuffix}`).slice(0, 40);
  const allowedAvatars = ['heart', 'moon', 'sun', 'leaf', 'cloud', 'sparkles'];
  const chosenAvatar = avatar && allowedAvatars.includes(avatar) ? avatar : 'heart';

  const userId = `u-${crypto.randomUUID()}`;
  const rawToken = generateSecureToken('hl_tok');
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + config.sessionTtlMs).toISOString();

  sqliteDb
    .prepare(`
      INSERT INTO users (id, token_hash, token_expires_at, nickname, avatar, status_message, pin_hash, recovery_code_hash, blocked_user_ids_json, reported_post_ids_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, '[]', '[]', ?)
    `)
    .run(userId, hashToken(rawToken), expiresAt, chosenName, chosenAvatar, 'Một góc nhỏ yên tĩnh cho lúc lòng vỡ.', nowIso);

  const created = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as DbUserRow;
  res.json({
    user: toSafeUserDto(created, true),
    token: rawToken,
  });
});

// 2. Rotate / revoke current session token cleanly
authRouter.post('/session/rotate', authMiddleware, (req, res) => {
  const user = req.authUser!;
  const newToken = generateSecureToken('hl_tok');
  const expiresAt = new Date(Date.now() + config.sessionTtlMs).toISOString();

  sqliteDb
    .prepare('UPDATE users SET token_hash = ?, token_expires_at = ? WHERE id = ?')
    .run(hashToken(newToken), expiresAt, user.id);

  res.json({ token: newToken, user: req.safeUser });
});

// 3. Update Profile or configure hashed PIN
authRouter.patch('/profile', authMiddleware, (req, res) => {
  const parsed = profilePatchSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Thông tin cập nhật không hợp lệ.' });
    return;
  }

  const user = req.authUser!;
  const { nickname, avatar, statusMessage, pinCode, currentPin } = parsed.data;

  // If user already has a PIN and wants to change/remove it, verify current PIN or active PIN unlock session
  if (pinCode !== undefined && user.pin_hash) {
    const pinOk = currentPin ? verifyPin(currentPin, user.pin_hash) : Boolean(req.pinUnlocked);
    if (!pinOk) {
      res.status(403).json({ error: 'Cần mở khóa bằng mã PIN hiện tại trước khi thay đổi PIN.' });
      return;
    }
  }

  const nextNickname = nickname !== undefined ? nickname.trim().slice(0, 40) : user.nickname;
  const nextAvatar = avatar !== undefined ? avatar : user.avatar;
  const nextStatus = statusMessage !== undefined ? statusMessage.trim().slice(0, 120) : user.status_message;

  let nextPinHash = user.pin_hash;
  let issuedPinToken: string | undefined;

  if (pinCode !== undefined) {
    if (!pinCode || pinCode === '') {
      nextPinHash = null;
      sqliteDb.prepare('DELETE FROM pin_unlock_sessions WHERE user_id = ?').run(user.id);
    } else {
      nextPinHash = hashPin(pinCode.trim());
      // Issue an immediate unlock token for this device
      issuedPinToken = generateSecureToken('hl_pin');
      sqliteDb.prepare('DELETE FROM pin_unlock_sessions WHERE user_id = ?').run(user.id);
      sqliteDb
        .prepare('INSERT INTO pin_unlock_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(
          hashToken(issuedPinToken),
          user.id,
          new Date(Date.now() + config.pinUnlockTtlMs).toISOString(),
          new Date().toISOString()
        );
    }
  }

  sqliteDb
    .prepare(`
      UPDATE users
      SET nickname = ?, avatar = ?, status_message = ?, pin_hash = ?, pin_failed_attempts = 0, pin_locked_until = NULL
      WHERE id = ?
    `)
    .run(nextNickname, nextAvatar, nextStatus, nextPinHash, user.id);

  const updated = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as unknown as DbUserRow;
  const pinUnlocked = !updated.pin_hash || Boolean(issuedPinToken) || Boolean(req.pinUnlocked);
  res.json({
    user: toSafeUserDto(updated, pinUnlocked),
    ...(issuedPinToken ? { pinToken: issuedPinToken } : {}),
  });
});

// 4. Server-side PIN verification endpoint (rate-limited & lockout protected)
authRouter.post('/pin/verify', authMiddleware, pinAttemptLimiter, (req, res) => {
  const parsed = pinVerifySchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Vui lòng nhập mã PIN.' });
    return;
  }

  const user = req.authUser!;
  if (!user.pin_hash) {
    res.json({ unlocked: true, pinToken: null, user: toSafeUserDto(user, true) });
    return;
  }

  if (user.pin_locked_until && new Date(user.pin_locked_until).getTime() > Date.now()) {
    const secs = Math.ceil((new Date(user.pin_locked_until).getTime() - Date.now()) / 1000);
    res.status(429).json({
      error: `Nhập sai PIN quá nhiều lần. Vui lòng thử lại sau ${secs} giây.`,
    });
    return;
  }

  const isMatch = verifyPin(parsed.data.pinCode.trim(), user.pin_hash);
  if (!isMatch) {
    const nextFails = (user.pin_failed_attempts || 0) + 1;
    const lockedUntil =
      nextFails >= 5 ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null;
    sqliteDb
      .prepare('UPDATE users SET pin_failed_attempts = ?, pin_locked_until = ? WHERE id = ?')
      .run(nextFails >= 5 ? 0 : nextFails, lockedUntil, user.id);
    res.status(401).json({
      error: lockedUntil
        ? 'Nhập sai 5 lần. Tạm khóa mở PIN trong 5 phút để bảo vệ riêng tư.'
        : `Mã PIN không chính xác (còn ${5 - nextFails} lần thử).`,
    });
    return;
  }

  sqliteDb
    .prepare('UPDATE users SET pin_failed_attempts = 0, pin_locked_until = NULL WHERE id = ?')
    .run(user.id);

  const pinToken = generateSecureToken('hl_pin');
  const expiresAt = new Date(Date.now() + config.pinUnlockTtlMs).toISOString();
  sqliteDb
    .prepare('INSERT INTO pin_unlock_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(pinToken), user.id, expiresAt, new Date().toISOString());

  res.json({
    unlocked: true,
    pinToken,
    expiresAt,
    user: toSafeUserDto(user, true),
  });
});

// 5. Lock private space manually
authRouter.post('/pin/lock', authMiddleware, (req, res) => {
  const pinTok = extractPinToken(req);
  if (pinTok) {
    sqliteDb.prepare('DELETE FROM pin_unlock_sessions WHERE token_hash = ?').run(hashToken(pinTok));
  } else {
    sqliteDb.prepare('DELETE FROM pin_unlock_sessions WHERE user_id = ?').run(req.authUser!.id);
  }
  res.json({ unlocked: false });
});

// 6. Optional recovery code generation so losing a device doesn't lose private journals
authRouter.post('/recovery/generate', authMiddleware, (req, res) => {
  const user = req.authUser!;
  if (user.pin_hash && !req.pinUnlocked) {
    res.status(423).json({ error: 'Vui lòng mở khóa PIN trước khi tạo mã khôi phục.', pinRequired: true });
    return;
  }

  const code = generateRecoveryCode();
  sqliteDb
    .prepare('UPDATE users SET recovery_code_hash = ? WHERE id = ?')
    .run(hashRecoveryCode(code), user.id);

  res.json({
    recoveryCode: code,
    accountId: user.id,
    note: 'Hãy lưu mã này ở nơi an toàn (ví dụ trình quản lý mật khẩu). Hệ thống chỉ lưu bản băm, không thể xem lại mã này sau khi đóng.',
  });
});

// 7. Restore session on a new browser/device using accountId + recoveryCode
authRouter.post('/recovery/restore', pinAttemptLimiter, (req, res) => {
  const parsed = recoveryRestoreSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Thiếu mã tài khoản hoặc mã khôi phục.' });
    return;
  }
  const { userId, recoveryCode } = parsed.data;
  const user = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(userId.trim()) as DbUserRow | undefined;
  if (!user || !user.recovery_code_hash || !verifyRecoveryCode(recoveryCode, user.recovery_code_hash)) {
    res.status(401).json({ error: 'Mã tài khoản hoặc mã khôi phục không đúng.' });
    return;
  }

  const newToken = generateSecureToken('hl_tok');
  const expiresAt = new Date(Date.now() + config.sessionTtlMs).toISOString();
  sqliteDb
    .prepare('UPDATE users SET token_hash = ?, token_expires_at = ? WHERE id = ?')
    .run(hashToken(newToken), expiresAt, user.id);

  res.json({
    token: newToken,
    user: toSafeUserDto(user, !user.pin_hash),
  });
});

// 8. Complete User Export of Personal Data (Encrypted-at-rest decrypted only for authenticated & PIN-unlocked owner)
authRouter.get('/export', authMiddleware, (req, res) => {
  const user = req.authUser!;
  if (user.pin_hash && !req.pinUnlocked) {
    res.status(423).json({ error: 'Cần mở khóa PIN trước khi xuất dữ liệu riêng tư.', pinRequired: true });
    return;
  }

  const journals = (
    sqliteDb.prepare('SELECT * FROM journals WHERE user_id = ? ORDER BY created_at DESC').all(user.id) as Array<{
      id: string;
      date: string;
      mood_score: number;
      emotions_json: string;
      title_enc: string;
      content_enc: string;
      gratitude_enc: string;
      self_care_action_enc: string;
      created_at: string;
    }>
  ).map((j) => ({
    id: j.id,
    date: j.date,
    moodScore: j.mood_score,
    emotions: JSON.parse(j.emotions_json || '[]'),
    title: decryptSensitiveText(j.title_enc),
    content: decryptSensitiveText(j.content_enc),
    gratitude: decryptSensitiveText(j.gratitude_enc),
    selfCareAction: decryptSensitiveText(j.self_care_action_enc),
    createdAt: j.created_at,
  }));

  const letters = (
    sqliteDb.prepare('SELECT * FROM unsent_letters WHERE user_id = ? ORDER BY created_at DESC').all(user.id) as Array<{
      id: string;
      recipient: string;
      recipient_name_enc: string;
      title_enc: string;
      content_enc: string;
      status: string;
      sealed_until: string | null;
      created_at: string;
    }>
  ).map((l) => ({
    id: l.id,
    recipient: l.recipient,
    recipientName: decryptSensitiveText(l.recipient_name_enc),
    title: decryptSensitiveText(l.title_enc),
    content: decryptSensitiveText(l.content_enc),
    status: l.status,
    sealedUntil: l.sealed_until,
    createdAt: l.created_at,
  }));

  const moodCheckins = (
    sqliteDb.prepare('SELECT * FROM mood_checkins WHERE user_id = ? ORDER BY created_at DESC').all(user.id) as Array<{
      id: string;
      date: string;
      mood_score: number;
      emotions_json: string;
      note_enc: string;
      created_at: string;
    }>
  ).map((m) => ({
    id: m.id,
    date: m.date,
    moodScore: m.mood_score,
    emotions: JSON.parse(m.emotions_json || '[]'),
    note: decryptSensitiveText(m.note_enc),
    createdAt: m.created_at,
  }));

  res.json({
    app: 'Heali',
    exportedAt: new Date().toISOString(),
    account: toSafeUserDto(user, true),
    journals,
    unsentLetters: letters,
    moodCheckins,
  });
});

// 9. Immediate, permanent account & personal data deletion
authRouter.delete('/account', authMiddleware, (req, res) => {
  const user = req.authUser!;
  if (user.pin_hash && !req.pinUnlocked) {
    res.status(423).json({ error: 'Vui lòng mở khóa PIN để xác nhận xóa toàn bộ tài khoản.', pinRequired: true });
    return;
  }

  const rawTok = extractBearerToken(req);
  const del = sqliteDb.prepare.bind(sqliteDb);

  sqliteDb.exec('BEGIN');
  try {
    // Also scrub public posts authored by this user if requested? Remove public confessions/lanterns/wishes tied to user_id as well
    del('DELETE FROM confessions WHERE author_id = ?').run(user.id);
    del('DELETE FROM lanterns WHERE author_id = ?').run(user.id);
    del('DELETE FROM wishes WHERE author_id = ?').run(user.id);
    del('DELETE FROM lounge_messages WHERE sender_id = ?').run(user.id);
    del('DELETE FROM journals WHERE user_id = ?').run(user.id);
    del('DELETE FROM mood_checkins WHERE user_id = ?').run(user.id);
    del('DELETE FROM unsent_letters WHERE user_id = ?').run(user.id);
    del('DELETE FROM music_habits WHERE user_id = ?').run(user.id);
    del('DELETE FROM spiritual_bookings WHERE user_id = ?').run(user.id);
    del('DELETE FROM spiritual_viewer_passes WHERE user_id = ?').run(user.id);
    del('DELETE FROM pin_unlock_sessions WHERE user_id = ?').run(user.id);
    del('DELETE FROM users WHERE id = ?').run(user.id);
    sqliteDb.exec('COMMIT');
  } catch (err) {
    sqliteDb.exec('ROLLBACK');
    console.error('[Heali Auth] Account delete error:', err);
    res.status(500).json({ error: 'Không thể xóa tài khoản lúc này.' });
    return;
  }

  if (rawTok) {
    // Token row already deleted via users
  }

  res.json({
    success: true,
    message: 'Toàn bộ tài khoản, nhật ký, thư và dữ liệu liên kết của bạn đã được xóa vĩnh viễn.',
  });
});
