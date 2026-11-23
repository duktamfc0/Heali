import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { sqliteDb } from '../db/database.js';
import { authMiddleware, requirePinUnlocked } from '../middleware/auth.js';
import { decryptSensitiveText, encryptSensitiveText } from '../utils/crypto.js';
import { detectRisk } from '../../shared/riskDetector.js';

export const privateRouter = Router();

privateRouter.use(authMiddleware, requirePinUnlocked);

const createJournalSchema = z.object({
  date: z.string().max(20).optional(),
  moodScore: z.number().int().min(1).max(5).default(3),
  emotions: z.array(z.string().max(40)).max(8).optional().default([]),
  title: z.string().max(120).optional().default('Ghi chép tâm trạng'),
  content: z.string().trim().min(1, 'Nội dung nhật ký không được để trống').max(5000),
  gratitude: z.string().max(500).optional().default(''),
  selfCareAction: z.string().max(500).optional().default(''),
});

const createMoodCheckinSchema = z.object({
  date: z.string().max(20).optional(),
  moodScore: z.number().int().min(1).max(5),
  emotions: z.array(z.string().max(40)).max(8).optional().default([]),
  note: z.string().max(500).optional().default(''),
});

const createLetterSchema = z.object({
  recipient: z.enum(['ex', 'self', 'family', 'friend', 'someone']).default('ex'),
  recipientName: z.string().max(50).optional().default('Người từng thương'),
  title: z.string().max(120).optional().default('Lá thư viết cho ngày hôm qua'),
  content: z.string().trim().min(1, 'Nội dung thư không được để trống').max(6000),
  sealedUntil: z.string().max(32).nullable().optional(),
});

const sealLetterSchema = z.object({
  sealedUntil: z.string().min(4).max(32),
});

interface JournalRow {
  id: string;
  user_id: string;
  date: string;
  mood_score: number;
  emotions_json: string;
  title_enc: string;
  content_enc: string;
  gratitude_enc: string;
  self_care_action_enc: string;
  created_at: string;
}

interface LetterRow {
  id: string;
  user_id: string;
  recipient: string;
  recipient_name_enc: string;
  title_enc: string;
  content_enc: string;
  status: string;
  sealed_until: string | null;
  created_at: string;
}

function mapJournalRow(row: JournalRow) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    moodScore: row.mood_score,
    emotions: JSON.parse(row.emotions_json || '[]'),
    title: decryptSensitiveText(row.title_enc),
    content: decryptSensitiveText(row.content_enc),
    gratitude: decryptSensitiveText(row.gratitude_enc),
    selfCareAction: decryptSensitiveText(row.self_care_action_enc),
    createdAt: row.created_at,
  };
}

function mapLetterRow(row: LetterRow) {
  const isTimeSealed =
    Boolean(row.sealed_until) && new Date(row.sealed_until as string).getTime() > Date.now();
  return {
    id: row.id,
    userId: row.user_id,
    recipient: row.recipient,
    recipientName: decryptSensitiveText(row.recipient_name_enc),
    title: decryptSensitiveText(row.title_enc),
    content: isTimeSealed ? '' : decryptSensitiveText(row.content_enc),
    isTimeLocked: isTimeSealed,
    status: row.status,
    sealedUntil: row.sealed_until,
    burnedAt: null,
    createdAt: row.created_at,
  };
}

// --- Mood Check-ins (Real separate record, no auto-inserted journal entries) ---
privateRouter.get('/mood-checkins', (req, res) => {
  const userId = req.authUser!.id;
  const rows = sqliteDb
    .prepare('SELECT * FROM mood_checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 90')
    .all(userId) as Array<{
    id: string;
    date: string;
    mood_score: number;
    emotions_json: string;
    note_enc: string;
    created_at: string;
  }>;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const checkins = rows.map((r) => ({
    id: r.id,
    date: r.date,
    moodScore: r.mood_score,
    emotions: JSON.parse(r.emotions_json || '[]'),
    note: decryptSensitiveText(r.note_enc),
    createdAt: r.created_at,
  }));

  const journalWeeklyCount = (
    sqliteDb
      .prepare('SELECT COUNT(*) as cnt FROM journals WHERE user_id = ? AND created_at >= ?')
      .get(userId, new Date(sevenDaysAgo).toISOString()) as { cnt: number }
  ).cnt;

  const checkinWeeklyCount = checkins.filter(
    (c) => new Date(c.createdAt).getTime() >= sevenDaysAgo
  ).length;

  res.json({
    checkins,
    weeklySelfCareCount: checkinWeeklyCount + journalWeeklyCount,
  });
});

