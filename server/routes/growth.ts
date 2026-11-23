import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { sqliteDb } from '../db/database.js';
import { authMiddleware, createRateLimiter } from '../middleware/auth.js';
import { detectContactOrPaymentInChat, detectRisk } from '../../shared/riskDetector.js';
import { sanitizePublicAlias } from '../utils/communityGate.js';

export const growthRouter = Router();

interface SharedLanternGiftRow {
  id: string;
  sender_user_id: string;
  sender_display_name: string;
  show_sender_name: number;
  message: string;
  color: string;
  expires_at: string;
  is_opted_out: number;
  reply_message: string;
  reply_at: string | null;
  created_at: string;
}

const giftIpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 15,
  keyPrefix: 'lantern_gift_ip',
});

const metricIpLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  keyPrefix: 'healthy_metric',
});

const createGiftSchema = z.object({
  message: z.string().trim().min(2, 'Lời nhắn cần ít nhất 2 ký tự').max(240),
  color: z.enum(['pink', 'gold', 'lavender', 'moon']).default('gold'),
  showSenderName: z.boolean().optional().default(false),
  senderAlias: z.string().max(40).optional().default(''),
  expiryDays: z.number().int().min(1).max(30).optional().default(14),
});

const replyGiftSchema = z.object({
  replyMessage: z.string().trim().min(2, 'Lời nhắn đáp lại cần ít nhất 2 ký tự').max(220),
  color: z.enum(['pink', 'gold', 'lavender', 'moon']).default('pink'),
});

const metricEventSchema = z.object({
  eventType: z.enum([
    'calm_tool_completed',
    'support_card_shown',
    'support_card_opened',
    'support_helpful_yes',
    'first_useful_action',
    'lantern_gift_created',
    'challenge_step_done',
    'feeling_lighter_yes',
    'feeling_lighter_no',
  ]),
  valueMs: z.number().int().min(0).max(3_600_000).optional(),
});

const feedbackSchema = z.object({
  note: z.string().trim().min(3, 'Vui lòng nhập góp ý ngắn').max(500),
  category: z.enum(['general', 'copy', 'safety', 'accessibility']).optional().default('general'),
});

