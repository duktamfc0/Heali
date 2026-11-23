import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { sqliteDb } from '../db/database.js';
import { authMiddleware, extractBearerToken, findUserByRawToken } from '../middleware/auth.js';
import { detectRisk } from '../../shared/riskDetector.js';
import { getCommunityGateStatus, sanitizePublicAlias } from '../utils/communityGate.js';

export const confessionsRouter = Router();

interface ConfessionRow {
  id: string;
  author_id: string;
  author_nickname: string;
  author_avatar: string;
  category: string;
  title: string;
  content: string;
  mood_tag: string;
  is_trigger_warning: number;
  reactions_json: string;
  user_reactions_json: string;
  report_count: number;
  is_moderated: number;
  moderation_status: string;
  created_at: string;
}

function mapConfessionRow(row: ConfessionRow) {
  return {
    id: row.id,
    authorId: row.author_id,
    authorNickname: row.author_nickname,
    authorAvatar: row.author_avatar,
    category: row.category,
    title: row.title,
    content: row.content,
    moodTag: row.mood_tag,
    isTriggerWarning: Boolean(row.is_trigger_warning),
    reactions: JSON.parse(row.reactions_json),
    userReactions: JSON.parse(row.user_reactions_json),
    reportCount: row.report_count,
    isModerated: Boolean(row.is_moderated),
    moderationStatus: row.moderation_status,
    createdAt: row.created_at,
  };
}

const createConfessionSchema = z.object({
  title: z.string().max(150).optional().default(''),
  content: z.string().trim().min(1, 'Nội dung chia sẻ không được để trống').max(4000),
  category: z.enum(['breakup', 'loneliness', 'relationship', 'family', 'friendship', 'healing']).default('loneliness'),
  moodTag: z.string().max(30).optional().default('Tâm sự'),
  isTriggerWarning: z.boolean().optional(),
});

const reactSchema = z.object({
  type: z.enum(['hug', 'listen', 'not_alone', 'peace', 'strength']),
});

const reportSchema = z.object({
  reason: z.string().trim().min(1).max(300),
});

confessionsRouter.get('/', (req, res) => {
  const token = extractBearerToken(req);
  let blockedIds: string[] = [];
  let callerId = '';
  if (token) {
    const caller = findUserByRawToken(token);
    if (caller) {
      callerId = caller.id;
      try {
        blockedIds = JSON.parse(caller.blocked_user_ids_json || '[]');
      } catch {
        blockedIds = [];
      }
    }
  }

  const category = typeof req.query.category === 'string' ? req.query.category : 'all';
  const sort = req.query.sort === 'popular' ? 'popular' : 'newest';

  const rows = sqliteDb
    .prepare(
      `SELECT * FROM confessions WHERE is_moderated = 0 AND moderation_status = 'approved' ORDER BY created_at DESC LIMIT 120`
    )
    .all() as unknown as ConfessionRow[];

  let mapped = rows
    .filter((r) => !blockedIds.includes(r.author_id) || r.author_id === callerId)
    .map(mapConfessionRow);

  if (category && category !== 'all') {
    mapped = mapped.filter((c) => c.category === category);
  }

  if (sort === 'popular') {
    mapped.sort((a, b) => {
      const sumA =
        a.reactions.hug + a.reactions.listen + a.reactions.not_alone + a.reactions.peace + a.reactions.strength;
      const sumB =
        b.reactions.hug + b.reactions.listen + b.reactions.not_alone + b.reactions.peace + b.reactions.strength;
      return sumB - sumA;
    });
  }

  res.json({ confessions: mapped });
});

