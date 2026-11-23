import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { sqliteDb } from '../db/database.js';
import { authMiddleware, extractBearerToken, findUserByRawToken } from '../middleware/auth.js';
import { detectRisk, normalizeVietnameseText } from '../../shared/riskDetector.js';

export const spiritualRouter = Router();

const EX_RELATIONSHIP_LOOP_KEYWORDS = [
  'nguoi cu',
  'nguoi yeu cu',
  'bo cu',
  'nyc',
  'quay lai voi',
  'noi lai tinh xua',
  'nhan tin cho nguoi cu',
  'anh ay co quay lai',
  'co ay co quay lai',
  'co quay lai khong',
  'bao gio quay lai',
];

function containsExLoopPattern(text: string): boolean {
  const norm = normalizeVietnameseText(text);
  return EX_RELATIONSHIP_LOOP_KEYWORDS.some((kw) => norm.includes(kw));
}

interface ChairRow {
  id: string;
  owner_user_id: string;
  host_name: string;
  specialty: string;
  title: string;
  bio: string;
  seat_price: number;
  viewer_ticket_price: number;
  max_seats: number;
  booked_seats_count: number;
  viewer_count: number;
  is_live: number;
  created_at: string;
}

interface BookingRow {
  id: string;
  chair_id: string;
  user_id: string;
  viewer_name: string;
  birth_date: string;
  question_topic: string;
  note: string;
  fee_amount: number;
  status: string;
  created_at: string;
}

interface PassRow {
  id: string;
  chair_id: string;
  user_id: string;
  viewer_name: string;
  fee_amount: number;
  created_at: string;
}

function mapChair(row: ChairRow) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    hostName: row.host_name,
    specialty: row.specialty,
    title: row.title,
    bio: row.bio,
    seatPrice: config.featurePaidSpiritual ? row.seat_price : 0,
    viewerTicketPrice: config.featurePaidSpiritual ? row.viewer_ticket_price : 0,
    maxSeats: row.max_seats,
    bookedSeatsCount: row.booked_seats_count,
    viewerCount: row.viewer_count,
    isLive: Boolean(row.is_live),
    createdAt: row.created_at,
  };
}

function mapBooking(row: BookingRow) {
  return {
    id: row.id,
    chairId: row.chair_id,
    userId: row.user_id,
    viewerName: row.viewer_name,
    birthDate: row.birth_date,
    questionTopic: row.question_topic,
    note: row.note,
    feeAmount: row.fee_amount,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapPass(row: PassRow) {
  return {
    id: row.id,
    chairId: row.chair_id,
    userId: row.user_id,
    viewerName: row.viewer_name,
    feeAmount: row.fee_amount,
    createdAt: row.created_at,
  };
}

const createChairSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên ghế / chủ đề phiên').max(100),
  bio: z.string().max(260).optional().default(''),
  specialty: z.enum(['tarot', 'tuvi', 'numerology', 'combined']).default('tarot'),
  seatPrice: z.number().min(0).max(300000).optional().default(0), // Section 4.4: tightened price cap
  viewerTicketPrice: z.number().min(0).max(50000).optional().default(0),
  maxSeats: z.number().int().min(1).max(20).optional().default(6),
  hostRulesAccepted: z.boolean().refine((v) => v === true, {
    message: 'Cần xác nhận đồng ý Quy tắc Cố vấn (không chẩn đoán, không phán đoán định mệnh, không gài khách quay lại).',
  }),
});

const bookSeatSchema = z.object({
  birthDate: z.string().max(30).optional().default(''),
  questionTopic: z.string().trim().min(1, 'Vui lòng nhập câu hỏi hoặc chủ đề muốn phản chiếu').max(150),
  note: z.string().max(500).optional().default(''),
  confirmAfterReflection: z.boolean().optional().default(false),
});