export function recordHealthyMetric(
  eventType: z.infer<typeof metricEventSchema>['eventType'] | 'lantern_gift_opened',
  valueMs?: number
): void {
  try {
    const now = new Date();
    const dayBucket = now.toISOString().slice(0, 10);
    sqliteDb
      .prepare(`INSERT INTO healthy_metric_events (id, event_type, value_ms, day_bucket, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(`m-${crypto.randomUUID()}`, eventType, typeof valueMs === 'number' ? valueMs : null, dayBucket, now.toISOString());
  } catch {
    // non-fatal metric write
  }
}

// 1. "Gửi một ngọn đèn cho người bạn đang buồn" — Create anonymous share link (zero PII in link)
growthRouter.post('/lantern-gifts', authMiddleware, giftIpLimiter, (req, res) => {
  const user = req.authUser!;
  if (user.is_banned) {
    res.status(403).json({ error: 'Tài khoản này hiện không thể tạo liên kết chia sẻ.' });
    return;
  }

  const parsed = createGiftSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Nội dung ngọn đèn chưa hợp lệ.' });
    return;
  }

  // Per-user 24h anti-spam cap: max 5 gifts in 24h
  const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sentLast24h = (
    sqliteDb
      .prepare(`SELECT COUNT(*) as cnt FROM shared_lantern_gifts WHERE sender_user_id = ? AND created_at >= ?`)
      .get(user.id, dayAgoIso) as { cnt: number }
  ).cnt;

  if (sentLast24h >= 5) {
    res.status(429).json({
      error: 'Bạn đã tạo đủ 5 ngọn đèn chia sẻ trong 24 giờ qua để tránh gửi dồn dập. Hãy thử lại vào ngày mai nhé.',
    });
    return;
  }

  const { message, color, showSenderName, senderAlias, expiryDays } = parsed.data;
  const risk = detectRisk(message);
  if (risk.shouldHoldPublicPost) {
    res.status(400).json({
      error: 'Lời nhắn này có nội dung nhạy cảm hoặc dấu hiệu khủng hoảng, không phù hợp gửi qua liên kết chia sẻ. Nếu bạn đang nặng lòng, hãy xem mục Cần giúp ngay nhé.',
      riskLevel: risk.level,
    });
    return;
  }

  const contactCheck = detectContactOrPaymentInChat(message);
  if (contactCheck.hasContactOrPayment) {
    res.status(400).json({
      error: 'Để giữ an toàn cho liên kết ẩn danh, vui lòng không chèn số điện thoại, đường dẫn ngoài hay thông tin chuyển khoản vào lời chúc.',
    });
    return;
  }

  const shareToken = `dn_${crypto.randomBytes(12).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  const cleanName = showSenderName
    ? sanitizePublicAlias(senderAlias.trim() || user.nickname)
    : '';

  sqliteDb
    .prepare(`
      INSERT INTO shared_lantern_gifts (id, sender_user_id, sender_display_name, show_sender_name, message, color, expires_at, is_opted_out, reply_message, reply_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, '', NULL, ?)
    `)
    .run(
      shareToken,
      user.id,
      cleanName,
      showSenderName ? 1 : 0,
      message.trim(),
      color,
      expiresAt,
      now.toISOString()
    );

  recordHealthyMetric('lantern_gift_created');

  res.status(201).json({
    gift: {
      id: shareToken,
      sharePath: `/den/${shareToken}`,
      message: message.trim(),
      color,
      senderDisplayName: cleanName || null,
      showSenderName,
      expiresAt,
      createdAt: now.toISOString(),
    },
  });
});

// 2. Open received lantern link — public, NO registration required, zero private sender data exposed
growthRouter.get('/lantern-gifts/:token', (req, res) => {
  const { token } = req.params;
  if (!token || !/^dn_[a-f0-9]{16,40}$/.test(token)) {
    res.status(404).json({ error: 'Không tìm thấy ngọn đèn này.' });
    return;
  }

  const row = sqliteDb
    .prepare(`SELECT * FROM shared_lantern_gifts WHERE id = ?`)
    .get(token) as unknown as SharedLanternGiftRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Không tìm thấy ngọn đèn này.' });
    return;
  }

  if (row.is_opted_out) {
    res.status(410).json({ error: 'Người nhận đã chọn tắt ngọn đèn này.', optedOut: true });
    return;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    res.status(410).json({ error: 'Liên kết ngọn đèn này đã hết hạn theo thời gian định sẵn.', expired: true });
    return;
  }

  recordHealthyMetric('lantern_gift_opened');

  res.json({
    gift: {
      id: row.id,
      message: row.message,
      color: row.color,
      senderDisplayName: row.show_sender_name ? row.sender_display_name : null,
      expiresAt: row.expires_at,
      hasReplied: Boolean(row.reply_message),
      replyMessage: row.reply_message || null,
      replyAt: row.reply_at,
      createdAt: row.created_at,
    },
  });
});

// 3. Recipient lights a lantern back anonymously onto the public lake
growthRouter.post('/lantern-gifts/:token/reply', giftIpLimiter, (req, res) => {
  const { token } = req.params;
  const row = sqliteDb
    .prepare(`SELECT * FROM shared_lantern_gifts WHERE id = ?`)
    .get(token) as unknown as SharedLanternGiftRow | undefined;

  if (!row || row.is_opted_out || new Date(row.expires_at).getTime() <= Date.now()) {
    res.status(410).json({ error: 'Ngọn đèn này không còn khả dụng.' });
    return;
  }

  const parsed = replyGiftSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Nội dung đáp lại chưa hợp lệ.' });
    return;
  }

  const risk = detectRisk(parsed.data.replyMessage);
  const contact = detectContactOrPaymentInChat(parsed.data.replyMessage);
  if (risk.shouldHoldPublicPost || contact.hasContactOrPayment) {
    res.status(400).json({
      error: 'Vui lòng giữ lời nhắn nhẹ nhàng và không chèn thông tin liên hệ hoặc nội dung nhạy cảm.',
    });
    return;
  }

  const nowIso = new Date().toISOString();
  sqliteDb
    .prepare(`UPDATE shared_lantern_gifts SET reply_message = ?, reply_at = ? WHERE id = ?`)
    .run(parsed.data.replyMessage.trim(), nowIso, token);

  // Also float an anonymous candle on the shared public lake without leaking gift token/private context
  const x = Math.floor(15 + Math.random() * 70);
  const y = Math.floor(25 + Math.random() * 55);
  sqliteDb
    .prepare(`
      INSERT INTO lanterns (id, author_id, author_nickname, message, color, x, y, ripples, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `)
    .run(
      `l-${crypto.randomUUID()}`,
      'guest-lantern-reply',
      'Một người ghé hồ',
      parsed.data.replyMessage.trim(),
      parsed.data.color,
      x,
      y,
      nowIso
    );

  res.status(201).json({
    replied: true,
    replyMessage: parsed.data.replyMessage.trim(),
    replyAt: nowIso,
  });
});

