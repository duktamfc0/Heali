import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import {
  encryptSensitiveText,
  decryptSensitiveText,
  hashPin,
  verifyPin,
  generateSecureToken,
  hashToken,
} from '../server/utils/crypto.js';
import { sqliteDb } from '../server/db/database.js';
import { authRouter } from '../server/routes/auth.js';
import { privateRouter } from '../server/routes/private.js';
import { confessionsRouter } from '../server/routes/confessions.js';
import { helplinesRouter } from '../server/routes/helplines.js';

describe('Stage 0 Security, Privacy & API Integration Tests', () => {
  let server: http.Server;
  let baseUrl = '';
  const createdUserIds: string[] = [];
  const createdConfessionIds: string[] = [];

  before(async () => {
    const app = express();
    app.use(express.json({ limit: '512kb' }));
    app.use('/api/auth', authRouter);
    app.use('/api/private', privateRouter);
    app.use('/api/confessions', confessionsRouter);
    app.use('/api/helplines', helplinesRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    for (const cid of createdConfessionIds) {
      sqliteDb.prepare('DELETE FROM moderation_queue WHERE source_id = ?').run(cid);
      sqliteDb.prepare('DELETE FROM confessions WHERE id = ?').run(cid);
    }
    for (const uid of createdUserIds) {
      sqliteDb.prepare('DELETE FROM confessions WHERE author_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM journals WHERE user_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM unsent_letters WHERE user_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM mood_checkins WHERE user_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM pin_unlock_sessions WHERE user_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM users WHERE id = ?').run(uid);
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('encrypts & decrypts sensitive text with AES-256-GCM without leaving plaintext', () => {
    const secretNote = 'Hôm nay mình thấy rất nặng lòng nhưng vẫn đang cố hít thở.';
    const encrypted = encryptSensitiveText(secretNote);
    assert.ok(encrypted.startsWith('enc:v1:'));
    assert.equal(encrypted.includes('nặng lòng'), false);
    assert.equal(decryptSensitiveText(encrypted), secretNote);
  });

  it('hashes PIN with scrypt and generates non-predictable tokens', () => {
    const hashed = hashPin('2468');
    assert.ok(hashed.startsWith('scrypt:'));
    assert.equal(hashed.includes('2468'), false);
    assert.equal(verifyPin('2468', hashed), true);
    assert.equal(verifyPin('9999', hashed), false);

    const t1 = generateSecureToken('hl_tok');
    const t2 = generateSecureToken('hl_tok');
    assert.notEqual(t1, t2);
    assert.ok(t1.length > 64);
    assert.notEqual(hashToken(t1), t1);
  });

  it('never leaks PIN/hash in API responses and blocks /api/private/* with 423 when PIN is locked', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'TestUser' }),
    });
    assert.equal(sessRes.status, 200);
    const sessData = await sessRes.json();
    const token: string = sessData.token;
    const userId: string = sessData.user.id;
    createdUserIds.push(userId);

    const rawSessStr = JSON.stringify(sessData);
    assert.equal(rawSessStr.includes('pinCode'), false);
    assert.equal(rawSessStr.includes('pin_hash'), false);
    assert.equal(sessData.user.hasPin, false);

    // Enable PIN
    const pinRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pinCode: '2468' }),
    });
    assert.equal(pinRes.status, 200);
    const pinData = await pinRes.json();
    assert.equal(pinData.user.hasPin, true);
    assert.equal(JSON.stringify(pinData).includes('2468'), false);
    assert.equal(JSON.stringify(pinData).includes('scrypt:'), false);

    // Manually lock private space
    const lockRes = await fetch(`${baseUrl}/api/auth/pin/lock`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-heali-pin-token': pinData.pinToken,
      },
    });
    assert.equal(lockRes.status, 200);

    // Accessing /api/private/journal without unlocked PIN token MUST fail with 423
    const lockedGet = await fetch(`${baseUrl}/api/private/journal`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(lockedGet.status, 423);
    const lockedJson = await lockedGet.json();
    assert.equal(lockedJson.pinRequired, true);

    // Wrong PIN fails with 401
    const badVerify = await fetch(`${baseUrl}/api/auth/pin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pinCode: '0000' }),
    });
    assert.equal(badVerify.status, 401);

    // Correct PIN issues pinToken and allows /api/private/journal
    const okVerify = await fetch(`${baseUrl}/api/auth/pin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pinCode: '2468' }),
    });
    assert.equal(okVerify.status, 200);
    const okData = await okVerify.json();
    assert.ok(okData.pinToken);

    const unlockedGet = await fetch(`${baseUrl}/api/private/journal`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-heali-pin-token': okData.pinToken,
      },
    });
    assert.equal(unlockedGet.status, 200);
  });

  it('encrypts journal & letter at rest, and permanently deletes letter on burn', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'BurnTester' }),
    });
    const { token, user } = await sessRes.json();
    createdUserIds.push(user.id);

    const secretMarker = 'UNIQUE_BURN_MARKER_948271';
    const createRes = await fetch(`${baseUrl}/api/private/letters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient: 'ex',
        recipientName: 'Người cũ',
        title: 'Thư gửi gió',
        content: `Nội dung bí mật cần xóa hoàn toàn ${secretMarker}`,
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    const letterId: string = created.letter.id;

    // Verify encrypted at rest in SQLite
    const dbRow = sqliteDb
      .prepare('SELECT content_enc FROM unsent_letters WHERE id = ?')
      .get(letterId) as { content_enc: string } | undefined;
    assert.ok(dbRow);
    assert.ok(dbRow.content_enc.startsWith('enc:v1:'));
    assert.equal(dbRow.content_enc.includes(secretMarker), false);

    // Execute burn ritual (true permanent erasure)
    const burnRes = await fetch(`${baseUrl}/api/private/letters/${letterId}/burn`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(burnRes.status, 200);
    const burnJson = await burnRes.json();
    assert.equal(burnJson.erasedPermanently, true);
    assert.equal(burnJson.letter, undefined);

    // Row MUST be completely absent from SQLite
    const countAfter = sqliteDb
      .prepare('SELECT COUNT(*) as cnt FROM unsent_letters WHERE id = ?')
      .get(letterId) as { cnt: number };
    assert.equal(countAfter.cnt, 0);
  });

  it('holds level >= 2 confession in moderation_queue and excludes it from public feed', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'ModTester' }),
    });
    const { token, user } = await sessRes.json();
    createdUserIds.push(user.id);

    const postRes = await fetch(`${baseUrl}/api/confessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Khó khăn',
        content: 'Hôm nay mình mệt mỏi quá, tôi không muốn sống nữa.',
        category: 'loneliness',
        moodTag: 'Nặng lòng',
      }),
    });
    assert.equal(postRes.status, 201);
    const postJson = await postRes.json();
    createdConfessionIds.push(postJson.confession.id);

    assert.equal(postJson.heldForModeration, true);
    assert.ok(postJson.riskLevel >= 2);

    const feedRes = await fetch(`${baseUrl}/api/confessions`);
    const feedJson = await feedRes.json();
    const visibleIds = (feedJson.confessions as Array<{ id: string }>).map((c) => c.id);
    assert.equal(visibleIds.includes(postJson.confession.id), false);
  });

  it('returns single-source helplines including 115 emergency and scoped 111', async () => {
    const res = await fetch(`${baseUrl}/api/helplines`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const phones = (data.helplines as Array<{ phone: string }>).map((h) => h.phone.replace(/\s+/g, ''));
    assert.ok(phones.includes('115'));
    assert.ok(phones.includes('111'));
  });
});
