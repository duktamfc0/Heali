import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { sqliteDb } from '../db/database.js';
import { createRateLimiter, extractBearerToken } from '../middleware/auth.js';
import { generateSecureToken, hashPin, hashToken, verifyPin } from '../utils/crypto.js';
import { getCommunityGateStatus } from '../utils/communityGate.js';

export const moderationRouter = Router();

interface AdminConfigRow {
  id: string;
  passcode_hash: string;
  updated_at: string;
}

interface AdminSessionRow {
  token_hash: string;
  moderator_alias: string;
  expires_at: string;
  created_at: string;
}

interface ModerationQueueRow {
  id: string;
  source_type: string;
  source_id: string;
  reporter_user_id: string | null;
  reason: string;
  risk_level: number;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_note: string | null;
}

interface ConfessionDetailRow {
  id: string;
  author_id: string;
  author_nickname: string;
  category: string;
  title: string;
  content: string;
  mood_tag: string;
  is_trigger_warning: number;
  is_moderated: number;
  moderation_status: string;
  report_count: number;
}

interface LoungeDetailRow {
  id: string;
  sender_id: string;
  sender_alias: string;
  topic_tag: string;
  text: string;
}

interface AuditLogRow {
  id: string;
  queue_item_id: string;
  source_type: string;
  source_id: string;
  action: string;
  moderator_alias: string;
  note: string;
  created_at: string;
}

const adminLoginLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 8,
  keyPrefix: 'admin_login',
});

const loginSchema = z.object({
  passcode: z.string().min(4, 'Vui lòng nhập mã truy cập điều phối viên').max(128),
  moderatorAlias: z.string().trim().min(2).max(40).optional().default('Điều phối viên trực'),
});

const bootstrapSchema = z.object({
  passcode: z.string().min(8, 'Mã khóa lần đầu cần tối thiểu 8 ký tự để bảo mật').max(128),
  moderatorAlias: z.string().trim().min(2).max(40).optional().default('Điều phối viên chính'),
});

const resolveSchema = z.object({
  action: z.enum([
    'approve_public',
    'approve_with_tw',
    'hide_post',
    'mark_safety_outreach',
    'ban_author',
    'dismiss_report',
  ]),
  note: z.string().max(400).optional().default(''),
});

const shiftToggleSchema = z.object({
  status: z.enum(['active', 'paused']),
  moderatorAlias: z.string().trim().min(2).max(40).optional(),
  slaTargetMinutes: z.number().int().min(5).max(120).optional().default(15),
  note: z.string().max(240).optional().default(''),
});

function timingSafeMatchPasscode(input: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(input, 'utf8').digest();
  const b = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

function getClaimedConfig(): AdminConfigRow | undefined {
  return sqliteDb.prepare(`SELECT * FROM admin_config WHERE id = 'primary'`).get() as AdminConfigRow | undefined;
}

function issueAdminSession(moderatorAlias: string): { token: string; expiresAt: string } {
  const token = generateSecureToken('hl_adm');
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + config.adminSessionTtlMs).toISOString();
  sqliteDb
    .prepare(`INSERT INTO admin_sessions (token_hash, moderator_alias, expires_at, created_at) VALUES (?, ?, ?, ?)`)
    .run(hashToken(token), moderatorAlias, expiresAt, nowIso);
  return { token, expiresAt };
}

function requireAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const rawToken = extractBearerToken(req);
  if (!rawToken || rawToken.length < 16) {
    res.status(401).json({ error: 'Yêu cầu đăng nhập cổng điều phối viên nội bộ.' });
    return;
  }

  const row = sqliteDb
    .prepare(`SELECT * FROM admin_sessions WHERE token_hash = ?`)
    .get(hashToken(rawToken)) as AdminSessionRow | undefined;

  if (!row) {
    res.status(401).json({ error: 'Phiên điều phối viên không hợp lệ hoặc đã đăng xuất.' });
    return;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    sqliteDb.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`).run(row.token_hash);
    res.status(401).json({ error: 'Phiên trực đã hết hạn. Vui lòng đăng nhập lại.' });
    return;
  }

  (req as Request & { adminModeratorAlias?: string; adminTokenHash?: string }).adminModeratorAlias = row.moderator_alias;
  (req as Request & { adminModeratorAlias?: string; adminTokenHash?: string }).adminTokenHash = row.token_hash;
  next();
}

function enrichQueueItem(row: ModerationQueueRow) {
  let targetTitle = '';
  let targetExcerpt = '';
  let targetCategory = '';
  let targetAuthorId = '';
  let targetAuthorAlias = '';
  let targetStatus = '';

  if (row.source_type === 'confession' || row.source_type === 'confession_report') {
    const conf = sqliteDb
      .prepare(`SELECT id, author_id, author_nickname, category, title, content, mood_tag, is_trigger_warning, is_moderated, moderation_status, report_count FROM confessions WHERE id = ?`)
      .get(row.source_id) as ConfessionDetailRow | undefined;

    if (conf) {
      targetTitle = conf.title || '(Không tiêu đề)';
      targetExcerpt = conf.content;
      targetCategory = conf.category;
      targetAuthorId = conf.author_id;
      targetAuthorAlias = conf.author_nickname;
      targetStatus = conf.moderation_status;
    }
  } else if (row.source_type === 'lounge_message') {
    const msg = sqliteDb
      .prepare(`SELECT id, sender_id, sender_alias, topic_tag, text FROM lounge_messages WHERE id = ?`)
      .get(row.source_id) as LoungeDetailRow | undefined;
    if (msg) {
      targetTitle = `Tin nhắn Phòng trà (${msg.topic_tag})`;
      targetExcerpt = msg.text;
      targetAuthorId = msg.sender_id;
      targetAuthorAlias = msg.sender_alias;
    }
  } else if (row.source_type === 'stranger_chat') {
    const parts = row.source_id.split(':');
    targetTitle = `Báo cáo phòng chat 1:1 (${parts[0] || row.source_id})`;
    targetAuthorId = parts[1] || '';
    targetExcerpt = 'Nội dung 1:1 không được lưu lịch sử trên máy chủ để đảm bảo riêng tư. Vui lòng xử lý theo mô tả báo cáo.';
  } else {
    targetTitle = `Tín hiệu an toàn (${row.source_type})`;
    targetAuthorId = row.source_id;
    targetExcerpt = 'Nội dung chưa phát tán công khai, đã tự động giữ lại và hiển thị thẻ hỗ trợ cho tác giả.';
  }

  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    reporterUserId: row.reporter_user_id,
    reason: row.reason,
    riskLevel: row.risk_level,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewerNote: row.reviewer_note,
    targetTitle,
    targetExcerpt,
    targetCategory,
    targetAuthorId,
    targetAuthorAlias,
    targetStatus,
  };
}

// 1. Check whether env passcode is set or first-run claim is available (never exposes passcode or hash)
moderationRouter.get('/status', (_req, res) => {
  const claimed = getClaimedConfig();
  res.json({
    envConfigured: Boolean(config.adminPasscode),
    needsBootstrap: !config.adminPasscode && !claimed,
  });
});

// 2. One-time first-run claim when HEALI_ADMIN_PASSCODE env var is unset
moderationRouter.post('/bootstrap', adminLoginLimiter, (req, res) => {
  if (config.adminPasscode) {
    res.status(403).json({ error: 'Máy chủ đã cấu hình HEALI_ADMIN_PASSCODE từ biến môi trường.' });
    return;
  }
  const existing = getClaimedConfig();
  if (existing) {
    res.status(409).json({ error: 'Mã khóa điều phối đã được thiết lập trước đó. Vui lòng đăng nhập.' });
    return;
  }

  const parsed = bootstrapSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Mã khóa không hợp lệ.' });
    return;
  }

  const hashed = hashPin(parsed.data.passcode.trim());
  const nowIso = new Date().toISOString();

  sqliteDb
    .prepare(`INSERT INTO admin_config (id, passcode_hash, updated_at) VALUES ('primary', ?, ?)`)
    .run(hashed, nowIso);

  const session = issueAdminSession(parsed.data.moderatorAlias);
  res.status(201).json({
    token: session.token,
    expiresAt: session.expiresAt,
    moderatorAlias: parsed.data.moderatorAlias,
  });
});

// 3. Moderator Login
moderationRouter.post('/login', adminLoginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Thông tin đăng nhập không hợp lệ.' });
    return;
  }

  const { passcode, moderatorAlias } = parsed.data;

  // Configured env passcode always takes precedence over any claimed fallback hash
  if (config.adminPasscode) {
    if (!timingSafeMatchPasscode(passcode.trim(), config.adminPasscode)) {
      res.status(401).json({ error: 'Mã truy cập điều phối viên không chính xác.' });
      return;
    }
  } else {
    const claimed = getClaimedConfig();
    if (!claimed) {
      res.status(428).json({ error: 'Chưa thiết lập mã truy cập điều phối viên lần đầu.' });
      return;
    }
    if (!verifyPin(passcode.trim(), claimed.passcode_hash)) {
      res.status(401).json({ error: 'Mã truy cập điều phối viên không chính xác.' });
      return;
    }
  }

  const session = issueAdminSession(moderatorAlias);
  res.json({
    token: session.token,
    expiresAt: session.expiresAt,
    moderatorAlias,
  });
});

// 4. Moderator Logout
moderationRouter.post('/logout', requireAdminMiddleware, (req, res) => {
  const tokenHash = (req as Request & { adminTokenHash?: string }).adminTokenHash;
  if (tokenHash) {
    sqliteDb.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`).run(tokenHash);
  }
  res.json({ success: true });
});