// 4. Recipient clicks "Không muốn nhận" -> opt out & immediately wipe content
growthRouter.post('/lantern-gifts/:token/opt-out', (req, res) => {
  const { token } = req.params;
  const row = sqliteDb
    .prepare(`SELECT id FROM shared_lantern_gifts WHERE id = ?`)
    .get(token) as { id: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Không tìm thấy ngọn đèn.' });
    return;
  }

  sqliteDb
    .prepare(`UPDATE shared_lantern_gifts SET is_opted_out = 1, message = '', sender_display_name = '', reply_message = '' WHERE id = ?`)
    .run(token);

  res.json({
    optedOut: true,
    message: 'Đã tắt ngọn đèn và xóa lời nhắn khỏi liên kết này.',
  });
});

// 5. "Đêm Hoa Đăng cộng đồng" — Upcoming public event schedule & aggregate public lake stats (zero PII)
growthRouter.get('/lantern-night', (_req, res) => {
  const now = new Date();
  const year = now.getFullYear();

  const candidateDates: Array<{
    id: string;
    title: string;
    subtitle: string;
    startAt: Date;
    endAt: Date;
  }> = [];

  // Monthly serene full-moon / mid-month lantern nights at 20:00-23:00 (+07:00 approx via UTC+7 offset)
  for (let offset = 0; offset <= 2; offset++) {
    const d = new Date(Date.UTC(year, now.getUTCMonth() + offset, 15, 13, 0, 0)); // 13:00 UTC = 20:00 ICT
    const end = new Date(d.getTime() + 3 * 60 * 60 * 1000);
    candidateDates.push({
      id: `ram-${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`,
      title: `Đêm Hoa Đăng Rằm Tháng ${d.getUTCMonth() + 1}`,
      subtitle: 'Cùng thả một ngọn đèn bình an lên mặt hồ chung lúc 20:00–23:00.',
      startAt: d,
      endAt: end,
    });
  }

  // Special seasonal companionship dates (14/2, 11/11)
  const specials = [
    {
      month: 1,
      day: 14,
      title: 'Đêm Hoa Đăng 14/2 — Ngồi yên bên nhau',
      subtitle: 'Dành cho bất kỳ ai thấy trống trải giữa ngày lễ tình nhân.',
    },
    {
      month: 10,
      day: 11,
      title: 'Đêm Hoa Đăng 11/11 — Dịu lại sau một ngày dài',
      subtitle: 'Thả một điều nhẹ nhõm xuống mặt hồ lúc 20:00–23:00.',
    },
  ];
  for (const sp of specials) {
    for (const y of [year, year + 1]) {
      const start = new Date(Date.UTC(y, sp.month, sp.day, 13, 0, 0));
      const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
      candidateDates.push({
        id: `special-${y}-${sp.month + 1}-${sp.day}`,
        title: sp.title,
        subtitle: sp.subtitle,
        startAt: start,
        endAt: end,
      });
    }
  }

  const activeOrUpcoming = candidateDates
    .filter((ev) => ev.endAt.getTime() > now.getTime())
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const nextEv = activeOrUpcoming[0] || candidateDates[0];
  const isLiveNow = now.getTime() >= nextEv.startAt.getTime() && now.getTime() <= nextEv.endAt.getTime();

  const publicLanternsCount = (
    sqliteDb.prepare(`SELECT COUNT(*) as cnt FROM lanterns`).get() as { cnt: number }
  ).cnt;

  const recentPublicLanterns = sqliteDb
    .prepare(`SELECT id, author_nickname as authorNickname, message, color, ripples, created_at as createdAt FROM lanterns ORDER BY created_at DESC LIMIT 8`)
    .all();

  res.json({
    nextEvent: {
      id: nextEv.id,
      title: nextEv.title,
      subtitle: nextEv.subtitle,
      startAt: nextEv.startAt.toISOString(),
      endAt: nextEv.endAt.toISOString(),
      isLiveNow,
    },
    upcomingEvents: activeOrUpcoming.slice(0, 3).map((ev) => ({
      id: ev.id,
      title: ev.title,
      subtitle: ev.subtitle,
      startAt: ev.startAt.toISOString(),
      endAt: ev.endAt.toISOString(),
    })),
    publicLanternsCount,
    recentPublicLanterns,
  });
});