spiritualRouter.get('/chairs', (req, res) => {
  const token = extractBearerToken(req);
  const caller = token ? findUserByRawToken(token) : null;
  const currentUserId = caller?.id || null;

  const chairRows = sqliteDb
    .prepare('SELECT * FROM spiritual_chairs ORDER BY created_at DESC')
    .all() as unknown as ChairRow[];

  const bookingRows = currentUserId
    ? (sqliteDb
        .prepare('SELECT * FROM spiritual_bookings WHERE user_id = ? ORDER BY created_at DESC')
        .all(currentUserId) as unknown as BookingRow[])
    : [];

  const passRows = currentUserId
    ? (sqliteDb
        .prepare('SELECT * FROM spiritual_viewer_passes WHERE user_id = ? ORDER BY created_at DESC')
        .all(currentUserId) as unknown as PassRow[])
    : [];

  const myChairIds = new Set(
    chairRows.filter((c) => currentUserId && c.owner_user_id === currentUserId).map((c) => c.id)
  );
  const hostIncomingBookings =
    currentUserId && myChairIds.size > 0
      ? (sqliteDb
          .prepare('SELECT * FROM spiritual_bookings ORDER BY created_at DESC LIMIT 100')
          .all() as unknown as BookingRow[])
          .filter((b) => myChairIds.has(b.chair_id))
          .map(mapBooking)
      : [];

  res.json({
    paidEnabled: config.featurePaidSpiritual,
    chairs: chairRows.map(mapChair),
    myBookings: bookingRows.map(mapBooking),
    myViewerPasses: passRows.map(mapPass),
    hostIncomingBookings,
  });
});