// 5. Overview Dashboard Stats & Active Shift
moderationRouter.get('/overview', requireAdminMiddleware, (req, res) => {
  const moderatorAlias = (req as Request & { adminModeratorAlias?: string }).adminModeratorAlias || 'Điều phối viên';
  const pendingRows = sqliteDb
    .prepare(`SELECT risk_level, source_type FROM moderation_queue WHERE status = 'pending'`)
    .all() as Array<{ risk_level: number; source_type: string }>;

  let level3Pending = 0;
  let level2Pending = 0;
  let reportsPending = 0;
  for (const r of pendingRows) {
    if (r.risk_level >= 3) level3Pending += 1;
    else if (r.risk_level === 2) level2Pending += 1;
    else reportsPending += 1;
  }

  const todayPrefix = new Date().toISOString().slice(0, 10);
  const resolvedTodayCount = (
    sqliteDb
      .prepare(`SELECT COUNT(*) as cnt FROM moderation_audit_logs WHERE created_at LIKE ?`)
      .get(`${todayPrefix}%`) as { cnt: number }
  ).cnt;

  const bannedUsersCount = (
    sqliteDb.prepare(`SELECT COUNT(*) as cnt FROM users WHERE is_banned = 1`).get() as { cnt: number }
  ).cnt;

  res.json({
    moderatorAlias,
    gate: getCommunityGateStatus(),
    counts: {
      level3Pending,
      level2Pending,
      reportsPending,
      totalPending: pendingRows.length,
      resolvedTodayCount,
      bannedUsersCount,
    },
  });
});

// 6. Priority-sorted Moderation Queue (Level 3 -> Level 2 -> Reports)
moderationRouter.get('/queue', requireAdminMiddleware, (req, res) => {
  const statusFilter = req.query.status === 'resolved' ? 'resolved' : 'pending';
  const rows = sqliteDb
    .prepare(
      `
      SELECT * FROM moderation_queue
      WHERE status = ?
      ORDER BY
        CASE
          WHEN risk_level >= 3 THEN 0
          WHEN risk_level = 2 THEN 1
          ELSE 2
        END ASC,
        risk_level DESC,
        created_at ASC
      LIMIT 120
    `
    )
    .all(statusFilter) as unknown as ModerationQueueRow[];

  res.json({
    items: rows.map(enrichQueueItem),
  });
});