// 6. Privacy-first aggregate metrics collection (Section 8.4 — zero content, zero PII, reject extra text fields)
growthRouter.post('/metrics/event', metricIpLimiter, (req, res) => {
  const parsed = metricEventSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Sự kiện thống kê tổng hợp không hợp lệ.' });
    return;
  }
  recordHealthyMetric(parsed.data.eventType, parsed.data.valueMs);
  res.status(201).json({ recorded: true });
});

// 7. Anonymous closed-beta / public feedback endpoint (no PII stored)
growthRouter.post('/feedback', metricIpLimiter, (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Nội dung góp ý chưa hợp lệ.' });
    return;
  }
  const nowIso = new Date().toISOString();
  sqliteDb
    .prepare(`INSERT INTO beta_feedback (id, note, category, created_at) VALUES (?, ?, ?, ?)`)
    .run(`fb-${crypto.randomUUID()}`, parsed.data.note.trim(), parsed.data.category, nowIso);

  res.status(201).json({ saved: true });
});

// 8. Stage 4: Quarterly Anonymized Community Report (Section 8.3 — minimum k-anonymity >= 5, zero PII)
const K_ANONYMITY_THRESHOLD = 5;

function applyKAnonymity(count: number): {
  value: number | null;
  display: string;
  maskedBelowThreshold: boolean;
} {
  if (count === 0) {
    return { value: 0, display: '0', maskedBelowThreshold: false };
  }
  if (count < K_ANONYMITY_THRESHOLD) {
    return { value: null, display: `< ${K_ANONYMITY_THRESHOLD}`, maskedBelowThreshold: true };
  }
  return { value: count, display: String(count), maskedBelowThreshold: false };
}