confessionsRouter.post('/', authMiddleware, (req, res) => {
  const parsed = createConfessionSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dữ liệu bài viết không hợp lệ.' });
    return;
  }

  const user = req.authUser!;
  if (user.is_banned) {
    res.status(403).json({ error: 'Tài khoản này đã bị tạm khóa quyền đăng bài công khai để bảo vệ an toàn cộng đồng.' });
    return;
  }

  const gate = getCommunityGateStatus();
  if (!gate.communityOpen) {
    res.status(503).json({
      error:
        gate.closedReason ||
        'Góc tâm tình công khai đang tạm nghỉ ngoài ca trực kiểm duyệt. Bạn vẫn có thể viết vào Nhật ký riêng tư nhé.',
      communityPaused: true,
    });
    return;
  }

  const { title, content, category, moodTag, isTriggerWarning } = parsed.data;
  const risk = detectRisk(`${title} ${content}`);
  const safeNickname = sanitizePublicAlias(user.nickname);

  // Section 4.1: Level >= 2 posts do NOT appear publicly immediately — hold in moderation queue for compassionate review
  const holdForReview = risk.shouldHoldPublicPost;
  const confessionId = `c-${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();
  const reactions = { hug: 0, listen: 0, not_alone: 0, peace: 0, strength: 0 };

  sqliteDb
    .prepare(`
      INSERT INTO confessions (id, author_id, author_nickname, author_avatar, category, title, content, mood_tag, is_trigger_warning, reactions_json, user_reactions_json, report_count, is_moderated, moderation_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', 0, ?, ?, ?)
    `)
    .run(
      confessionId,
      user.id,
      safeNickname,
      user.avatar,
      category,
      title.trim().slice(0, 150),
      content.trim().slice(0, 4000),
      moodTag.trim().slice(0, 30) || 'Tâm sự',
      isTriggerWarning || risk.level >= 1 ? 1 : 0,
      JSON.stringify(reactions),
      holdForReview ? 1 : 0,
      holdForReview ? 'pending_review' : 'approved',
      nowIso
    );

  if (holdForReview) {
    sqliteDb
      .prepare(`
        INSERT INTO moderation_queue (id, source_type, source_id, reporter_user_id, reason, risk_level, status, created_at)
        VALUES (?, 'confession', ?, NULL, ?, ?, 'pending', ?)
      `)
      .run(`mq-${crypto.randomUUID()}`, confessionId, 'Tự động giữ chờ rà soát nội dung có dấu hiệu khủng hoảng', risk.level, nowIso);
  }

  const row = sqliteDb.prepare('SELECT * FROM confessions WHERE id = ?').get(confessionId) as unknown as ConfessionRow;
  res.status(201).json({
    confession: mapConfessionRow(row),
    heldForModeration: holdForReview,
    riskLevel: risk.level,
  });
});

confessionsRouter.post('/:id/react', authMiddleware, (req, res) => {
  const parsed = reactSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Loại phản ứng không hợp lệ.' });
    return;
  }

  const user = req.authUser!;
  const { id } = req.params;
  const row = sqliteDb.prepare('SELECT * FROM confessions WHERE id = ?').get(id) as unknown as ConfessionRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Không tìm thấy bài viết.' });
    return;
  }

  const reactions = JSON.parse(row.reactions_json || '{}');
  const userReactions = JSON.parse(row.user_reactions_json || '{}') as Record<string, string[]>;
  const type = parsed.data.type;
  if (!userReactions[type]) userReactions[type] = [];

  const hasReacted = userReactions[type].includes(user.id);
  if (hasReacted) {
    userReactions[type] = userReactions[type].filter((uid) => uid !== user.id);
    reactions[type] = Math.max(0, (reactions[type] || 0) - 1);
  } else {
    userReactions[type].push(user.id);
    reactions[type] = (reactions[type] || 0) + 1;
  }

  sqliteDb
    .prepare('UPDATE confessions SET reactions_json = ?, user_reactions_json = ? WHERE id = ?')
    .run(JSON.stringify(reactions), JSON.stringify(userReactions), id);

  const updated = sqliteDb.prepare('SELECT * FROM confessions WHERE id = ?').get(id) as unknown as ConfessionRow;
  res.json({ confession: mapConfessionRow(updated), active: !hasReacted });
});

confessionsRouter.post('/:id/report', authMiddleware, (req, res) => {
  const parsed = reportSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Vui lòng cung cấp lý do báo cáo.' });
    return;
  }

  const user = req.authUser!;
  const { id } = req.params;
  const row = sqliteDb.prepare('SELECT * FROM confessions WHERE id = ?').get(id) as unknown as ConfessionRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Không tìm thấy bài viết.' });
    return;
  }

  let reportedList: string[] = [];
  try {
    reportedList = JSON.parse(user.reported_post_ids_json || '[]');
  } catch {
    reportedList = [];
  }

  if (!reportedList.includes(id)) {
    reportedList.push(id);
    sqliteDb
      .prepare('UPDATE users SET reported_post_ids_json = ? WHERE id = ?')
      .run(JSON.stringify(reportedList), user.id);

    sqliteDb
      .prepare('UPDATE confessions SET report_count = report_count + 1 WHERE id = ?')
      .run(id);

    // Push into real moderation queue (Section 4.3: replaces auto-hide at 3 reports to avoid brigading)
    sqliteDb
      .prepare(`
        INSERT INTO moderation_queue (id, source_type, source_id, reporter_user_id, reason, risk_level, status, created_at)
        VALUES (?, 'confession_report', ?, ?, ?, 0, 'pending', ?)
      `)
      .run(`mq-${crypto.randomUUID()}`, id, user.id, parsed.data.reason, new Date().toISOString());
  }

  res.json({
    message: 'Cảm ơn bạn đã báo cáo. Nội dung này đã được đưa vào hàng đợi để đội ngũ kiểm duyệt xem xét.',
    postHidden: false,
  });
});