// 7. Resolve a moderation queue item with atomic state updates & audit logging
moderationRouter.post('/queue/:id/resolve', requireAdminMiddleware, (req, res) => {
  const parsed = resolveSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Hành động xử lý không hợp lệ.' });
    return;
  }

  const { id } = req.params;
  const { action, note } = parsed.data;
  const moderatorAlias = (req as Request & { adminModeratorAlias?: string }).adminModeratorAlias || 'Điều phối viên';

  const queueRow = sqliteDb
    .prepare(`SELECT * FROM moderation_queue WHERE id = ?`)
    .get(id) as unknown as ModerationQueueRow | undefined;

  if (!queueRow) {
    res.status(404).json({ error: 'Không tìm thấy mục cần xử lý.' });
    return;
  }

  const nowIso = new Date().toISOString();

  sqliteDb.exec('BEGIN');
  try {
    // 1) Resolve queue item
    sqliteDb
      .prepare(`UPDATE moderation_queue SET status = 'resolved', reviewed_at = ?, reviewer_note = ? WHERE id = ?`)
      .run(nowIso, `${action}${note ? ` — ${note}` : ''}`, id);

    // 2) Apply target side effects
    let targetUserIdToBan = '';

    if (queueRow.source_type === 'confession' || queueRow.source_type === 'confession_report') {
      const conf = sqliteDb
        .prepare(`SELECT id, author_id FROM confessions WHERE id = ?`)
        .get(queueRow.source_id) as { id: string; author_id: string } | undefined;

      if (conf) {
        targetUserIdToBan = conf.author_id;
        if (action === 'approve_public') {
          sqliteDb
            .prepare(`UPDATE confessions SET is_moderated = 0, moderation_status = 'approved' WHERE id = ?`)
            .run(conf.id);
        } else if (action === 'approve_with_tw') {
          sqliteDb
            .prepare(`UPDATE confessions SET is_moderated = 0, moderation_status = 'approved', is_trigger_warning = 1 WHERE id = ?`)
            .run(conf.id);
        } else if (action === 'hide_post' || action === 'mark_safety_outreach' || action === 'ban_author') {
          sqliteDb
            .prepare(`UPDATE confessions SET is_moderated = 1, moderation_status = 'rejected' WHERE id = ?`)
            .run(conf.id);
        } else if (action === 'dismiss_report' && queueRow.source_type === 'confession_report') {
          sqliteDb
            .prepare(`UPDATE confessions SET is_moderated = 0, moderation_status = 'approved' WHERE id = ?`)
            .run(conf.id);
        }
      }
    } else if (queueRow.source_type === 'lounge_message') {
      const msg = sqliteDb
        .prepare(`SELECT id, sender_id FROM lounge_messages WHERE id = ?`)
        .get(queueRow.source_id) as { id: string; sender_id: string } | undefined;
      if (msg) {
        targetUserIdToBan = msg.sender_id;
        if (action === 'hide_post' || action === 'ban_author') {
          sqliteDb.prepare(`DELETE FROM lounge_messages WHERE id = ?`).run(msg.id);
        }
      }
    } else if (queueRow.source_type === 'stranger_chat') {
      const parts = queueRow.source_id.split(':');
      if (parts[1] && parts[1] !== 'unknown') {
        targetUserIdToBan = parts[1];
      }
    } else if (queueRow.source_type === 'lantern' || queueRow.source_type === 'wish') {
      targetUserIdToBan = queueRow.source_id;
    }

    if (action === 'ban_author' && targetUserIdToBan && !targetUserIdToBan.startsWith('system')) {
      sqliteDb.prepare(`UPDATE users SET is_banned = 1 WHERE id = ?`).run(targetUserIdToBan);
    }

    // 3) Append immutable audit log
    sqliteDb
      .prepare(`
        INSERT INTO moderation_audit_logs (id, queue_item_id, source_type, source_id, action, moderator_alias, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(`audit-${crypto.randomUUID()}`, id, queueRow.source_type, queueRow.source_id, action, moderatorAlias, note, nowIso);

    sqliteDb.exec('COMMIT');
  } catch (err) {
    sqliteDb.exec('ROLLBACK');
    console.error('[Heali Moderation] Resolve failed:', err);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái xử lý.' });
    return;
  }

  const updated = sqliteDb.prepare(`SELECT * FROM moderation_queue WHERE id = ?`).get(id) as unknown as ModerationQueueRow;
  res.json({
    item: enrichQueueItem(updated),
  });
});

// 8. Toggle on-duty moderator shift (controls real /api/community/status gate)
moderationRouter.get('/shift', requireAdminMiddleware, (_req, res) => {
  res.json({ gate: getCommunityGateStatus() });
});

moderationRouter.post('/shift', requireAdminMiddleware, (req, res) => {
  const parsed = shiftToggleSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Thông tin ca trực không hợp lệ.' });
    return;
  }

  const moderatorAlias =
    parsed.data.moderatorAlias ||
    (req as Request & { adminModeratorAlias?: string }).adminModeratorAlias ||
    'Điều phối viên Heali';
  const nowIso = new Date().toISOString();

  sqliteDb.exec('BEGIN');
  try {
    // Close any currently open shifts first
    sqliteDb
      .prepare(`UPDATE moderator_shifts SET status = 'ended', ended_at = ? WHERE status = 'active' AND ended_at IS NULL`)
      .run(nowIso);

    if (parsed.data.status === 'active') {
      sqliteDb
        .prepare(`
          INSERT INTO moderator_shifts (id, moderator_alias, status, sla_target_minutes, note, started_at, ended_at)
          VALUES (?, ?, 'active', ?, ?, ?, NULL)
        `)
        .run(
          `shift-${crypto.randomUUID()}`,
          moderatorAlias,
          parsed.data.slaTargetMinutes,
          parsed.data.note.trim() || 'Ca trực kiểm duyệt đang hoạt động.',
          nowIso
        );
    } else {
      sqliteDb
        .prepare(`
          INSERT INTO moderator_shifts (id, moderator_alias, status, sla_target_minutes, note, started_at, ended_at)
          VALUES (?, ?, 'paused', ?, ?, ?, ?)
        `)
        .run(
          `shift-${crypto.randomUUID()}`,
          moderatorAlias,
          parsed.data.slaTargetMinutes,
          parsed.data.note.trim() || 'Cộng đồng tạm đóng ngoài ca trực kiểm duyệt.',
          nowIso,
          nowIso
        );
    }
    sqliteDb.exec('COMMIT');
  } catch (err) {
    sqliteDb.exec('ROLLBACK');
    console.error('[Heali Moderation] Shift toggle failed:', err);
    res.status(500).json({ error: 'Không thể cập nhật ca trực lúc này.' });
    return;
  }

  res.json({ gate: getCommunityGateStatus() });
});

// 9. Audit Log History
moderationRouter.get('/audit-logs', requireAdminMiddleware, (_req, res) => {
  const rows = sqliteDb
    .prepare(`SELECT * FROM moderation_audit_logs ORDER BY created_at DESC LIMIT 60`)
    .all() as unknown as AuditLogRow[];

  res.json({
    logs: rows.map((r) => ({
      id: r.id,
      queueItemId: r.queue_item_id,
      sourceType: r.source_type,
      sourceId: r.source_id,
      action: r.action,
      moderatorAlias: r.moderator_alias,
      note: r.note,
      createdAt: r.created_at,
    })),
  });
});

// 10. Section 8.4 Healthy Aggregate Metrics (zero PII, no time-on-app or streak optimization)
moderationRouter.get('/metrics', requireAdminMiddleware, (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rows = sqliteDb
    .prepare(`SELECT event_type, value_ms FROM healthy_metric_events WHERE day_bucket >= ?`)
    .all(thirtyDaysAgo) as Array<{ event_type: string; value_ms: number | null }>;

  const counts: Record<string, number> = {
    calm_tool_completed: 0,
    support_card_shown: 0,
    support_card_opened: 0,
    support_helpful_yes: 0,
    first_useful_action: 0,
    lantern_gift_created: 0,
    lantern_gift_opened: 0,
    challenge_step_done: 0,
    feeling_lighter_yes: 0,
    feeling_lighter_no: 0,
  };
  const usefulDurations: number[] = [];

  for (const r of rows) {
    counts[r.event_type] = (counts[r.event_type] || 0) + 1;
    if (r.event_type === 'first_useful_action' && typeof r.value_ms === 'number') {
      usefulDurations.push(r.value_ms);
    }
  }

  usefulDurations.sort((a, b) => a - b);
  const medianFirstUsefulMs =
    usefulDurations.length > 0 ? usefulDurations[Math.floor(usefulDurations.length / 2)] : null;

  // Compute moderation SLA compliance from resolved items
  const resolvedRows = sqliteDb
    .prepare(`SELECT created_at, reviewed_at FROM moderation_queue WHERE status = 'resolved' AND reviewed_at IS NOT NULL ORDER BY reviewed_at DESC LIMIT 200`)
    .all() as Array<{ created_at: string; reviewed_at: string }>;

  const gate = getCommunityGateStatus();
  const slaMs = (gate.slaTargetMinutes || 15) * 60 * 1000;
  let withinSlaCount = 0;
  for (const item of resolvedRows) {
    const diff = new Date(item.reviewed_at).getTime() - new Date(item.created_at).getTime();
    if (diff >= 0 && diff <= slaMs) {
      withinSlaCount += 1;
    }
  }

  const slaCompliancePct =
    resolvedRows.length > 0 ? Math.round((withinSlaCount / resolvedRows.length) * 100) : null;

  const shownCount = counts.support_card_shown || 0;
  const openedCount = counts.support_card_opened || 0;
  const helpfulCount = counts.support_helpful_yes || 0;
  const lighterYes = counts.feeling_lighter_yes || 0;
  const lighterNo = counts.feeling_lighter_no || 0;

  const supportOpenRatePct = shownCount > 0 ? Math.round((openedCount / shownCount) * 100) : null;
  const supportHelpfulRatePct = openedCount > 0 ? Math.round((helpfulCount / openedCount) * 100) : null;
  const feelingLighterRatePct =
    lighterYes + lighterNo > 0 ? Math.round((lighterYes / (lighterYes + lighterNo)) * 100) : null;

  const feedbackNotes = sqliteDb
    .prepare(`SELECT id, note, category, created_at as createdAt FROM beta_feedback ORDER BY created_at DESC LIMIT 15`)
    .all() as Array<{ id: string; note: string; category: string; createdAt: string }>;

  res.json({
    windowDays: 30,
    aggregates: counts,
    medianFirstUsefulMs,
    supportOpenRatePct,
    supportHelpfulRatePct,
    feelingLighterRatePct,
    resolvedWithin30d: resolvedRows.length,
    slaCompliancePct,
    gate,
    feedbackNotes,
  });
});