spiritualRouter.post('/chairs', authMiddleware, (req, res) => {
  const parsed = createChairSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Thông tin ghế chưa hợp lệ.' });
    return;
  }

  const user = req.authUser!;
  const id = `chair-${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();
  const seatPrice = config.featurePaidSpiritual ? Math.round(parsed.data.seatPrice) : 0;
  const ticketPrice = config.featurePaidSpiritual ? Math.round(parsed.data.viewerTicketPrice) : 0;
  const bio =
    parsed.data.bio.trim() ||
    'Lắng nghe và gợi mở suy ngẫm qua bài Tarot/số học (mang tính tham khảo, không thay thế tư vấn chuyên môn).';

  sqliteDb
    .prepare(`
      INSERT INTO spiritual_chairs (id, owner_user_id, host_name, specialty, title, bio, seat_price, viewer_ticket_price, max_seats, booked_seats_count, viewer_count, is_live, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?)
    `)
    .run(id, user.id, user.nickname, parsed.data.specialty, parsed.data.title, bio, seatPrice, ticketPrice, parsed.data.maxSeats, nowIso);

  const row = sqliteDb.prepare('SELECT * FROM spiritual_chairs WHERE id = ?').get(id) as unknown as ChairRow;
  res.status(201).json({ chair: mapChair(row) });
});

spiritualRouter.patch('/chairs/:id/toggle', authMiddleware, (req, res) => {
  const user = req.authUser!;
  const { id } = req.params;
  const row = sqliteDb.prepare('SELECT * FROM spiritual_chairs WHERE id = ?').get(id) as unknown as ChairRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Không tìm thấy ghế cố vấn.' });
    return;
  }
  if (row.owner_user_id !== user.id) {
    res.status(403).json({ error: 'Bạn chỉ có thể thay đổi trạng thái ghế do mình mở.' });
    return;
  }
  const nextLive = row.is_live ? 0 : 1;
  sqliteDb.prepare('UPDATE spiritual_chairs SET is_live = ? WHERE id = ?').run(nextLive, id);
  const updated = sqliteDb.prepare('SELECT * FROM spiritual_chairs WHERE id = ?').get(id) as unknown as ChairRow;
  res.json({ chair: mapChair(updated) });
});

spiritualRouter.post('/chairs/:id/book-seat', authMiddleware, (req, res) => {
  const parsed = bookSeatSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Thông tin đặt ghế chưa hợp lệ.' });
    return;
  }

  const user = req.authUser!;
  const { id } = req.params;
  const chair = sqliteDb.prepare('SELECT * FROM spiritual_chairs WHERE id = ?').get(id) as unknown as ChairRow | undefined;
  if (!chair) {
    res.status(404).json({ error: 'Không tìm thấy ghế cố vấn.' });
    return;
  }
  if (!chair.is_live) {
    res.status(400).json({ error: 'Ghế này hiện đang tạm nghỉ nhận lượt mới.' });
    return;
  }
  if (chair.booked_seats_count >= chair.max_seats) {
    res.status(400).json({ error: 'Ghế đã đủ lượt đăng ký trong phiên này.' });
    return;
  }

  const existing = sqliteDb
    .prepare(`SELECT id FROM spiritual_bookings WHERE chair_id = ? AND user_id = ? AND status = 'pending'`)
    .get(id, user.id);
  if (existing) {
    res.status(400).json({ error: 'Bạn đã đăng ký ghế này trong hàng chờ rồi.' });
    return;
  }

  const risk = detectRisk(`${parsed.data.questionTopic} ${parsed.data.note}`);
  const hasExLoop = containsExLoopPattern(`${parsed.data.questionTopic} ${parsed.data.note}`);
  const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentBookingsCount = (
    sqliteDb
      .prepare(`SELECT COUNT(*) as cnt FROM spiritual_bookings WHERE user_id = ? AND created_at >= ?`)
      .get(user.id, dayAgoIso) as { cnt: number }
  ).cnt;

  // Section 4.4: Gentle reflection pause when repeating within 24h OR asking repeatedly about an ex
  if ((hasExLoop || recentBookingsCount >= 1) && !parsed.data.confirmAfterReflection) {
    res.status(409).json({
      code: 'REFLECTION_PAUSE_RECOMMENDED',
      suggestExUrgeFlow: hasExLoop,
      recentBookingsCount,
      error: hasExLoop
        ? 'Khi lòng còn nhiều xao động về người cũ, việc đặt thêm lượt xem liên tiếp dễ khiến bạn rối hơn. Bạn có muốn dừng lại 10 phút với công cụ "Tôi sắp nhắn cho người cũ" trước khi tiếp tục không?'
        : 'Bạn vừa đặt một phiên trong vòng 24 giờ qua. Để tránh lệ thuộc tinh thần hay tốn kém không cần thiết, Heali gợi ý bạn nghỉ ngơi và suy ngẫm thêm trước khi đặt tiếp.',
    });
    return;
  }

  // Only persist birthDate for specialties that genuinely use it (not pure Tarot)
  const storedBirthDate = chair.specialty === 'tarot' ? '' : parsed.data.birthDate.trim();
  const feeAmount = config.featurePaidSpiritual ? chair.seat_price : 0;
  const bookingId = `seat-${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();

  sqliteDb.exec('BEGIN');
  try {
    sqliteDb
      .prepare(`
        INSERT INTO spiritual_bookings (id, chair_id, user_id, viewer_name, birth_date, question_topic, note, fee_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `)
      .run(
        bookingId,
        chair.id,
        user.id,
        user.nickname,
        storedBirthDate,
        parsed.data.questionTopic.trim(),
        parsed.data.note.trim(),
        feeAmount,
        nowIso
      );
    sqliteDb
      .prepare('UPDATE spiritual_chairs SET booked_seats_count = booked_seats_count + 1 WHERE id = ?')
      .run(chair.id);
    sqliteDb.exec('COMMIT');
  } catch (err) {
    sqliteDb.exec('ROLLBACK');
    console.error('[Heali Spiritual] Booking error:', err);
    res.status(500).json({ error: 'Không thể giữ ghế lúc này.' });
    return;
  }

  const bRow = sqliteDb.prepare('SELECT * FROM spiritual_bookings WHERE id = ?').get(bookingId) as unknown as BookingRow;
  const cRow = sqliteDb.prepare('SELECT * FROM spiritual_chairs WHERE id = ?').get(chair.id) as unknown as ChairRow;
  res.status(201).json({
    booking: mapBooking(bRow),
    chair: mapChair(cRow),
    riskLevel: risk.level,
  });
});

