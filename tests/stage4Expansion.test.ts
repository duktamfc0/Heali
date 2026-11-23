import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { sqliteDb } from '../server/db/database.js';
import { authRouter } from '../server/routes/auth.js';
import { companionRouter, AI_COMPANION_DAILY_LIMIT } from '../server/routes/companion.js';
import { musicRouter } from '../server/routes/music.js';
import { growthRouter } from '../server/routes/growth.js';

describe('Stage 4 Expansion: Guardrailed AI Companion, Open-License Music, Quarterly k-Anonymity Report & Partner Inquiry', () => {
  let server: http.Server;
  let baseUrl = '';
  const createdUserIds: string[] = [];
  const createdLanternIds: string[] = [];
  const createdInquiryIds: string[] = [];
  let originalGeminiKey: string | undefined;

  before(async () => {
    originalGeminiKey = process.env.GEMINI_API_KEY;
    const app = express();
    app.use(express.json({ limit: '512kb' }));
    app.use('/api/auth', authRouter);
    app.use('/api/companion', companionRouter);
    app.use('/api/music', musicRouter);
    app.use('/api', growthRouter);

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
    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }

    for (const lid of createdLanternIds) {
      sqliteDb.prepare(`DELETE FROM lanterns WHERE id = ?`).run(lid);
    }
    for (const iid of createdInquiryIds) {
      sqliteDb.prepare(`DELETE FROM organization_inquiries WHERE id = ?`).run(iid);
    }
    for (const uid of createdUserIds) {
      sqliteDb.prepare(`DELETE FROM ai_companion_usage WHERE user_id = ?`).run(uid);
      sqliteDb.prepare(`DELETE FROM pin_unlock_sessions WHERE user_id = ?`).run(uid);
      sqliteDb.prepare(`DELETE FROM users WHERE id = ?`).run(uid);
    }

    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('enforces explicit opt-in consent, pre-LLM risk detection, daily 8-turn cap, and honest missing-key error on AI companion', async () => {
    const sessRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'Stage4Tester' }),
    });
    assert.equal(sessRes.status, 200);
    const { token, user } = await sessRes.json();
    createdUserIds.push(user.id);

    // 1. Unauthenticated request blocked
    const unauthStatus = await fetch(`${baseUrl}/api/companion/status`);
    assert.equal(unauthStatus.status, 401);

    // 2. Authenticated status returns daily limit = 8
    const statusRes = await fetch(`${baseUrl}/api/companion/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.dailyLimit, AI_COMPANION_DAILY_LIMIT);
    assert.equal(statusData.turnsUsedToday, 0);

    // 3. Rejects request without explicit consentAccepted: true
    const noConsentRes = await fetch(`${baseUrl}/api/companion/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: 'Hôm nay mình thấy hơi mệt sau giờ làm.',
        consentAccepted: false,
      }),
    });
    assert.equal(noConsentRes.status, 400);

    // 4. Pre-LLM detectRisk blocks Level >= 2 crisis text BEFORE calling Gemini & without incrementing usage or storing prompt
    const crisisText = 'mình muốn tự tử cho xong mọi chuyện';
    const crisisRes = await fetch(`${baseUrl}/api/companion/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: crisisText,
        consentAccepted: true,
        language: 'vi',
      }),
    });
    assert.equal(crisisRes.status, 200);
    const crisisJson = await crisisRes.json();
    assert.equal(crisisJson.blockedBySafety, true);
    assert.equal(crisisJson.supportCardRequired, true);
    assert.ok(crisisJson.riskLevel >= 2);
    assert.equal(crisisJson.turnsUsedToday, 0);

    // Ensure no user text is persisted in ai_companion_usage table schema
    const usageCols = sqliteDb.prepare(`PRAGMA table_info(ai_companion_usage)`).all() as Array<{ name: string }>;
    const colNames = usageCols.map((c) => c.name);
    assert.deepEqual(colNames.includes('prompt'), false);
    assert.deepEqual(colNames.includes('message'), false);
    assert.deepEqual(colNames.includes('reply'), false);

    // 5. Missing GEMINI_API_KEY returns honest 503 AI_NOT_CONFIGURED (never fake/mock AI reply)
    delete process.env.GEMINI_API_KEY;
    const missingKeyRes = await fetch(`${baseUrl}/api/companion/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: 'Hôm nay trời mưa làm mình hơi chùng xuống một chút.',
        consentAccepted: true,
      }),
    });
    assert.equal(missingKeyRes.status, 503);
    const missingKeyJson = await missingKeyRes.json();
    assert.equal(missingKeyJson.code, 'AI_NOT_CONFIGURED');
    assert.equal('reply' in missingKeyJson, false);

    // 6. Enforce daily 8-turn cap with 429 DAILY_LIMIT_REACHED
    const today = new Date().toISOString().slice(0, 10);
    sqliteDb
      .prepare(`
        INSERT INTO ai_companion_usage (user_id, day_bucket, turns_count, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, day_bucket) DO UPDATE SET turns_count = excluded.turns_count
      `)
      .run(user.id, today, AI_COMPANION_DAILY_LIMIT, new Date().toISOString());

    const capRes = await fetch(`${baseUrl}/api/companion/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: 'Mình muốn viết thêm một lượt nữa.',
        consentAccepted: true,
      }),
    });
    assert.equal(capRes.status, 429);
    const capJson = await capRes.json();
    assert.equal(capJson.code, 'DAILY_LIMIT_REACHED');
    assert.equal(capJson.turnsUsedToday, AI_COMPANION_DAILY_LIMIT);
  });

  it('serves open-license music catalog with explicit CC0 / CC BY attribution and offline metadata', async () => {
    const res = await fetch(`${baseUrl}/api/music/catalog`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.tracks));
    assert.ok(data.tracks.length >= 6);
    assert.ok(typeof data.openLicenseNotice === 'string' && data.openLicenseNotice.length > 10);

    for (const track of data.tracks) {
      assert.ok(track.licenseType === 'cc0' || track.licenseType === 'cc_by');
      assert.ok(typeof track.licenseUrl === 'string' && track.licenseUrl.startsWith('https://creativecommons.org/'));
      assert.ok(typeof track.attribution === 'string' && track.attribution.length > 5);
      assert.equal(track.isOfflineCurated, true);
    }
  });

  it('returns quarterly community report enforcing k-anonymity threshold >= 5 for small counts 1..4', async () => {
    const nowIso = new Date().toISOString();
    const currentLanternCount = (
      sqliteDb
        .prepare(`SELECT COUNT(*) as cnt FROM lanterns WHERE created_at >= ?`)
        .get(new Date(Date.UTC(new Date().getUTCFullYear(), Math.floor(new Date().getUTCMonth() / 3) * 3, 1)).toISOString()) as {
        cnt: number;
      }
    ).cnt;

    if (currentLanternCount === 0) {
      const lid = `l-stage4-test-${Date.now()}`;
      createdLanternIds.push(lid);
      sqliteDb
        .prepare(`
          INSERT INTO lanterns (id, author_id, author_nickname, message, color, x, y, ripples, created_at)
          VALUES (?, 'stage4-test', 'Stage4', 'Test lantern for k-anonymity check', 'gold', 50, 50, 1, ?)
        `)
        .run(lid, nowIso);
    }

    const res = await fetch(`${baseUrl}/api/community/quarterly-report`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.match(data.quarter, /^\d{4}-Q[1-4]$/);
    assert.equal(data.anonymityThreshold, 5);
    assert.ok(typeof data.privacyGuarantee === 'string');

    const metricKeys = [
      'calmToolsCompleted',
      'lanternsFloated',
      'sharedGiftsCreated',
      'approvedConfessions',
      'wishesHung',
    ] as const;

    for (const key of metricKeys) {
      const m = data.metrics[key];
      assert.ok(m && typeof m.display === 'string');
      if (m.maskedBelowThreshold) {
        assert.equal(m.value, null);
        assert.equal(m.display, '< 5');
      } else {
        assert.ok(m.value === 0 || (typeof m.value === 'number' && m.value >= 5));
      }
    }

    // If we specifically had 1..4 lanterns in this test DB, confirm it masked strictly as < 5
    const afterCount = (
      sqliteDb
        .prepare(`SELECT COUNT(*) as cnt FROM lanterns WHERE created_at >= ?`)
        .get(new Date(Date.UTC(new Date().getUTCFullYear(), Math.floor(new Date().getUTCMonth() / 3) * 3, 1)).toISOString()) as {
        cnt: number;
      }
    ).cnt;
    if (afterCount >= 1 && afterCount < 5) {
      assert.equal(data.metrics.lanternsFloated.value, null);
      assert.equal(data.metrics.lanternsFloated.display, '< 5');
      assert.equal(data.metrics.lanternsFloated.maskedBelowThreshold, true);
    }
  });

  it('validates and records organizational partnership inquiries with zero user data exposure', async () => {
    const invalidRes = await fetch(`${baseUrl}/api/partners/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName: 'A',
        orgType: 'university',
        contactEmail: 'not-an-email',
        note: 'ngắn',
      }),
    });
    assert.equal(invalidRes.status, 400);

    const validRes = await fetch(`${baseUrl}/api/partners/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName: 'CLB Tham Vấn Sinh Viên Demo',
        orgType: 'university',
        contactEmail: 'clb.demo@university.edu.vn',
        contactPerson: 'Minh Anh',
        note: 'Chúng tôi muốn tài trợ 100 suất không gian tĩnh cho sinh viên mùa thi, không nhận dữ liệu cá nhân.',
      }),
    });
    assert.equal(validRes.status, 201);
    const validJson = await validRes.json();
    assert.equal(validJson.submitted, true);
    assert.ok(typeof validJson.id === 'string' && validJson.id.startsWith('org-'));
    createdInquiryIds.push(validJson.id);
    assert.ok(String(validJson.privacyGuarantee).includes('không có quyền xem'));

    const stored = sqliteDb
      .prepare(`SELECT org_name, org_type, contact_email FROM organization_inquiries WHERE id = ?`)
      .get(validJson.id) as { org_name: string; org_type: string; contact_email: string } | undefined;
    assert.equal(stored?.org_name, 'CLB Tham Vấn Sinh Viên Demo');
    assert.equal(stored?.org_type, 'university');
    assert.equal(stored?.contact_email, 'clb.demo@university.edu.vn');
  });
});
