import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { config } from '../server/config.js';
import { sqliteDb, verifyBackupAndRestore } from '../server/db/database.js';
import { authRouter } from '../server/routes/auth.js';
import { privateRouter } from '../server/routes/private.js';
import { growthRouter } from '../server/routes/growth.js';
import { moderationRouter } from '../server/routes/moderation.js';

describe('Stage 3 Growth, Lantern Gifts, Healthy Metrics & Backup Restoration Tests', () => {
  let server: http.Server;
  let baseUrl = '';
  const createdUserIds: string[] = [];
  const createdGiftIds: string[] = [];
  const createdLanternIds: string[] = [];
  const createdMetricIds: string[] = [];
  const createdFeedbackIds: string[] = [];
  let originalAdminPasscode = '';
  const testAdminPasscode = 'HealiStage3AdminPass#2026';

  before(async () => {
    originalAdminPasscode = config.adminPasscode;
    (config as { adminPasscode: string }).adminPasscode = testAdminPasscode;

    const app = express();
    app.use(express.json({ limit: '512kb' }));
    app.use('/api/auth', authRouter);
    app.use('/api/private', privateRouter);
    app.use('/api', growthRouter);
    app.use('/api/admin', moderationRouter);

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
    (config as { adminPasscode: string }).adminPasscode = originalAdminPasscode;

    for (const gid of createdGiftIds) {
      sqliteDb.prepare(`DELETE FROM shared_lantern_gifts WHERE id = ?`).run(gid);
    }
    for (const lid of createdLanternIds) {
      sqliteDb.prepare(`DELETE FROM lanterns WHERE id = ?`).run(lid);
    }
    for (const uid of createdUserIds) {
      sqliteDb.prepare(`DELETE FROM shared_lantern_gifts WHERE sender_user_id = ?`).run(uid);
      sqliteDb.prepare(`DELETE FROM unsent_letters WHERE user_id = ?`).run(uid);
      sqliteDb.prepare(`DELETE FROM users WHERE id = ?`).run(uid);
    }
    for (const mid of createdMetricIds) {
      sqliteDb.prepare(`DELETE FROM healthy_metric_events WHERE id = ?`).run(mid);
    }
    for (const fid of createdFeedbackIds) {
      sqliteDb.prepare(`DELETE FROM beta_feedback WHERE id = ?`).run(fid);
    }
    sqliteDb.prepare(`DELETE FROM beta_feedback WHERE note LIKE 'Stage3TestFeedback%'`).run();
    sqliteDb.prepare(`DELETE FROM lanterns WHERE message LIKE 'Stage3Reply%'`).run();

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('creates anonymous lantern gifts with safety checks, 5/24h cap, guest read without login, reply lantern, and instant opt-out', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'FriendSender 0912345678' }),
    });
    const sessData = await sessRes.json();
    const token: string = sessData.token;
    createdUserIds.push(sessData.user.id);

    // 1. Block Level >= 2 crisis / contact info
    const crisisGift = await fetch(`${baseUrl}/api/lantern-gifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: 'Tôi muốn tự tử ngay đêm nay', color: 'gold' }),
    });
    assert.equal(crisisGift.status, 400);

    const contactGift = await fetch(`${baseUrl}/api/lantern-gifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: 'Chuyển khoản momo hoặc gọi 0912345678 cho mình nhé', color: 'gold' }),
    });
    assert.equal(contactGift.status, 400);

    // 2. Create 5 gifts up to daily cap & verify 6th is throttled with 429
    let firstGiftId = '';
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/lantern-gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: `Hôm nay mệt cứ nghỉ một chút nhé (${i + 1})`,
          color: 'gold',
          showSenderName: i === 0,
          senderAlias: i === 0 ? 'An 0912345678' : '',
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      createdGiftIds.push(data.gift.id);
      if (i === 0) {
        firstGiftId = data.gift.id;
        // Phone stripped from public sender display name
        assert.equal(String(data.gift.senderDisplayName || '').includes('0912345678'), false);
      }
    }

    const sixthGift = await fetch(`${baseUrl}/api/lantern-gifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: 'Ngọn đèn thứ 6 vượt giới hạn', color: 'pink' }),
    });
    assert.equal(sixthGift.status, 429);

    // 3. Guest opens link WITHOUT auth header -> succeeds & exposes zero sender_user_id
    const openRes = await fetch(`${baseUrl}/api/lantern-gifts/${firstGiftId}`);
    assert.equal(openRes.status, 200);
    const openJson = await openRes.json();
    assert.equal(openJson.gift.id, firstGiftId);
    assert.equal('sender_user_id' in openJson.gift, false);

    // 4. Guest lights a lantern back -> replies & creates anonymous lake lantern
    const replyRes = await fetch(`${baseUrl}/api/lantern-gifts/${firstGiftId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyMessage: 'Stage3Reply cảm ơn bạn nhiều nhé', color: 'pink' }),
    });
    assert.equal(replyRes.status, 201);

    // 5. Recipient clicks "Không muốn nhận" -> content wiped & future GET returns 410
    const optOutRes = await fetch(`${baseUrl}/api/lantern-gifts/${firstGiftId}/opt-out`, {
      method: 'POST',
    });
    assert.equal(optOutRes.status, 200);

    const afterOptOut = await fetch(`${baseUrl}/api/lantern-gifts/${firstGiftId}`);
    assert.equal(afterOptOut.status, 410);
    const rowAfter = sqliteDb
      .prepare(`SELECT message, sender_display_name, is_opted_out FROM shared_lantern_gifts WHERE id = ?`)
      .get(firstGiftId) as { message: string; sender_display_name: string; is_opted_out: number };
    assert.equal(rowAfter.is_opted_out, 1);
    assert.equal(rowAfter.message, '');
    assert.equal(rowAfter.sender_display_name, '');
  });

  it('serves Đêm Hoa Đăng public schedule without PII', async () => {
    const res = await fetch(`${baseUrl}/api/lantern-night`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.nextEvent?.title);
    assert.ok(Array.isArray(data.upcomingEvents));
    assert.equal(typeof data.publicLanternsCount, 'number');
    assert.equal(JSON.stringify(data).includes('pin_hash'), false);
  });

  it('records allowlisted privacy-first healthy metrics and exposes aggregates on /api/admin/metrics', async () => {
    const badMetric = await fetch(`${baseUrl}/api/metrics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'track_user_session_duration_hack' }),
    });
    assert.equal(badMetric.status, 400);

    const okCalm = await fetch(`${baseUrl}/api/metrics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'calm_tool_completed' }),
    });
    assert.equal(okCalm.status, 201);

    const okUseful = await fetch(`${baseUrl}/api/metrics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'first_useful_action', valueMs: 12000 }),
    });
    assert.equal(okUseful.status, 201);

    const fbRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Stage3TestFeedback giao diện dễ đọc', category: 'general' }),
    });
    assert.equal(fbRes.status, 201);

    // Unauthorized access blocked
    const unauth = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(unauth.status, 401);

    // Login admin & inspect metrics
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: testAdminPasscode, moderatorAlias: 'Mod3' }),
    });
    assert.equal(loginRes.status, 200);
    const { token: adminToken } = await loginRes.json();

    const metricsRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(metricsRes.status, 200);
    const metrics = await metricsRes.json();
    assert.ok(metrics.aggregates.calm_tool_completed >= 1);
    assert.ok(metrics.medianFirstUsefulMs !== null);
    assert.ok(metrics.feedbackNotes.some((n: { note: string }) => n.note.startsWith('Stage3TestFeedback')));
  });

  it('verifies backup & restore integrity and ensures burned unsent letters stay absent after restore', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'BackupTester' }),
    });
    const { token, user } = await sessRes.json();
    createdUserIds.push(user.id);

    const createLetter = await fetch(`${baseUrl}/api/private/letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        recipient: 'ex',
        recipientName: 'Cũ',
        title: 'Bức thư chuẩn bị hoá tro',
        content: 'Bí mật riêng tư tuyệt đối không được còn sau khi xoá.',
      }),
    });
    assert.equal(createLetter.status, 201);
    const { letter } = await createLetter.json();

    const burnRes = await fetch(`${baseUrl}/api/private/letters/${letter.id}/burn`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(burnRes.status, 200);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heali-backup-test-'));
    const backupFile = path.join(tmpDir, 'heali-backup.db');
    const restoreFile = path.join(tmpDir, 'heali-restored.db');

    try {
      const verify = verifyBackupAndRestore(backupFile, restoreFile);
      assert.equal(verify.backupExists, true);
      assert.equal(verify.integrityCheckOk, true);
      assert.ok(verify.restoredConfessionsCount >= 0);

      // Assert burned letter cannot exist in restored DB
      const { DatabaseSync } = await import('node:sqlite');
      const restoredDb = new DatabaseSync(restoreFile);
      try {
        const found = restoredDb
          .prepare(`SELECT id FROM unsent_letters WHERE id = ?`)
          .get(letter.id);
        assert.equal(found, undefined);
      } finally {
        restoredDb.close();
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