// Complete booking session and immediately erase stored birthDate from server (Section 4.4)
spiritualRouter.patch('/bookings/:id/complete', authMiddleware, (req, res) => {
  const user = req.authUser!;
  const { id } = req.params;
  const booking = sqliteDb
    .prepare('SELECT * FROM spiritual_bookings WHERE id = ?')
    .get(id) as unknown as BookingRow | undefined;

  if (!booking) {
    res.status(404).json({ error: 'Không tìm thấy lượt đăng ký.' });
    return;
  }

  const chair = sqliteDb
    .prepare('SELECT owner_user_id FROM spiritual_chairs WHERE id = ?')
    .get(booking.chair_id) as { owner_user_id: string } | undefined;

  if (booking.user_id !== user.id && chair?.owner_user_id !== user.id) {
    res.status(403).json({ error: 'Bạn không có quyền hoàn tất lượt đăng ký này.' });
    return;
  }

  sqliteDb
    .prepare(`UPDATE spiritual_bookings SET status = 'completed', birth_date = '' WHERE id = ?`)
    .run(id);

  const updated = sqliteDb
    .prepare('SELECT * FROM spiritual_bookings WHERE id = ?')
    .get(id) as unknown as BookingRow;

  res.json({
    booking: mapBooking(updated),
    birthDateErased: true,
    message: 'Phiên đã hoàn tất và thông tin ngày sinh đã được xóa khỏi máy chủ.',
  });
});

spiritualRouter.post('/chairs/:id/subscribe-viewer', authMiddleware, (req, res) => {
  const user = req.authUser!;
  const { id } = req.params;
  const chair = sqliteDb.prepare('SELECT * FROM spiritual_chairs WHERE id = ?').get(id) as unknown as ChairRow | undefined;
  if (!chair) {
    res.status(404).json({ error: 'Không tìm thấy phòng/ghế xem.' });
    return;
  }

  const existing = sqliteDb
    .prepare('SELECT * FROM spiritual_viewer_passes WHERE chair_id = ? AND user_id = ?')
    .get(id, user.id) as unknown as PassRow | undefined;

  if (existing) {
    res.json({ pass: mapPass(existing), chair: mapChair(chair), alreadySubscribed: true });
    return;
  }

  const passId = `pass-${crypto.randomUUID()}`;
  const feeAmount = config.featurePaidSpiritual ? chair.viewer_ticket_price : 0;
  const nowIso = new Date().toISOString();

  sqliteDb.exec('BEGIN');
  try {
    sqliteDb
      .prepare(`
        INSERT INTO spiritual_viewer_passes (id, chair_id, user_id, viewer_name, fee_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(passId, chair.id, user.id, user.nickname, feeAmount, nowIso);
    sqliteDb
      .prepare('UPDATE spiritual_chairs SET viewer_count = viewer_count + 1 WHERE id = ?')
      .run(chair.id);
    sqliteDb.exec('COMMIT');
  } catch (err) {
    sqliteDb.exec('ROLLBACK');
    res.status(500).json({ error: 'Không thể đăng ký vé xem lúc này.' });
    return;
  }

  const passRow = sqliteDb.prepare('SELECT * FROM spiritual_viewer_passes WHERE id = ?').get(passId) as unknown as PassRow;
  const cRow = sqliteDb.prepare('SELECT * FROM spiritual_chairs WHERE id = ?').get(chair.id) as unknown as ChairRow;
  res.status(201).json({
    pass: mapPass(passRow),
    chair: mapChair(cRow),
    alreadySubscribed: false,
  });
});
