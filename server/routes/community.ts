import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { sqliteDb } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { detectRisk } from '../../shared/riskDetector.js';
import { getCommunityGateStatus, sanitizePublicAlias } from '../utils/communityGate.js';

export function createCommunityRouter(getActiveWsCount: () => number) {
  const router = Router();

  const lanternSchema = z.object({
    message: z.string().trim().min(1, 'Lời nguyện cầu không được để trống').max(300),
    color: z.enum(['pink', 'gold', 'lavender', 'moon']).default('gold'),
  });

  const wishSchema = z.object({
    wishText: z.string().trim().min(1, 'Ước nguyện không được để trống').max(280),
    actionCommitment: z.string().max(280).optional(),
    tag: z.enum(['healing', 'self_love', 'letting_go', 'inner_peace', 'future']).default('healing'),
  });

  const blockSchema = z.object({
    targetUserId: z.string().min(1).max(80),
  });

  // Real community gate status based on active moderation shifts (Section 6.5 & 9)
  router.get('/community/status', (_req, res) => {
    res.json(getCommunityGateStatus());
  });

  // Honest real community stats (Section 3 #2, Section 7.2)
  router.get('/community/stats', (_req, res) => {
    const lanternsCount = (
      sqliteDb.prepare('SELECT COUNT(*) as cnt FROM lanterns').get() as { cnt: number }
    ).cnt;
    const wishesCount = (
      sqliteDb.prepare('SELECT COUNT(*) as cnt FROM wishes').get() as { cnt: number }
    ).cnt;
    const confessionsRows = sqliteDb
      .prepare(`SELECT reactions_json FROM confessions WHERE is_moderated = 0 AND moderation_status = 'approved'`)
      .all() as Array<{ reactions_json: string }>;

    let reactionsTotal = 0;
    for (const r of confessionsRows) {
      try {
        const obj = JSON.parse(r.reactions_json || '{}') as Record<string, number>;
        reactionsTotal +=
          (obj.hug || 0) +
          (obj.listen || 0) +
          (obj.not_alone || 0) +
          (obj.peace || 0) +
          (obj.strength || 0);
      } catch {
        // ignore
      }
    }

    const activeOnlineCount = getActiveWsCount();

    res.json({
      activeOnlineCount,
      lanternsCount,
      wishesCount,
      reactionsTotal,
      confessionsCount: confessionsRows.length,
    });
  });

  // Block user
  router.post('/users/block', authMiddleware, (req, res) => {
    const parsed = blockSchema.safeParse(req.body || {});
    const user = req.authUser!;
    if (!parsed.success || parsed.data.targetUserId === user.id) {
      res.status(400).json({ error: 'Không thể ẩn chính mình hoặc thiếu mã tác giả.' });
      return;
    }

    let blocked: string[] = [];
    try {
      blocked = JSON.parse(user.blocked_user_ids_json || '[]');
    } catch {
      blocked = [];
    }
    if (!blocked.includes(parsed.data.targetUserId)) {
      blocked.push(parsed.data.targetUserId);
      sqliteDb
        .prepare('UPDATE users SET blocked_user_ids_json = ? WHERE id = ?')
        .run(JSON.stringify(blocked), user.id);
    }

    res.json({ message: 'Đã ẩn mọi nội dung từ người dùng này.' });
  });

  // Lanterns
  router.get('/lanterns', (_req, res) => {
    const rows = sqliteDb
      .prepare('SELECT * FROM lanterns ORDER BY created_at DESC LIMIT 30')
      .all() as Array<{
      id: string;
      author_id: string;
      author_nickname: string;
      message: string;
      color: string;
      x: number;
      y: number;
      ripples: number;
      created_at: string;
    }>;

    res.json({
      lanterns: rows.reverse().map((r) => ({
        id: r.id,
        authorId: r.author_id,
        authorNickname: r.author_nickname,
        message: r.message,
        color: r.color,
        x: r.x,
        y: r.y,
        ripples: r.ripples,
        createdAt: r.created_at,
      })),
    });
  });

  router.post('/lanterns', authMiddleware, (req, res) => {
    const parsed = lanternSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Nội dung hoa đăng không hợp lệ.' });
      return;
    }
    const user = req.authUser!;
    if (user.is_banned) {
      res.status(403).json({ error: 'Tài khoản này đang bị tạm khóa quyền đăng bài công khai để bảo vệ cộng đồng.' });
      return;
    }
    const safeNickname = sanitizePublicAlias(user.nickname);
    const risk = detectRisk(parsed.data.message);
    if (risk.level >= 2) {
      sqliteDb
        .prepare(`
          INSERT INTO moderation_queue (id, source_type, source_id, reporter_user_id, reason, risk_level, status, created_at)
          VALUES (?, 'lantern', ?, NULL, ?, ?, 'pending', ?)
        `)
        .run(`mq-${crypto.randomUUID()}`, user.id, 'Hoa đăng có dấu hiệu khủng hoảng', risk.level, new Date().toISOString());

      res.status(201).json({
        lantern: {
          id: `l-${crypto.randomUUID()}`,
          authorId: user.id,
          authorNickname: safeNickname,
          message: parsed.data.message,
          color: parsed.data.color,
          x: 50,
          y: 50,
          ripples: 1,
          createdAt: new Date().toISOString(),
        },
        riskLevel: risk.level,
        heldForModeration: true,
      });
      return;
    }

    const id = `l-${crypto.randomUUID()}`;
    const x = Math.floor(15 + crypto.randomInt(0, 70));
    const y = Math.floor(25 + crypto.randomInt(0, 55));
    const nowIso = new Date().toISOString();

    sqliteDb
      .prepare(`
        INSERT INTO lanterns (id, author_id, author_nickname, message, color, x, y, ripples, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `)
      .run(id, user.id, safeNickname, parsed.data.message, parsed.data.color, x, y, nowIso);

    res.status(201).json({
      lantern: {
        id,
        authorId: user.id,
        authorNickname: safeNickname,
        message: parsed.data.message,
        color: parsed.data.color,
        x,
        y,
        ripples: 1,
        createdAt: nowIso,
      },
      riskLevel: risk.level,
    });
  });

  router.post('/lanterns/:id/ripple', (req, res) => {
    const { id } = req.params;
    const row = sqliteDb.prepare('SELECT ripples FROM lanterns WHERE id = ?').get(id) as
      | { ripples: number }
      | undefined;
    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy hoa đăng.' });
      return;
    }
    const nextRipples = row.ripples + 1;
    sqliteDb.prepare('UPDATE lanterns SET ripples = ? WHERE id = ?').run(nextRipples, id);
    res.json({ ripples: nextRipples });
  });

  // Wishes
  router.get('/wishes', (_req, res) => {
    const rows = sqliteDb
      .prepare('SELECT * FROM wishes ORDER BY created_at DESC LIMIT 80')
      .all() as Array<{
      id: string;
      author_id: string;
      author_nickname: string;
      wish_text: string;
      action_commitment: string;
      tag: string;
      supports: number;
      user_supports_json: string;
      created_at: string;
    }>;

    res.json({
      wishes: rows.map((r) => ({
        id: r.id,
        authorId: r.author_id,
        authorNickname: r.author_nickname,
        wishText: r.wish_text,
        actionCommitment: r.action_commitment,
        tag: r.tag,
        supports: r.supports,
        userSupports: JSON.parse(r.user_supports_json || '[]'),
        createdAt: r.created_at,
      })),
    });
  });

  router.post('/wishes', authMiddleware, (req, res) => {
    const parsed = wishSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dữ liệu ước nguyện không hợp lệ.' });
      return;
    }

    const user = req.authUser!;
    if (user.is_banned) {
      res.status(403).json({ error: 'Tài khoản này đang bị tạm khóa quyền đăng bài công khai để bảo vệ cộng đồng.' });
      return;
    }
    const safeNickname = sanitizePublicAlias(user.nickname);
    const id = `w-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    const commitment =
      parsed.data.actionCommitment?.trim() || 'Hôm nay mình sẽ đối xử dịu dàng với chính mình.';
    const risk = detectRisk(`${parsed.data.wishText} ${commitment}`);

    if (risk.level >= 2) {
      sqliteDb
        .prepare(`
          INSERT INTO moderation_queue (id, source_type, source_id, reporter_user_id, reason, risk_level, status, created_at)
          VALUES (?, 'wish', ?, NULL, ?, ?, 'pending', ?)
        `)
        .run(`mq-${crypto.randomUUID()}`, user.id, 'Thẻ ước có dấu hiệu khủng hoảng', risk.level, nowIso);
      res.status(201).json({
        wish: {
          id,
          authorId: user.id,
          authorNickname: safeNickname,
          wishText: parsed.data.wishText,
          actionCommitment: commitment,
          tag: parsed.data.tag,
          supports: 1,
          userSupports: [user.id],
          createdAt: nowIso,
        },
        riskLevel: risk.level,
        heldForModeration: true,
      });
      return;
    }

    sqliteDb
      .prepare(`
        INSERT INTO wishes (id, author_id, author_nickname, wish_text, action_commitment, tag, supports, user_supports_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `)
      .run(
        id,
        user.id,
        safeNickname,
        parsed.data.wishText,
        commitment,
        parsed.data.tag,
        JSON.stringify([user.id]),
        nowIso
      );

    res.status(201).json({
      wish: {
        id,
        authorId: user.id,
        authorNickname: safeNickname,
        wishText: parsed.data.wishText,
        actionCommitment: commitment,
        tag: parsed.data.tag,
        supports: 1,
        userSupports: [user.id],
        createdAt: nowIso,
      },
      riskLevel: risk.level,
    });
  });

  router.post('/wishes/:id/support', authMiddleware, (req, res) => {
    const user = req.authUser!;
    const { id } = req.params;
    const row = sqliteDb
      .prepare('SELECT supports, user_supports_json FROM wishes WHERE id = ?')
      .get(id) as { supports: number; user_supports_json: string } | undefined;

    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy thẻ ước nguyện.' });
      return;
    }

    let userSupports: string[] = [];
    try {
      userSupports = JSON.parse(row.user_supports_json || '[]');
    } catch {
      userSupports = [];
    }

    const hasSupported = userSupports.includes(user.id);
    let nextSupports = row.supports;
    if (hasSupported) {
      userSupports = userSupports.filter((uid) => uid !== user.id);
      nextSupports = Math.max(0, nextSupports - 1);
    } else {
      userSupports.push(user.id);
      nextSupports += 1;
    }

    sqliteDb
      .prepare('UPDATE wishes SET supports = ?, user_supports_json = ? WHERE id = ?')
      .run(nextSupports, JSON.stringify(userSupports), id);

    res.json({ supports: nextSupports, active: !hasSupported });
  });

  return router;
}
