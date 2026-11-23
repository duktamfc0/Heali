import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import express from 'express';
import { sqliteDb } from '../server/db/database.js';
import { config } from '../server/config.js';
import { authRouter } from '../server/routes/auth.js';
import { confessionsRouter } from '../server/routes/confessions.js';
import { createCommunityRouter } from '../server/routes/community.js';
import { moderationRouter } from '../server/routes/moderation.js';
import { spiritualRouter } from '../server/routes/spiritual.js';
import { sanitizePublicAlias, getCommunityGateStatus } from '../server/utils/communityGate.js';

describe('Stage 2 Moderated Community & Spiritual Guardrails Tests', () => {
  let server: http.Server;
  let baseUrl = '';
  let originalAdminPasscode = '';
  let adminToken = '';

  const createdUserIds: string[] = [];
  const createdConfessionIds: string[] = [];
  const createdChairIds: string[] = [];
  const createdBookingIds: string[] = [];
  const createdQueueIds: string[] = [];
  const testPasscode = 'HealiStage2AdminPass#2026';

  before(async () => {
    originalAdminPasscode = config.adminPasscode;
    // Use an isolated in-memory test passcode via config for deterministic testing
    (config as { adminPasscode: string }).adminPasscode = testPasscode;

    const app = express();
    app.use(express.json({ limit: '512kb' }));
    app.use('/api/auth', authRouter);
    app.use('/api/confessions', confessionsRouter);
    app.use('/api', createCommunityRouter(() => 0));
    app.use('/api/admin', moderationRouter);
    app.use('/api/spiritual', spiritualRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    // Ensure community gate starts active
    sqliteDb
      .prepare(`UPDATE moderator_shifts SET status = 'ended', ended_at = ? WHERE status = 'active' AND ended_at IS NULL`)
      .run(new Date().toISOString());
    sqliteDb
      .prepare(`
        INSERT INTO moderator_shifts (id, moderator_alias, status, sla_target_minutes, note, started_at, ended_at)
        VALUES (?, 'Stage2TestMod', 'active', 15, 'Active test shift', ?, NULL)
      `)
      .run(`shift-test-${crypto.randomUUID()}`, new Date().toISOString());
  });

  after(async () => {
    (config as { adminPasscode: string }).adminPasscode = originalAdminPasscode;

    for (const qid of createdQueueIds) {
      sqliteDb.prepare('DELETE FROM moderation_audit_logs WHERE queue_item_id = ?').run(qid);
      sqliteDb.prepare('DELETE FROM moderation_queue WHERE id = ?').run(qid);
    }
    for (const cid of createdConfessionIds) {
      sqliteDb.prepare('DELETE FROM moderation_queue WHERE source_id = ?').run(cid);
      sqliteDb.prepare('DELETE FROM confessions WHERE id = ?').run(cid);
    }
    for (const bid of createdBookingIds) {
      sqliteDb.prepare('DELETE FROM spiritual_bookings WHERE id = ?').run(bid);
    }
    for (const chId of createdChairIds) {
      sqliteDb.prepare('DELETE FROM spiritual_bookings WHERE chair_id = ?').run(chId);
      sqliteDb.prepare('DELETE FROM spiritual_chairs WHERE id = ?').run(chId);
    }
    for (const uid of createdUserIds) {
      sqliteDb.prepare('DELETE FROM confessions WHERE author_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM spiritual_bookings WHERE user_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM spiritual_chairs WHERE owner_user_id = ?').run(uid);
      sqliteDb.prepare('DELETE FROM users WHERE id = ?').run(uid);
    }

    // Restore an active baseline shift so live server/other suites keep community open
    sqliteDb
      .prepare(`UPDATE moderator_shifts SET status = 'ended', ended_at = ? WHERE status = 'active' AND ended_at IS NULL`)
      .run(new Date().toISOString());
    sqliteDb.prepare(`DELETE FROM moderator_shifts WHERE moderator_alias = 'Stage2TestMod'`).run();
    sqliteDb
      .prepare(`
        INSERT INTO moderator_shifts (id, moderator_alias, status, sla_target_minutes, note, started_at, ended_at)
        VALUES (?, 'Đội điều phối Heali', 'active', 15, 'Ca trực kiểm duyệt mẫu đang mở.', ?, NULL)
      `)
      .run(`shift-restore-${crypto.randomUUID()}`, new Date().toISOString());

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('sanitizes public aliases to strip phone numbers, URLs, and @handles', () => {
    assert.equal(sanitizePublicAlias('Linh 0912345678'), 'Bạn Lữ Hành');
    assert.equal(sanitizePublicAlias('An https://zalo.me/abc @linh_heali'), 'Bạn Lữ Hành');
    assert.equal(sanitizePublicAlias('0987654321'), 'Bạn Lữ Hành');
    assert.equal(sanitizePublicAlias('  Linh An  '), 'Linh An');
  });

  it('requires valid admin authentication for /api/admin/overview and authenticates with HEALI_ADMIN_PASSCODE', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(unauthRes.status, 401);

    const badLogin = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'wrong-passcode-123' }),
    });
    assert.equal(badLogin.status, 401);

    const okLogin = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: testPasscode, moderatorAlias: 'Stage2TestMod' }),
    });
    assert.equal(okLogin.status, 200);
    const loginJson = await okLogin.json();
    assert.ok(loginJson.token);
    adminToken = loginJson.token;

    const overviewRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(overviewRes.status, 200);
    const overview = await overviewRes.json();
    assert.equal(overview.gate.communityOpen, true);
  });

  it('sorts moderation_queue by Level 3 -> Level 2 -> User Report priority and enforces ban + audit log on resolve', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'QueuePriorityUser' }),
    });
    const { token, user } = await sessRes.json();
    createdUserIds.push(user.id);

    // 1) Normal report item (risk_level 0)
    const normalPostRes = await fetch(`${baseUrl}/api/confessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Chia sẻ nhỏ',
        content: 'Hôm nay trời mưa nhẹ làm mình nhớ nhà.',
        category: 'healing',
        moodTag: 'Lắng dịu',
      }),
    });
    assert.equal(normalPostRes.status, 201);
    const normalPost = await normalPostRes.json();
    createdConfessionIds.push(normalPost.confession.id);

    const repRes = await fetch(`${baseUrl}/api/confessions/${normalPost.confession.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: 'Kiểm thử báo cáo cộng đồng' }),
    });
    assert.equal(repRes.status, 200);

    // 2) Level 2 confession
    const lvl2Res = await fetch(`${baseUrl}/api/confessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Nặng lòng',
        content: 'Mình thấy chán sống quá, không muốn tiếp tục nữa.',
        category: 'loneliness',
        moodTag: 'Mệt mỏi',
      }),
    });
    const lvl2Post = await lvl2Res.json();
    assert.equal(lvl2Post.riskLevel, 2);
    createdConfessionIds.push(lvl2Post.confession.id);

    // 3) Level 3 confession (explicit plan/time)
    const lvl3Res = await fetch(`${baseUrl}/api/confessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Lời tạm biệt',
        content: 'Đêm nay tôi sẽ tự tử để kết thúc tất cả.',
        category: 'loneliness',
        moodTag: 'Tuyệt vọng',
      }),
    });
    const lvl3Post = await lvl3Res.json();
    assert.equal(lvl3Post.riskLevel, 3);
    createdConfessionIds.push(lvl3Post.confession.id);

    const queueRes = await fetch(`${baseUrl}/api/admin/queue?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(queueRes.status, 200);
    const queueData = await queueRes.json();
    const items = queueData.items as Array<{
      id: string;
      sourceId: string;
      riskLevel: number;
    }>;

    const idxLvl3 = items.findIndex((i) => i.sourceId === lvl3Post.confession.id);
    const idxLvl2 = items.findIndex((i) => i.sourceId === lvl2Post.confession.id);
    const idxReport = items.findIndex((i) => i.sourceId === normalPost.confession.id);

    assert.ok(idxLvl3 !== -1 && idxLvl2 !== -1 && idxReport !== -1);
    assert.ok(idxLvl3 < idxLvl2, 'Level 3 item must rank before Level 2');
    assert.ok(idxLvl2 < idxReport, 'Level 2 item must rank before regular report');

    createdQueueIds.push(items[idxLvl3].id, items[idxLvl2].id, items[idxReport].id);

    // Resolve the report with ban_author and verify user is banned + audit log recorded
    const banRes = await fetch(`${baseUrl}/api/admin/queue/${items[idxReport].id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'ban_author', note: 'Kiểm thử khóa tài khoản vi phạm' }),
    });
    assert.equal(banRes.status, 200);

    const auditCount = (
      sqliteDb
        .prepare('SELECT COUNT(*) as cnt FROM moderation_audit_logs WHERE queue_item_id = ?')
        .get(items[idxReport].id) as { cnt: number }
    ).cnt;
    assert.equal(auditCount, 1);

    // Banned user is blocked from posting new confessions (403)
    const blockedPostRes = await fetch(`${baseUrl}/api/confessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Thử đăng lại',
        content: 'Kiểm tra quyền đăng sau khi bị khóa.',
        category: 'healing',
        moodTag: 'Bình thường',
      }),
    });
    assert.equal(blockedPostRes.status, 403);
  });

  it('closes public community submissions (503) when moderator shift is paused and reopens when active', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'ShiftGateTester' }),
    });
    const { token, user } = await sessRes.json();
    createdUserIds.push(user.id);

    try {
      const pauseRes = await fetch(`${baseUrl}/api/admin/shift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'paused',
          moderatorAlias: 'Stage2TestMod',
          slaTargetMinutes: 20,
          note: 'Tạm nghỉ ngoài giờ kiểm duyệt',
        }),
      });
      assert.equal(pauseRes.status, 200);

      const statusRes = await fetch(`${baseUrl}/api/community/status`);
      const statusJson = await statusRes.json();
      assert.equal(statusJson.communityOpen, false);
      assert.equal(getCommunityGateStatus().communityOpen, false);

      const blockedRes = await fetch(`${baseUrl}/api/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: 'Ngoài giờ',
          content: 'Mình muốn đăng khi ngoài ca trực.',
          category: 'healing',
          moodTag: 'Tĩnh',
        }),
      });
      assert.equal(blockedRes.status, 503);
    } finally {
      await fetch(`${baseUrl}/api/admin/shift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'active',
          moderatorAlias: 'Stage2TestMod',
          slaTargetMinutes: 15,
          note: 'Mở lại ca trực',
        }),
      });
    }
  });

  it('enforces Section 4.4 spiritual guardrails: host rules, price caps, 24h/ex-loop pause, and birthDate erasure on complete', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'SpiritualHostUser' }),
    });
    const { token, user } = await sessRes.json();
    createdUserIds.push(user.id);

    // 1) Missing hostRulesAccepted fails with 400
    const noRulesRes = await fetch(`${baseUrl}/api/spiritual/chairs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Ghế không chấp nhận quy tắc',
        specialty: 'tarot',
        seatPrice: 50000,
        viewerTicketPrice: 10000,
        maxSeats: 4,
        hostRulesAccepted: false,
      }),
    });
    assert.equal(noRulesRes.status, 400);

    // 2) Seat price above cap (300,000đ) fails with 400
    const overCapRes = await fetch(`${baseUrl}/api/spiritual/chairs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Ghế vượt trần phí',
        specialty: 'tuvi',
        seatPrice: 500000,
        viewerTicketPrice: 10000,
        maxSeats: 4,
        hostRulesAccepted: true,
      }),
    });
    assert.equal(overCapRes.status, 400);

    // 3) Create valid Tarot chair & TuVi chair
    const tarotChairRes = await fetch(`${baseUrl}/api/spiritual/chairs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Phòng Tarot Soi Chiếu',
        specialty: 'tarot',
        seatPrice: 100000,
        viewerTicketPrice: 20000,
        maxSeats: 5,
        hostRulesAccepted: true,
      }),
    });
    assert.equal(tarotChairRes.status, 201);
    const tarotChair = (await tarotChairRes.json()).chair;
    createdChairIds.push(tarotChair.id);

    const tuviChairRes = await fetch(`${baseUrl}/api/spiritual/chairs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Phòng Tử Vi Tham Khảo',
        specialty: 'tuvi',
        seatPrice: 150000,
        viewerTicketPrice: 20000,
        maxSeats: 5,
        hostRulesAccepted: true,
      }),
    });
    assert.equal(tuviChairRes.status, 201);
    const tuviChair = (await tuviChairRes.json()).chair;
    createdChairIds.push(tuviChair.id);

    // Guest books seats
    const guestRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'SpiritualGuest' }),
    });
    const guest = await guestRes.json();
    createdUserIds.push(guest.user.id);

    // 4) Ex-relationship loop triggers 409 REFLECTION_PAUSE_RECOMMENDED
    const exPauseRes = await fetch(`${baseUrl}/api/spiritual/chairs/${tuviChair.id}/book-seat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guest.token}` },
      body: JSON.stringify({
        birthDate: '1999-05-12',
        questionTopic: 'Người yêu cũ có quay lại với mình không?',
        note: 'Mình sắp nhắn tin cho người cũ.',
      }),
    });
    assert.equal(exPauseRes.status, 409);
    const exPauseJson = await exPauseRes.json();
    assert.equal(exPauseJson.code, 'REFLECTION_PAUSE_RECOMMENDED');
    assert.equal(exPauseJson.suggestExUrgeFlow, true);

    // 5) Confirming after reflection succeeds & stores birthDate temporarily for TuVi
    const confirmTuviRes = await fetch(`${baseUrl}/api/spiritual/chairs/${tuviChair.id}/book-seat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guest.token}` },
      body: JSON.stringify({
        birthDate: '1999-05-12',
        questionTopic: 'Soi chiếu cảm xúc hậu chia tay',
        note: 'Mình đã tự vấn xong.',
        confirmAfterReflection: true,
      }),
    });
    assert.equal(confirmTuviRes.status, 201);
    const tuviBooking = (await confirmTuviRes.json()).booking;
    createdBookingIds.push(tuviBooking.id);
    assert.equal(tuviBooking.birthDate, '1999-05-12');

    // 6) Completing booking erases birthDate permanently
    const completeRes = await fetch(`${baseUrl}/api/spiritual/bookings/${tuviBooking.id}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${guest.token}` },
    });
    assert.equal(completeRes.status, 200);
    const completeJson = await completeRes.json();
    assert.equal(completeJson.birthDateErased, true);
    assert.equal(completeJson.booking.birthDate, '');

    const dbBirth = sqliteDb
      .prepare('SELECT birth_date, status FROM spiritual_bookings WHERE id = ?')
      .get(tuviBooking.id) as { birth_date: string; status: string };
    assert.equal(dbBirth.status, 'completed');
    assert.equal(dbBirth.birth_date, '');

    // 7) 24h repeat booking on Tarot chair triggers 409; once confirmed, birthDate is NEVER stored on pure Tarot
    const repeatRes = await fetch(`${baseUrl}/api/spiritual/chairs/${tarotChair.id}/book-seat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guest.token}` },
      body: JSON.stringify({
        birthDate: '1999-05-12',
        questionTopic: 'Soi chiếu hướng đi công việc',
      }),
    });
    assert.equal(repeatRes.status, 409);

    const confirmTarotRes = await fetch(`${baseUrl}/api/spiritual/chairs/${tarotChair.id}/book-seat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guest.token}` },
      body: JSON.stringify({
        birthDate: '1999-05-12',
        questionTopic: 'Soi chiếu hướng đi công việc',
        confirmAfterReflection: true,
      }),
    });
    assert.equal(confirmTarotRes.status, 201);
    const tarotBooking = (await confirmTarotRes.json()).booking;
    createdBookingIds.push(tarotBooking.id);
    assert.equal(tarotBooking.birthDate, '');
  });
});