growthRouter.get('/community/quarterly-report', (_req, res) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const quarterIndex = Math.floor(now.getUTCMonth() / 3) + 1;
  const quarterLabel = `${year}-Q${quarterIndex}`;
  const quarterStartMonth = (quarterIndex - 1) * 3;
  const quarterStart = new Date(Date.UTC(year, quarterStartMonth, 1, 0, 0, 0));
  const quarterEnd = new Date(Date.UTC(year, quarterStartMonth + 3, 1, 0, 0, 0));
  const startIso = quarterStart.toISOString();
  const endIso = quarterEnd.toISOString();
  const startDay = startIso.slice(0, 10);
  const endDay = endIso.slice(0, 10);

  const calmCompletedRaw = (
    sqliteDb
      .prepare(
        `SELECT COUNT(*) as cnt FROM healthy_metric_events WHERE event_type = 'calm_tool_completed' AND day_bucket >= ? AND day_bucket < ?`
      )
      .get(startDay, endDay) as { cnt: number }
  ).cnt;

  const lanternsFloatedRaw = (
    sqliteDb
      .prepare(`SELECT COUNT(*) as cnt FROM lanterns WHERE created_at >= ? AND created_at < ?`)
      .get(startIso, endIso) as { cnt: number }
  ).cnt;

  const sharedGiftsRaw = (
    sqliteDb
      .prepare(`SELECT COUNT(*) as cnt FROM shared_lantern_gifts WHERE created_at >= ? AND created_at < ?`)
      .get(startIso, endIso) as { cnt: number }
  ).cnt;

  const approvedConfessionsRaw = (
    sqliteDb
      .prepare(
        `SELECT COUNT(*) as cnt FROM confessions WHERE moderation_status = 'approved' AND created_at >= ? AND created_at < ?`
      )
      .get(startIso, endIso) as { cnt: number }
  ).cnt;

  const wishesHungRaw = (
    sqliteDb
      .prepare(`SELECT COUNT(*) as cnt FROM wishes WHERE created_at >= ? AND created_at < ?`)
      .get(startIso, endIso) as { cnt: number }
  ).cnt;

  const lighterYes = (
    sqliteDb
      .prepare(
        `SELECT COUNT(*) as cnt FROM healthy_metric_events WHERE event_type = 'feeling_lighter_yes' AND day_bucket >= ? AND day_bucket < ?`
      )
      .get(startDay, endDay) as { cnt: number }
  ).cnt;

  const lighterNo = (
    sqliteDb
      .prepare(
        `SELECT COUNT(*) as cnt FROM healthy_metric_events WHERE event_type = 'feeling_lighter_no' AND day_bucket >= ? AND day_bucket < ?`
      )
      .get(startDay, endDay) as { cnt: number }
  ).cnt;

  const totalLighterResponses = lighterYes + lighterNo;
  const feelingLighterPct =
    totalLighterResponses >= K_ANONYMITY_THRESHOLD
      ? Math.round((lighterYes / totalLighterResponses) * 100)
      : null;

  res.json({
    quarter: quarterLabel,
    periodStart: startDay,
    periodEnd: new Date(quarterEnd.getTime() - 1).toISOString().slice(0, 10),
    anonymityThreshold: K_ANONYMITY_THRESHOLD,
    privacyGuarantee:
      'Báo cáo chỉ tổng hợp số đếm ẩn danh cấp cộng đồng. Mọi chỉ số có từ 1–4 lượt đều được ẩn thành "< 5" để tránh suy đoán danh tính, và không bao gồm nội dung nhật ký hay thư riêng tư.',
    metrics: {
      calmToolsCompleted: applyKAnonymity(calmCompletedRaw),
      lanternsFloated: applyKAnonymity(lanternsFloatedRaw),
      sharedGiftsCreated: applyKAnonymity(sharedGiftsRaw),
      approvedConfessions: applyKAnonymity(approvedConfessionsRaw),
      wishesHung: applyKAnonymity(wishesHungRaw),
      feelingLighterSampleMet: totalLighterResponses >= K_ANONYMITY_THRESHOLD,
      feelingLighterPct,
    },
  });
});

// 9. Stage 4: Organizational sponsorship / partnership inquiry (Section 8.5 — zero access to user personal data)
const partnerInquiryLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: 'partner_inquiry',
});

const partnerInquirySchema = z.object({
  orgName: z.string().trim().min(2, 'Vui lòng nhập tên tổ chức / đơn vị.').max(120),
  orgType: z.enum(['university', 'company', 'ngo', 'community']),
  contactEmail: z.string().trim().email('Địa chỉ email chưa hợp lệ.').max(120),
  contactPerson: z.string().trim().max(80).optional().default(''),
  note: z.string().trim().min(10, 'Vui lòng mô tả ngắn nhu cầu hợp tác (tối thiểu 10 ký tự).').max(800),
});

growthRouter.post('/partners/inquiry', partnerInquiryLimiter, (req, res) => {
  const parsed = partnerInquirySchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Thông tin đề xuất hợp tác chưa hợp lệ.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const id = `org-${crypto.randomUUID()}`;
  sqliteDb
    .prepare(`
      INSERT INTO organization_inquiries (id, org_name, org_type, contact_email, contact_person, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      parsed.data.orgName,
      parsed.data.orgType,
      parsed.data.contactEmail,
      parsed.data.contactPerson,
      parsed.data.note,
      nowIso
    );

  res.status(201).json({
    submitted: true,
    id,
    privacyGuarantee:
      'Heali chỉ ký hợp tác tài trợ vận hành cộng đồng hoặc không gian riêng cho nhân viên/sinh viên — đơn vị tài trợ tuyệt đối không có quyền xem nhật ký, tâm trạng hay danh tính cá nhân.',
  });
});

