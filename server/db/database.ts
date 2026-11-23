import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';
import { encryptSensitiveText, hashToken } from '../utils/crypto.js';

if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

export const sqliteDb = new DatabaseSync(config.dbPath);

// Configure reliable concurrency & relational safety
sqliteDb.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

// Schema Creation & Indexes
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    token_hash TEXT UNIQUE NOT NULL,
    token_expires_at TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT 'heart',
    status_message TEXT NOT NULL DEFAULT '',
    pin_hash TEXT,
    recovery_code_hash TEXT,
    pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
    pin_locked_until TEXT,
    blocked_user_ids_json TEXT NOT NULL DEFAULT '[]',
    reported_post_ids_json TEXT NOT NULL DEFAULT '[]',
    is_banned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_token_hash ON users(token_hash);

  CREATE TABLE IF NOT EXISTS pin_unlock_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_pin_sessions_user ON pin_unlock_sessions(user_id);

  CREATE TABLE IF NOT EXISTS confessions (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_nickname TEXT NOT NULL,
    author_avatar TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood_tag TEXT NOT NULL,
    is_trigger_warning INTEGER NOT NULL DEFAULT 0,
    reactions_json TEXT NOT NULL,
    user_reactions_json TEXT NOT NULL,
    report_count INTEGER NOT NULL DEFAULT 0,
    is_moderated INTEGER NOT NULL DEFAULT 0,
    moderation_status TEXT NOT NULL DEFAULT 'approved',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_confessions_created ON confessions(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_confessions_status ON confessions(moderation_status, is_moderated);

  CREATE TABLE IF NOT EXISTS moderation_queue (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    reporter_user_id TEXT,
    reason TEXT NOT NULL,
    risk_level INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewer_note TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_mod_queue_status ON moderation_queue(status, created_at DESC);

  CREATE TABLE IF NOT EXISTS lanterns (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_nickname TEXT NOT NULL,
    message TEXT NOT NULL,
    color TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    ripples INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wishes (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_nickname TEXT NOT NULL,
    wish_text TEXT NOT NULL,
    action_commitment TEXT NOT NULL,
    tag TEXT NOT NULL,
    supports INTEGER NOT NULL DEFAULT 1,
    user_supports_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS journals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    mood_score INTEGER NOT NULL,
    emotions_json TEXT NOT NULL DEFAULT '[]',
    title_enc TEXT NOT NULL,
    content_enc TEXT NOT NULL,
    gratitude_enc TEXT NOT NULL DEFAULT '',
    self_care_action_enc TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_journals_user ON journals(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS mood_checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    mood_score INTEGER NOT NULL,
    emotions_json TEXT NOT NULL DEFAULT '[]',
    note_enc TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_mood_checkins_user ON mood_checkins(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS unsent_letters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipient TEXT NOT NULL,
    recipient_name_enc TEXT NOT NULL,
    title_enc TEXT NOT NULL,
    content_enc TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sealed',
    sealed_until TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_letters_user ON unsent_letters(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS lounge_messages (
    id TEXT PRIMARY KEY,
    client_msg_id TEXT,
    sender_id TEXT NOT NULL,
    sender_socket_id TEXT,
    sender_alias TEXT NOT NULL,
    sender_avatar TEXT NOT NULL,
    topic_tag TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS music_habits (
    user_id TEXT PRIMARY KEY,
    habit_json TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS saved_music_tracks (
    id TEXT PRIMARY KEY,
    track_json TEXT NOT NULL,
    added_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS spiritual_chairs (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    host_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT NOT NULL,
    seat_price INTEGER NOT NULL DEFAULT 0,
    viewer_ticket_price INTEGER NOT NULL DEFAULT 0,
    max_seats INTEGER NOT NULL DEFAULT 6,
    booked_seats_count INTEGER NOT NULL DEFAULT 0,
    viewer_count INTEGER NOT NULL DEFAULT 0,
    is_live INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS spiritual_bookings (
    id TEXT PRIMARY KEY,
    chair_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    viewer_name TEXT NOT NULL,
    birth_date TEXT NOT NULL DEFAULT '',
    question_topic TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    fee_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS spiritual_viewer_passes (
    id TEXT PRIMARY KEY,
    chair_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    viewer_name TEXT NOT NULL,
    fee_amount INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_config (
    id TEXT PRIMARY KEY,
    passcode_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    moderator_alias TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS moderator_shifts (
    id TEXT PRIMARY KEY,
    moderator_alias TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    sla_target_minutes INTEGER NOT NULL DEFAULT 15,
    note TEXT NOT NULL DEFAULT '',
    started_at TEXT NOT NULL,
    ended_at TEXT
  );

  CREATE TABLE IF NOT EXISTS moderation_audit_logs (
    id TEXT PRIMARY KEY,
    queue_item_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    action TEXT NOT NULL,
    moderator_alias TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON moderation_audit_logs(created_at DESC);

  CREATE TABLE IF NOT EXISTS shared_lantern_gifts (
    id TEXT PRIMARY KEY,
    sender_user_id TEXT NOT NULL,
    sender_display_name TEXT NOT NULL DEFAULT '',
    show_sender_name INTEGER NOT NULL DEFAULT 0,
    message TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'gold',
    expires_at TEXT NOT NULL,
    is_opted_out INTEGER NOT NULL DEFAULT 0,
    reply_message TEXT NOT NULL DEFAULT '',
    reply_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_lantern_gifts_sender ON shared_lantern_gifts(sender_user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_lantern_gifts_expires ON shared_lantern_gifts(expires_at);

  CREATE TABLE IF NOT EXISTS healthy_metric_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    value_ms INTEGER,
    day_bucket TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_healthy_metrics_day ON healthy_metric_events(day_bucket DESC, event_type);

  CREATE TABLE IF NOT EXISTS beta_feedback (
    id TEXT PRIMARY KEY,
    note TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_companion_usage (
    user_id TEXT NOT NULL,
    day_bucket TEXT NOT NULL,
    turns_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, day_bucket),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS organization_inquiries (
    id TEXT PRIMARY KEY,
    org_name TEXT NOT NULL,
    org_type TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_person TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
`);

function ensureSchemaMigrations() {
  const userCols = sqliteDb.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (!userCols.some((c) => c.name === 'is_banned')) {
    sqliteDb.exec('ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0');
  }
}

ensureSchemaMigrations();

function seedInitialDataIfEmpty() {
  const confCount = (sqliteDb.prepare('SELECT COUNT(*) as cnt FROM confessions').get() as { cnt: number }).cnt;
  if (confCount === 0) {
    const insertConf = sqliteDb.prepare(`
      INSERT INTO confessions (id, author_id, author_nickname, author_avatar, category, title, content, mood_tag, is_trigger_warning, reactions_json, user_reactions_json, report_count, is_moderated, moderation_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'approved', ?)
    `);
    const sampleConfessions = [
      [
        'c-1',
        'system-seed-1',
        'Đốm Đèn Ban Đêm',
        'sparkles',
        'breakup',
        'Hôm nay trời đổ mưa, mình đã không còn nhắn tin cho người ấy nữa',
        'Bốn năm thanh xuân, từng nghĩ sẽ đi cùng nhau rất lâu. Nhưng rồi cuộc chia tay khép lại bằng một buổi chiều im lặng. Hôm nay mình đi qua con phố quen, nghe quán cà phê mở bài hát cũ. Vẫn có chút nhói ở lồng ngực, nhưng mình đã ngồi yên hết ly trà mà không nhắn tin nữa.',
        'Nhói lòng',
        0,
        JSON.stringify({ hug: 48, listen: 29, not_alone: 63, peace: 41, strength: 37 }),
        JSON.stringify({}),
        new Date(Date.now() - 3600000 * 4).toISOString(),
      ],
      [
        'c-2',
        'system-seed-2',
        'Chiếc Lá Ven Đường',
        'leaf',
        'loneliness',
        'Sống một mình giữa thành phố tấp nập, đôi khi chỉ thèm một cái ôm',
        'Tan làm lúc 8 giờ tối, tự đi siêu thị mua gói mì, về căn phòng trọ 20 mét vuông bật đèn vàng. Không ai hỏi hôm nay đi làm mệt không. Có những ngày thấy nặng nề vì phải tự lo tất cả.',
        'Cô đơn',
        0,
        JSON.stringify({ hug: 82, listen: 44, not_alone: 95, peace: 53, strength: 66 }),
        JSON.stringify({}),
        new Date(Date.now() - 3600000 * 12).toISOString(),
      ],
      [
        'c-3',
        'system-seed-3',
        'Gió Đêm Dịu Dàng',
        'moon',
        'family',
        'Khoảng cách thế hệ với bố mẹ, muốn thương mà khó giãi bày',
        'Mỗi lần về quê chỉ được hai hôm là lại nảy sinh tranh cãi. Mình biết bố mẹ thương mình, chỉ là cách thể hiện khiến hai bên đều mệt mỏi.',
        'Trầm tư',
        0,
        JSON.stringify({ hug: 34, listen: 22, not_alone: 47, peace: 31, strength: 29 }),
        JSON.stringify({}),
        new Date(Date.now() - 3600000 * 20).toISOString(),
      ],
    ];
    for (const row of sampleConfessions) {
      insertConf.run(...row);
    }
  }

  const lanternCount = (sqliteDb.prepare('SELECT COUNT(*) as cnt FROM lanterns').get() as { cnt: number }).cnt;
  if (lanternCount === 0) {
    const insertLantern = sqliteDb.prepare(`
      INSERT INTO lanterns (id, author_id, author_nickname, message, color, x, y, ripples, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertLantern.run('l-1', 'system', 'Người Bạn Đồng Hành', 'Mong cho tối nay ai đang nặng lòng cũng có được một giấc ngủ yên.', 'gold', 28, 45, 12, new Date(Date.now() - 3000000).toISOString());
    insertLantern.run('l-2', 'system', 'Cỏ Dại', 'Cho phép bản thân được chậm lại một chút sau những ngày mệt.', 'pink', 65, 55, 18, new Date(Date.now() - 7200000).toISOString());
    insertLantern.run('l-3', 'system', 'Trăng Mười Sáu', 'Gửi một lời chúc bình an đến người nhà ở quê.', 'moon', 48, 35, 9, new Date(Date.now() - 11400000).toISOString());
  }

  const wishCount = (sqliteDb.prepare('SELECT COUNT(*) as cnt FROM wishes').get() as { cnt: number }).cnt;
  if (wishCount === 0) {
    const insertWish = sqliteDb.prepare(`
      INSERT INTO wishes (id, author_id, author_nickname, wish_text, action_commitment, tag, supports, user_supports_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?)
    `);
    insertWish.run(
      'w-1',
      'system',
      'Cây Bàng Nhỏ',
      'Mong mình bớt khắt khe với bản thân trong những ngày yếu lòng.',
      'Hôm nay mình sẽ đi bộ 20 phút và không vào xem trang cá nhân của người cũ.',
      'letting_go',
      14,
      new Date(Date.now() - 3600000 * 8).toISOString()
    );
    insertWish.run(
      'w-2',
      'system',
      'Mây Hồng',
      'Học cách chăm sóc giấc ngủ và ăn uống điều độ trở lại.',
      'Tối nay tắt điện thoại trước 23h và nghe tiếng mưa rơi.',
      'self_love',
      21,
      new Date(Date.now() - 3600000 * 14).toISOString()
    );
  }

  const loungeCount = (sqliteDb.prepare('SELECT COUNT(*) as cnt FROM lounge_messages').get() as { cnt: number }).cnt;
  if (loungeCount === 0) {
    sqliteDb.prepare(`
      INSERT INTO lounge_messages (id, client_msg_id, sender_id, sender_socket_id, sender_alias, sender_avatar, topic_tag, text, created_at)
      VALUES (?, NULL, ?, NULL, ?, ?, ?, ?, ?)
    `).run(
      'lounge-seed-1',
      'system-seed-1',
      'Gió Đêm Dịu Dàng',
      'leaf',
      'Chào bạn mới',
      'Chào mừng bạn ghé vào phòng trà. Ở đây mọi người giữ thái độ tôn trọng, ẩn danh và không trao đổi thông tin liên hệ cá nhân.',
      new Date(Date.now() - 1080000).toISOString()
    );
  }

  const chairCount = (sqliteDb.prepare('SELECT COUNT(*) as cnt FROM spiritual_chairs').get() as { cnt: number }).cnt;
  if (chairCount === 0) {
    const insertChair = sqliteDb.prepare(`
      INSERT INTO spiritual_chairs (id, owner_user_id, host_name, specialty, title, bio, seat_price, viewer_ticket_price, max_seats, booked_seats_count, viewer_count, is_live, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertChair.run(
      'chair-tarot-1',
      'system-host-1',
      'Cố Vấn Mộc Trà',
      'tarot',
      'Ghế Trải Bài Tarot Soi Chiếu & Tình Cảm',
      'Không gian phản chiếu nội tâm qua 3 lá bài Tarot, đặt câu hỏi mở để nhìn rõ điều bạn đang trăn trở (mang tính tham khảo & giải trí, không thay thế tư vấn tâm lý).',
      0,
      0,
      8,
      0,
      0,
      1,
      new Date(Date.now() - 3600000 * 3).toISOString()
    );
    insertChair.run(
      'chair-num-3',
      'system-host-3',
      'An Nhiên Số Học',
      'numerology',
      'Ghế Chiêm Nghiệm Con Số & Nhịp Sống',
      'Cùng trò chuyện về chu kỳ cảm xúc cá nhân và thói quen chăm sóc bản thân hằng ngày.',
      0,
      0,
      10,
      0,
      0,
      1,
      '2025-05-01T00:00:00.000Z'
    );
  }

  const shiftCount = (sqliteDb.prepare('SELECT COUNT(*) as cnt FROM moderator_shifts').get() as { cnt: number }).cnt;
  if (shiftCount === 0) {
    sqliteDb
      .prepare(`
        INSERT INTO moderator_shifts (id, moderator_alias, status, sla_target_minutes, note, started_at, ended_at)
        VALUES (?, ?, 'active', 15, ?, ?, NULL)
      `)
      .run(
        'shift-initial',
        'Điều phối viên Heali',
        'Ca trực kiểm duyệt mặc định đang hoạt động cho thử nghiệm cộng đồng.',
        new Date().toISOString()
      );
  }
}

function migrateLegacyJsonIfPresent() {
  if (!fs.existsSync(config.legacyJsonDbPath)) return;
  try {
    const raw = fs.readFileSync(config.legacyJsonDbPath, 'utf-8');
    const legacy = JSON.parse(raw) as {
      users?: Array<{
        id: string;
        token: string;
        nickname: string;
        avatar: string;
        statusMessage: string;
        blockedUserIds?: string[];
        reportedPostIds?: string[];
        createdAt: string;
      }>;
      journals?: Array<{
        id: string;
        userId: string;
        date: string;
        moodScore: number;
        emotions: string[];
        title: string;
        content: string;
        gratitude: string;
        selfCareAction: string;
        createdAt: string;
      }>;
      unsentLetters?: Array<{
        id: string;
        userId: string;
        recipient: string;
        recipientName: string;
        title: string;
        content: string;
        status: string;
        createdAt: string;
      }>;
    };

    const userCount = (sqliteDb.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
    if (userCount === 0 && Array.isArray(legacy.users)) {
      const expiresAt = new Date(Date.now() + config.sessionTtlMs).toISOString();
      const insertUser = sqliteDb.prepare(`
        INSERT OR IGNORE INTO users (id, token_hash, token_expires_at, nickname, avatar, status_message, pin_hash, blocked_user_ids_json, reported_post_ids_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
      `);
      for (const u of legacy.users) {
        insertUser.run(
          u.id,
          hashToken(u.token),
          expiresAt,
          u.nickname || 'Bạn Lữ Hành',
          u.avatar || 'heart',
          u.statusMessage || '',
          JSON.stringify(u.blockedUserIds || []),
          JSON.stringify(u.reportedPostIds || []),
          u.createdAt || new Date().toISOString()
        );
      }

      if (Array.isArray(legacy.journals)) {
        const insertJ = sqliteDb.prepare(`
          INSERT OR IGNORE INTO journals (id, user_id, date, mood_score, emotions_json, title_enc, content_enc, gratitude_enc, self_care_action_enc, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const j of legacy.journals) {
          insertJ.run(
            j.id,
            j.userId,
            j.date,
            j.moodScore,
            JSON.stringify(j.emotions || []),
            encryptSensitiveText(j.title || ''),
            encryptSensitiveText(j.content || ''),
            encryptSensitiveText(j.gratitude || ''),
            encryptSensitiveText(j.selfCareAction || ''),
            j.createdAt || new Date().toISOString()
          );
        }
      }

      if (Array.isArray(legacy.unsentLetters)) {
        const insertL = sqliteDb.prepare(`
          INSERT OR IGNORE INTO unsent_letters (id, user_id, recipient, recipient_name_enc, title_enc, content_enc, status, sealed_until, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
        `);
        for (const l of legacy.unsentLetters) {
          // Do not migrate already-burned letters so they stay truly erased!
          if (l.status === 'burned_released') continue;
          insertL.run(
            l.id,
            l.userId,
            l.recipient || 'ex',
            encryptSensitiveText(l.recipientName || ''),
            encryptSensitiveText(l.title || ''),
            encryptSensitiveText(l.content || ''),
            'sealed',
            l.createdAt || new Date().toISOString()
          );
        }
      }
    }

    // Remove legacy JSON test database file as mandated by Section 6.1
    fs.unlinkSync(config.legacyJsonDbPath);
  } catch (err) {
    console.error('[Heali DB] Legacy JSON migration skipped/error:', err);
  }
}

migrateLegacyJsonIfPresent();
seedInitialDataIfEmpty();

export function createDailyBackupIfNeeded(): void {
  try {
    const backupDir = `${config.dataDir}/backups`;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const todayTag = new Date().toISOString().slice(0, 10);
    const targetFile = `${backupDir}/heali-${todayTag}.db`;
    if (!fs.existsSync(targetFile)) {
      const escaped = targetFile.replace(/'/g, "''");
      sqliteDb.exec(`VACUUM INTO '${escaped}'`);
    }
    // Keep only the 7 most recent daily backups so burned/deleted data is purged across backups as well
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('heali-') && f.endsWith('.db'))
      .sort()
      .reverse();
    for (const stale of files.slice(7)) {
      fs.unlinkSync(`${backupDir}/${stale}`);
    }
  } catch (err) {
    console.error('[Heali DB] Backup warning:', err);
  }
}

export function verifyBackupAndRestore(backupFilePath: string, restoreTargetPath: string): {
  backupExists: boolean;
  integrityCheckOk: boolean;
  restoredConfessionsCount: number;
} {
  const escapedBackup = backupFilePath.replace(/'/g, "''");
  sqliteDb.exec(`VACUUM INTO '${escapedBackup}'`);
  const backupExists = fs.existsSync(backupFilePath);
  if (!backupExists) {
    return { backupExists: false, integrityCheckOk: false, restoredConfessionsCount: 0 };
  }

  fs.copyFileSync(backupFilePath, restoreTargetPath);
  const restoredDb = new DatabaseSync(restoreTargetPath);
  try {
    const checkRow = restoredDb.prepare('PRAGMA integrity_check').get() as { integrity_check: string } | undefined;
    const countRow = restoredDb.prepare('SELECT COUNT(*) as cnt FROM confessions').get() as { cnt: number };
    return {
      backupExists: true,
      integrityCheckOk: checkRow?.integrity_check === 'ok',
      restoredConfessionsCount: countRow.cnt,
    };
  } finally {
    restoredDb.close();
  }
}

createDailyBackupIfNeeded();