privateRouter.post('/mood-checkins', (req, res) => {
  const parsed = createMoodCheckinSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Dữ liệu tâm trạng không hợp lệ.' });
    return;
  }

  const userId = req.authUser!.id;
  const id = `mc-${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();
  const date = parsed.data.date || nowIso.split('T')[0];

  sqliteDb
    .prepare(`
      INSERT INTO mood_checkins (id, user_id, date, mood_score, emotions_json, note_enc, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      userId,
      date,
      parsed.data.moodScore,
      JSON.stringify(parsed.data.emotions),
      encryptSensitiveText(parsed.data.note.trim()),
      nowIso
    );

  const risk = parsed.data.note ? detectRisk(parsed.data.note) : null;
  res.status(201).json({
    checkin: {
      id,
      date,
      moodScore: parsed.data.moodScore,
      emotions: parsed.data.emotions,
      note: parsed.data.note.trim(),
      createdAt: nowIso,
    },
    riskLevel: risk?.level ?? (parsed.data.moodScore === 1 ? 1 : 0),
  });
});

// --- Private Encrypted Journals ---
privateRouter.get('/journal', (req, res) => {
  const userId = req.authUser!.id;
  const rows = sqliteDb
    .prepare('SELECT * FROM journals WHERE user_id = ? ORDER BY created_at DESC LIMIT 200')
    .all(userId) as unknown as JournalRow[];
  res.json({ entries: rows.map(mapJournalRow) });
});

privateRouter.post('/journal', (req, res) => {
  const parsed = createJournalSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dữ liệu nhật ký không hợp lệ.' });
    return;
  }

  const userId = req.authUser!.id;
  const id = `j-${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();
  const { date, moodScore, emotions, title, content, gratitude, selfCareAction } = parsed.data;
  const risk = detectRisk(`${title} ${content}`);

  sqliteDb
    .prepare(`
      INSERT INTO journals (id, user_id, date, mood_score, emotions_json, title_enc, content_enc, gratitude_enc, self_care_action_enc, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      userId,
      date || nowIso.split('T')[0],
      moodScore,
      JSON.stringify(emotions.slice(0, 8)),
      encryptSensitiveText(title.trim().slice(0, 120) || 'Ghi chép tâm trạng'),
      encryptSensitiveText(content.trim().slice(0, 5000)),
      encryptSensitiveText(gratitude.trim().slice(0, 500)),
      encryptSensitiveText(selfCareAction.trim().slice(0, 500)),
      nowIso
    );

  const row = sqliteDb.prepare('SELECT * FROM journals WHERE id = ?').get(id) as unknown as JournalRow;
  res.status(201).json({
    entry: mapJournalRow(row),
    riskLevel: risk.level,
  });
});

privateRouter.delete('/journal/:id', (req, res) => {
  const userId = req.authUser!.id;
  const { id } = req.params;
  const result = sqliteDb
    .prepare('DELETE FROM journals WHERE id = ? AND user_id = ?')
    .run(id, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Không tìm thấy trang nhật ký.' });
    return;
  }
  res.json({ success: true, message: 'Đã xóa nhật ký.' });
});

// --- Private Encrypted Unsent Letters (Burn = Permanent Erasure!) ---
privateRouter.get('/letters', (req, res) => {
  const userId = req.authUser!.id;
  const rows = sqliteDb
    .prepare('SELECT * FROM unsent_letters WHERE user_id = ? ORDER BY created_at DESC LIMIT 200')
    .all(userId) as unknown as LetterRow[];
  res.json({ letters: rows.map(mapLetterRow) });
});

