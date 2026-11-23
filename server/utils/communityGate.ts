import { sqliteDb } from '../db/database.js';
import { detectContactOrPaymentInChat } from '../../shared/riskDetector.js';

export interface CommunityGateStatus {
  communityOpen: boolean;
  moderationQueueReady: boolean;
  activeModeratorsCount: number;
  moderatorAlias: string | null;
  slaTargetMinutes: number;
  shiftNote: string;
  closedReason: string | null;
  pendingModerationCount: number;
  queueOverloaded: boolean;
  slowModeNotice: string | null;
}

interface ModeratorShiftRow {
  id: string;
  moderator_alias: string;
  status: string;
  sla_target_minutes: number;
  note: string;
  started_at: string;
  ended_at: string | null;
}

export function getCommunityGateStatus(): CommunityGateStatus {
  const pendingRow = sqliteDb
    .prepare(`SELECT COUNT(*) as cnt FROM moderation_queue WHERE status = 'pending'`)
    .get() as { cnt: number };
  const pendingModerationCount = pendingRow?.cnt || 0;
  const queueOverloaded = pendingModerationCount >= 12;
  const slowModeNotice = queueOverloaded
    ? 'Hàng đợi rà soát đang có nhiều nội dung cần xem kỹ; Heali tạm giảm nhịp giới thiệu để đảm bảo an toàn cộng đồng.'
    : null;

  const activeShifts = sqliteDb
    .prepare(
      `SELECT * FROM moderator_shifts WHERE status = 'active' AND ended_at IS NULL ORDER BY started_at DESC`
    )
    .all() as unknown as ModeratorShiftRow[];

  if (activeShifts.length === 0) {
    const latest = sqliteDb
      .prepare(`SELECT * FROM moderator_shifts ORDER BY started_at DESC LIMIT 1`)
      .get() as ModeratorShiftRow | undefined;

    return {
      communityOpen: false,
      moderationQueueReady: true,
      activeModeratorsCount: 0,
      moderatorAlias: null,
      slaTargetMinutes: latest?.sla_target_minutes || 15,
      shiftNote: latest?.note || '',
      closedReason:
        latest?.note?.trim() ||
        'Cộng đồng công khai & ghép đôi người lạ đang tạm nghỉ ngoài ca trực kiểm duyệt để đảm bảo an toàn cho bạn.',
      pendingModerationCount,
      queueOverloaded,
      slowModeNotice,
    };
  }

  const primary = activeShifts[0];
  return {
    communityOpen: true,
    moderationQueueReady: true,
    activeModeratorsCount: activeShifts.length,
    moderatorAlias: primary.moderator_alias,
    slaTargetMinutes: primary.sla_target_minutes || 15,
    shiftNote: primary.note || '',
    closedReason: null,
    pendingModerationCount,
    queueOverloaded,
    slowModeNotice,
  };
}

/**
 * Strips phone numbers, URLs, social handles (@user), and payment references from nicknames
 * so users cannot bypass chat/feed anti-contact rules via profile display names.
 */
export function sanitizePublicAlias(rawAlias: string): string {
  const trimmed = (rawAlias || '').trim().slice(0, 40);
  if (!trimmed) return 'Bạn Lữ Hành';

  const contactCheck = detectContactOrPaymentInChat(trimmed);
  if (contactCheck.hasContactOrPayment) {
    return 'Bạn Lữ Hành';
  }

  const cleaned = trimmed
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/@[a-z0-9._-]+/gi, '')
    .replace(/\b0\d{7,11}\b/g, '')
    .replace(/\+?\d[\d\s.-]{6,}\d/g, '')
    .trim();

  return cleaned.length >= 2 ? cleaned.slice(0, 40) : 'Bạn Lữ Hành';
}