privateRouter.post('/letters', (req, res) => {
  const parsed = createLetterSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dữ liệu thư không hợp lệ.' });
    return;
  }

  const userId = req.authUser!.id;
  const id = `ltr-${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();
  const { recipient, recipientName, title, content, sealedUntil } = parsed.data;
  const risk = detectRisk(`${title} ${content}`);

  sqliteDb
    .prepare(`
      INSERT INTO unsent_letters (id, user_id, recipient, recipient_name_enc, title_enc, content_enc, status, sealed_until, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'sealed', ?, ?)
    `)
    .run(
      id,
      userId,
      recipient,
      encryptSensitiveText(recipientName.trim().slice(0, 50) || 'Người từng thương'),
      encryptSensitiveText(title.trim().slice(0, 120) || 'Lá thư viết cho ngày hôm qua'),
      encryptSensitiveText(content.trim().slice(0, 6000)),
      sealedUntil || null,
      nowIso
    );

  const row = sqliteDb.prepare('SELECT * FROM unsent_letters WHERE id = ?').get(id) as unknown as LetterRow;
  res.status(201).json({
    letter: mapLetterRow(row),
    riskLevel: risk.level,
  });
});

// Seal a letter until a future date (non-destructive option alongside permanent burn)
privateRouter.patch('/letters/:id/seal', (req, res) => {
  const parsed = sealLetterSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Ngày mở lại không hợp lệ.' });
    return;
  }

  const userId = req.authUser!.id;
  const { id } = req.params;
  const targetDate = new Date(parsed.data.sealedUntil);
  if (Number.isNaN(targetDate.getTime()) || targetDate.getTime() <= Date.now()) {
    res.status(400).json({ error: 'Vui lòng chọn ngày trong tương lai.' });
    return;
  }

  const resUpdate = sqliteDb
    .prepare('UPDATE unsent_letters SET sealed_until = ? WHERE id = ? AND user_id = ?')
    .run(targetDate.toISOString(), id, userId);

  if (resUpdate.changes === 0) {
    res.status(404).json({ error: 'Không tìm thấy lá thư.' });
    return;
  }

  const row = sqliteDb.prepare('SELECT * FROM unsent_letters WHERE id = ?').get(id) as unknown as LetterRow;
  res.json({ letter: mapLetterRow(row) });
});

// True Burn & Release: OVERWRITE and PERMANENTLY DELETE record from database!
privateRouter.patch('/letters/:id/burn', (req, res) => {
  const userId = req.authUser!.id;
  const { id } = req.params;

  const existing = sqliteDb
    .prepare('SELECT id FROM unsent_letters WHERE id = ? AND user_id = ?')
    .get(id, userId) as { id: string } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Không tìm thấy lá thư.' });
    return;
  }

  sqliteDb.exec('BEGIN');
  try {
    // Overwrite sensitive columns cleanly before deleting row
    sqliteDb
      .prepare(`
        UPDATE unsent_letters
        SET recipient_name_enc = '', title_enc = '', content_enc = ''
        WHERE id = ? AND user_id = ?
      `)
      .run(id, userId);

    sqliteDb
      .prepare('DELETE FROM unsent_letters WHERE id = ? AND user_id = ?')
      .run(id, userId);

    sqliteDb.exec('COMMIT');
  } catch (err) {
    sqliteDb.exec('ROLLBACK');
    console.error('[Heali Burn] Failed true-erase burn:', err);
    res.status(500).json({ error: 'Không thể hoàn tất xoá thư lúc này.' });
    return;
  }

  // Neutral Section 5 copy — no toxic positivity or assumed relief
  res.json({
    erasedId: id,
    erasedPermanently: true,
    message:
      'Lá thư đã không còn lưu ở đây. Bạn không cần thấy nhẹ nhõm ngay. Có thể cần thêm thời gian, và như vậy cũng ổn.',
  });
});

privateRouter.delete('/letters/:id', (req, res) => {
  const userId = req.authUser!.id;
  const { id } = req.params;
  const result = sqliteDb
    .prepare('DELETE FROM unsent_letters WHERE id = ? AND user_id = ?')
    .run(id, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Không tìm thấy lá thư.' });
    return;
  }

  res.json({ success: true, message: 'Đã xóa lá thư vĩnh viễn.' });
});
