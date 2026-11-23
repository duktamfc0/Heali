import { Router } from 'express';
import { sqliteDb } from '../db/database.js';
import { authMiddleware, extractBearerToken, findUserByRawToken } from '../middleware/auth.js';

export const musicRouter = Router();

interface AudiusTrackRaw {
  id: string;
  title?: string;
  duration?: number;
  genre?: string;
  mood?: string;
  tags?: string;
  is_streamable?: boolean;
  artwork?: { '150x150'?: string; '480x480'?: string };
  user?: { name?: string };
}

interface SoundCloudTranscoding {
  url: string;
  preset?: string;
  format?: { protocol?: string; mime_type?: string };
}

interface SoundCloudTrackRaw {
  id: number;
  title?: string;
  duration?: number;
  genre?: string;
  tag_list?: string;
  permalink_url?: string;
  artwork_url?: string | null;
  streamable?: boolean;
  media?: { transcodings?: SoundCloudTranscoding[] };
  user?: { username?: string; avatar_url?: string | null };
}

export interface DiscoveredMusicTrack {
  id: string;
  title: string;
  artist: string;
  mood: string;
  tag: string;
  sourceLabel: string;
  sourceUrl: string;
  license: string;
  licenseType: 'cc0' | 'cc_by' | 'third_party_stream' | 'user_local';
  licenseUrl: string;
  attribution: string;
  termsNotice?: string;
  isOfflineCurated?: boolean;
  audioUrl: string;
  artworkUrl?: string;
  durationHint: string;
  provider?: 'soundcloud' | 'audius';
  soundcloudId?: string;
  isOnline: boolean;
}

interface SavedMusicTrack extends DiscoveredMusicTrack {
  provider: 'soundcloud' | 'audius';
  searchQuery?: string;
  addedByUserId?: string;
  addedAt: string;
}

interface UserMusicHabit {
  playCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  timeSlots: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  recentTracks: Array<{
    trackId: string;
    title: string;
    artist: string;
    tag: string;
    category: string;
    playedAt: string;
  }>;
  recentSearches: string[];
}

const MUSIC_CATEGORY_QUERIES: Record<string, { query: string; tag: string; mood: string }> = {
  recommended: { query: 'healing meditation piano', tag: 'Đề xuất thư giãn', mood: 'Dịu êm & thư thái' },
  piano: { query: 'relaxing piano', tag: 'Piano Dịu Êm', mood: 'Nhẹ nhàng & sâu lắng' },
  ambient: { query: 'calm ambient', tag: 'Ambient Tĩnh Tại', mood: 'Khoáng đạt & bình yên' },
  sleep: { query: 'sleep rain ambient', tag: 'Mưa & Ngủ Ngon', mood: 'Ru giấc êm đềm' },
  lofi: { query: 'chill lofi', tag: 'Lo-Fi Nhẹ Nhàng', mood: 'Thư giãn & tập trung' },
  '432hz': { query: '432hz healing', tag: 'Tần Số 432Hz', mood: 'Cân bằng & thả lỏng' },
};

const BLOCKED_HEALING_GENRES = new Set([
  'hip-hop/rap',
  'metal',
  'punk',
  'dubstep',
  'trap',
  'hardstyle',
  'techno',
  'drum & bass',
]);

const musicCatalogCache = new Map<string, { expiresAt: number; tracks: DiscoveredMusicTrack[] }>();
let cachedScClientId: string | null = process.env.SOUNDCLOUD_CLIENT_ID || null;
let cachedScClientIdExpiry = cachedScClientId ? Date.now() + 24 * 3600 * 1000 : 0;

async function getSoundCloudClientId(forceRefresh = false): Promise<string | null> {
  if (process.env.SOUNDCLOUD_CLIENT_ID) return process.env.SOUNDCLOUD_CLIENT_ID;
  if (!forceRefresh && cachedScClientId && Date.now() < cachedScClientIdExpiry) {
    return cachedScClientId;
  }

  try {
    const homeRes = await fetch('https://soundcloud.com/discover', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!homeRes.ok) return cachedScClientId;

    const html = await homeRes.text();
    const scriptMatches = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(
      (m) => m[1]
    );

    for (const jsUrl of scriptMatches.slice(-6).reverse()) {
      try {
        const jsRes = await fetch(jsUrl, { signal: AbortSignal.timeout(6000) });
        if (!jsRes.ok) continue;
        const jsText = await jsRes.text();
        const match =
          jsText.match(/client_id\s*:\s*"([a-zA-Z0-9]{20,40})"/) ||
          jsText.match(/client_id=([a-zA-Z0-9]{20,40})/);
        if (match && match[1]) {
          cachedScClientId = match[1];
          cachedScClientIdExpiry = Date.now() + 6 * 3600 * 1000;
          return cachedScClientId;
        }
      } catch {
        // try next bundle
      }
    }
  } catch (err) {
    console.error('SoundCloud client_id extraction warning:', err);
  }
  return cachedScClientId;
}

function isAllowedSoundCloudMediaUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith('.soundcloud.cloud') ||
      host.endsWith('.sndcdn.com') ||
      host === 'api-v2.soundcloud.com'
    );
  } catch {
    return false;
  }
}

function formatTrackDuration(seconds?: number): string {
  const secs = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function searchSoundCloudTracks(
  searchQuery: string,
  category: string,
  isCustomSearch: boolean
): Promise<DiscoveredMusicTrack[]> {
  let clientId = await getSoundCloudClientId(false);
  if (!clientId) return [];

  const doSearch = async (cid: string) =>
    fetch(
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(searchQuery)}&client_id=${encodeURIComponent(cid)}&limit=15`,
      { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    );

  let res = await doSearch(clientId);
  if (res.status === 401 || res.status === 403) {
    clientId = await getSoundCloudClientId(true);
    if (!clientId) return [];
    res = await doSearch(clientId);
  }
  if (!res.ok) return [];

  const payload = (await res.json()) as { collection?: SoundCloudTrackRaw[] };
  const collection = Array.isArray(payload?.collection) ? payload.collection : [];
  const meta = MUSIC_CATEGORY_QUERIES[category] || MUSIC_CATEGORY_QUERIES.recommended;
  const tracks: DiscoveredMusicTrack[] = [];
  const seen = new Set<number>();

  for (const item of collection) {
    if (!item || typeof item.id !== 'number' || !item.title || seen.has(item.id) || item.streamable === false) continue;
    const transcodings = item.media?.transcodings || [];
    const hasProgressive = transcodings.some((t) => t.format?.protocol === 'progressive');
    const hasHls = transcodings.some((t) => t.format?.protocol === 'hls');
    if (!hasProgressive && !hasHls) continue;

    const durSecs = Math.round((item.duration || 0) / 1000);
    if (durSecs < 20 || durSecs > 14400) continue;
    if (!isCustomSearch && BLOCKED_HEALING_GENRES.has((item.genre || '').toLowerCase())) continue;

    seen.add(item.id);
    const artworkRaw = item.artwork_url || item.user?.avatar_url || undefined;
    tracks.push({
      id: `sc-${item.id}`,
      soundcloudId: String(item.id),
      title: item.title.trim().slice(0, 100),
      artist: (item.user?.username || 'Nghệ sĩ SoundCloud').trim().slice(0, 60),
      mood: item.genre?.trim() || meta.mood,
      tag: isCustomSearch ? item.genre?.trim() || 'SoundCloud' : meta.tag,
      sourceLabel: 'SoundCloud · Trực tuyến',
      sourceUrl: item.permalink_url || 'https://soundcloud.com',
      license: 'SoundCloud External Stream',
      licenseType: 'third_party_stream',
      licenseUrl: item.permalink_url || 'https://soundcloud.com/terms-of-use',
      attribution: `${(item.user?.username || 'Nghệ sĩ SoundCloud').trim().slice(0, 60)} via SoundCloud`,
      termsNotice: 'Phát trực tiếp từ nguồn bên thứ ba; tuân theo điều khoản sử dụng của nghệ sĩ và SoundCloud.',
      isOfflineCurated: false,
      audioUrl: hasProgressive
        ? `/api/music/soundcloud/audio/${item.id}`
        : `/api/music/soundcloud/playlist/${item.id}.m3u8`,
      artworkUrl: artworkRaw ? artworkRaw.replace('-large.', '-t300x300.') : undefined,
      durationHint: formatTrackDuration(durSecs),
      provider: 'soundcloud',
      isOnline: true,
    });
    if (tracks.length >= 10) break;
  }
  return tracks;
}

async function searchAudiusTracks(
  searchQuery: string,
  category: string,
  isCustomSearch: boolean
): Promise<DiscoveredMusicTrack[]> {
  const endpoint = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(searchQuery)}&app_name=HealiApp`;
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/json', 'User-Agent': 'HealiApp/1.0' },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { data?: AudiusTrackRaw[] };
  const rawTracks = Array.isArray(payload?.data) ? payload.data : [];
  const filtered: DiscoveredMusicTrack[] = [];
  const seenIds = new Set<string>();
  const meta = MUSIC_CATEGORY_QUERIES[category] || MUSIC_CATEGORY_QUERIES.recommended;

  for (const item of rawTracks) {
    if (!item || typeof item.id !== 'string' || !item.title || seenIds.has(item.id) || item.is_streamable === false) continue;
    const dur = Number(item.duration || 0);
    if (dur < 30 || dur > 2700) continue;
    if (!isCustomSearch) {
      if (BLOCKED_HEALING_GENRES.has((item.genre || '').toLowerCase())) continue;
      if (/explicit|diss|remix|club|hardcore|phonk|drill/i.test(item.title)) continue;
    }
    seenIds.add(item.id);
    filtered.push({
      id: `audius-${item.id}`,
      title: item.title.trim().slice(0, 92),
      artist: (item.user?.name || 'Nghệ sĩ Audius').trim().slice(0, 50),
      mood: item.mood?.trim() || meta.mood,
      tag: isCustomSearch ? item.genre?.trim() || 'Tìm kiếm trực tuyến' : meta.tag,
      sourceLabel: 'Audius · Trực tuyến',
      sourceUrl: 'https://audius.co',
      license: 'Audius Open Stream',
      licenseType: 'third_party_stream',
      licenseUrl: 'https://audius.co/legal/terms-of-use',
      attribution: `${(item.user?.name || 'Nghệ sĩ Audius').trim().slice(0, 50)} via Audius`,
      termsNotice: 'Phát trực tiếp từ kho mở Audius; tuân theo điều khoản nghệ sĩ phát hành.',
      isOfflineCurated: false,
      audioUrl: `https://api.audius.co/v1/tracks/${encodeURIComponent(item.id)}/stream?app_name=HealiApp`,
      artworkUrl: item.artwork?.['150x150'] || item.artwork?.['480x480'],
      durationHint: formatTrackDuration(dur),
      provider: 'audius',
      isOnline: true,
    });
    if (filtered.length >= 10) break;
  }
  return filtered;
}

function getAllSavedTracksFromDb(): SavedMusicTrack[] {
  const rows = sqliteDb
    .prepare('SELECT track_json FROM saved_music_tracks ORDER BY added_at DESC LIMIT 80')
    .all() as Array<{ track_json: string }>;
  return rows.map((r) => JSON.parse(r.track_json) as SavedMusicTrack);
}

function upsertSavedTracksToDb(
  tracks: DiscoveredMusicTrack[],
  searchQuery: string,
  userId?: string
): { savedTracks: SavedMusicTrack[]; autoAddedCount: number } {
  const existingRows = sqliteDb.prepare('SELECT id FROM saved_music_tracks').all() as Array<{ id: string }>;
  const existingIds = new Set(existingRows.map((r) => r.id));
  const nowIso = new Date().toISOString();
  let autoAddedCount = 0;

  const upsert = sqliteDb.prepare(`
    INSERT INTO saved_music_tracks (id, track_json, added_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET track_json = excluded.track_json, added_at = excluded.added_at
  `);

  for (const t of tracks.slice(0, 8)) {
    if (!existingIds.has(t.id)) autoAddedCount += 1;
    const savedObj: SavedMusicTrack = {
      ...t,
      provider: t.provider || 'soundcloud',
      searchQuery,
      addedByUserId: userId,
      addedAt: nowIso,
      isOnline: true,
    };
    upsert.run(t.id, JSON.stringify(savedObj), nowIso);
  }

  return { savedTracks: getAllSavedTracksFromDb(), autoAddedCount };
}

const CURATED_OPEN_LICENSE_TRACKS: DiscoveredMusicTrack[] = [
  {
    id: 'pixabay-351844',
    title: 'Giai Điệu Piano Thư Giãn (#351844)',
    artist: 'Clavier Music',
    mood: 'Dịu nhẹ & trong trẻo',
    tag: 'Piano Chữa Lành',
    sourceLabel: 'Pixabay · CC0',
    sourceUrl: 'https://pixabay.com/music/modern-classical-relaxing-piano-music-351844/',
    license: 'CC0 Public Domain',
    licenseType: 'cc0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    attribution: 'Clavier Music · Pixabay License / CC0 Public Domain',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/relaxing-piano-pixabay-351844.wav',
    durationHint: '01:02',
    isOnline: false,
  },
  {
    id: 'meditation-impromptu-01',
    title: 'Thiền Định Tĩnh Tâm I (Meditation Impromptu 01)',
    artist: 'Kevin MacLeod',
    mood: 'Thiền sâu & buông thả',
    tag: 'Thiền Định',
    sourceLabel: 'Wikimedia · CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Meditation_Impromptu_01_(ISRC_USUAN1100163).mp3',
    license: 'CC BY 3.0',
    licenseType: 'cc_by',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    attribution: '"Meditation Impromptu 01" by Kevin MacLeod (incompetech.com), licensed under CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/meditation-impromptu-01.mp3',
    durationHint: '04:46',
    isOnline: false,
  },
  {
    id: 'meditation-impromptu-02',
    title: 'Thiền Định Tĩnh Tâm II (Meditation Impromptu 02)',
    artist: 'Kevin MacLeod',
    mood: 'An nhiên & tĩnh tại',
    tag: 'Chánh Niệm',
    sourceLabel: 'Wikimedia · CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Meditation_Impromptu_02_(ISRC_USUAN1100162).mp3',
    license: 'CC BY 3.0',
    licenseType: 'cc_by',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    attribution: '"Meditation Impromptu 02" by Kevin MacLeod (incompetech.com), licensed under CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/meditation-impromptu-02.mp3',
    durationHint: '05:32',
    isOnline: false,
  },
  {
    id: 'gymnopedie-no-1',
    title: 'Ánh Chiều Yên Bình (Gymnopédie No. 1)',
    artist: 'Erik Satie · Arr. Kevin MacLeod',
    mood: 'Sâu lắng & vỗ về',
    tag: 'Piano Cổ Điển',
    sourceLabel: 'Wikimedia · CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gymnopedie_No._1_(ISRC_USUAN1100787).mp3',
    license: 'CC BY 3.0',
    licenseType: 'cc_by',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    attribution: '"Gymnopedie No. 1" arranged by Kevin MacLeod (incompetech.com), licensed under CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/gymnopedie-no-1.mp3',
    durationHint: '03:07',
    isOnline: false,
  },
  {
    id: 'gymnopedie-no-3',
    title: 'Giọt Sương Đêm Khuya (Gymnopédie No. 3)',
    artist: 'Erik Satie · Arr. Kevin MacLeod',
    mood: 'Mềm mại & dễ ngủ',
    tag: 'Dỗ Giấc Ngủ',
    sourceLabel: 'Wikimedia · CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gymnopedie_No._3_(ISRC_USUAN1100785).mp3',
    license: 'CC BY 3.0',
    licenseType: 'cc_by',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    attribution: '"Gymnopedie No. 3" arranged by Kevin MacLeod (incompetech.com), licensed under CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/gymnopedie-no-3.mp3',
    durationHint: '02:25',
    isOnline: false,
  },
  {
    id: 'endless-space-ambient',
    title: 'Khoảng Trời Vô Tận (Endless Space)',
    artist: 'SolusLunes',
    mood: 'Khoáng đạt & nhẹ lòng',
    tag: 'Ambient Không Gian',
    sourceLabel: 'Wikimedia · CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Endless_Space.ogg',
    license: 'CC BY 3.0',
    licenseType: 'cc_by',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    attribution: '"Endless Space" by SolusLunes, licensed under CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/endless-space-ambient.mp3',
    durationHint: '02:55',
    isOnline: false,
  },
];

musicRouter.get('/catalog', (_req, res) => {
  res.json({
    tracks: CURATED_OPEN_LICENSE_TRACKS,
    openLicenseNotice:
      'Toàn bộ nhạc nền mặc định của Heali sử dụng giấy phép mở CC0 / CC BY 3.0 có ghi công rõ ràng và hoạt động ngoại tuyến.',
  });
});

musicRouter.get('/library', (_req, res) => {
  res.json({ tracks: getAllSavedTracksFromDb() });
});

musicRouter.delete('/library/:id', authMiddleware, (req, res) => {
  sqliteDb.prepare('DELETE FROM saved_music_tracks WHERE id = ?').run(req.params.id);
  res.json({ success: true, tracks: getAllSavedTracksFromDb() });
});

musicRouter.get('/discover', async (req, res) => {
  const rawCategory =
    typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : 'recommended';
  const category = MUSIC_CATEGORY_QUERIES[rawCategory] ? rawCategory : 'recommended';
  const rawSearch = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  const searchQuery = rawSearch || MUSIC_CATEGORY_QUERIES[category].query;
  const cacheKey = `sc::${category}::${searchQuery.toLowerCase()}`;

  const token = extractBearerToken(req);
  const callerUserId = token ? findUserByRawToken(token)?.id : undefined;

  const cached = musicCatalogCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    let autoAddedCount = 0;
    let savedTracks: SavedMusicTrack[] | undefined;
    if (rawSearch && cached.tracks.length > 0) {
      const saved = upsertSavedTracksToDb(cached.tracks, rawSearch, callerUserId);
      autoAddedCount = saved.autoAddedCount;
      savedTracks = saved.savedTracks;
    }
    res.json({
      provider: cached.tracks[0]?.provider === 'audius' ? 'Audius Open Catalog' : 'SoundCloud',
      category,
      query: searchQuery,
      tracks: cached.tracks,
      autoAddedCount,
      savedTracks,
    });
    return;
  }

  try {
    let provider = 'SoundCloud';
    let tracks = await searchSoundCloudTracks(searchQuery, category, Boolean(rawSearch));
    if (tracks.length === 0) {
      tracks = await searchAudiusTracks(searchQuery, category, Boolean(rawSearch));
      if (tracks.length > 0) provider = 'Audius Open Catalog';
    }
    musicCatalogCache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, tracks });

    let autoAddedCount = 0;
    let savedTracks: SavedMusicTrack[] | undefined;
    if (rawSearch && tracks.length > 0) {
      const saved = upsertSavedTracksToDb(tracks, rawSearch, callerUserId);
      autoAddedCount = saved.autoAddedCount;
      savedTracks = saved.savedTracks;
    }

    res.json({ provider, category, query: searchQuery, tracks, autoAddedCount, savedTracks });
  } catch (err) {
    console.error('Online music discovery fallback:', err);
    res.json({ provider: 'SoundCloud', category, query: searchQuery, tracks: [], autoAddedCount: 0, offlineFallback: true });
  }
});

musicRouter.get('/soundcloud/playlist/:trackFile', async (req, res) => {
  const trackId = req.params.trackFile.replace(/\.m3u8$/i, '').trim();
  if (!/^\d{3,15}$/.test(trackId)) {
    res.status(400).send('Invalid SoundCloud track ID');
    return;
  }

  try {
    let clientId = await getSoundCloudClientId(false);
    if (!clientId) {
      res.status(503).send('SoundCloud client unavailable');
      return;
    }
    const fetchTrackMeta = (cid: string) =>
      fetch(`https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${encodeURIComponent(cid)}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(7000),
      });

    let metaRes = await fetchTrackMeta(clientId);
    if (metaRes.status === 401 || metaRes.status === 403) {
      clientId = await getSoundCloudClientId(true);
      if (clientId) metaRes = await fetchTrackMeta(clientId);
    }
    if (!metaRes.ok || !clientId) {
      res.status(404).send('Track metadata unavailable');
      return;
    }
    const track = (await metaRes.json()) as SoundCloudTrackRaw;
    const transcodings = track.media?.transcodings || [];
    const hlsTranscoding =
      transcodings.find((t) => t.format?.protocol === 'hls' && t.preset === 'aac_160k') ||
      transcodings.find((t) => t.format?.protocol === 'hls' && t.preset === 'aac_96k') ||
      transcodings.find((t) => t.format?.protocol === 'hls');

    if (!hlsTranscoding || !isAllowedSoundCloudMediaUrl(hlsTranscoding.url)) {
      res.status(404).send('No HLS stream available for this track');
      return;
    }
    const resolveUrl = `${hlsTranscoding.url}${hlsTranscoding.url.includes('?') ? '&' : '?'}client_id=${encodeURIComponent(clientId)}`;
    const resolvedRes = await fetch(resolveUrl, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(7000) });
    if (!resolvedRes.ok) {
      res.status(502).send('Failed to resolve SoundCloud stream URL');
      return;
    }
    const resolvedJson = (await resolvedRes.json()) as { url?: string };
    if (!resolvedJson.url || !isAllowedSoundCloudMediaUrl(resolvedJson.url)) {
      res.status(502).send('Invalid SoundCloud media stream host');
      return;
    }
    const m3u8Res = await fetch(resolvedJson.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(7000) });
    if (!m3u8Res.ok) {
      res.status(502).send('Failed to fetch SoundCloud playlist');
      return;
    }
    const rawM3u8 = await m3u8Res.text();
    const rewritten = rawM3u8
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('https://')) {
          return `/api/music/soundcloud/seg?t=${Buffer.from(trimmed, 'utf8').toString('base64url')}`;
        }
        return line.replace(/URI="(https:\/\/[^"]+)"/g, (_m, innerUrl: string) => {
          return `URI="/api/music/soundcloud/seg?t=${Buffer.from(innerUrl, 'utf8').toString('base64url')}"`;
        });
      })
      .join('\n');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(rewritten);
  } catch (err) {
    console.error('SoundCloud HLS proxy error:', err);
    res.status(502).send('SoundCloud stream proxy error');
  }
});

musicRouter.get('/soundcloud/audio/:trackId', async (req, res) => {
  const trackId = req.params.trackId.trim();
  if (!/^\d{3,15}$/.test(trackId)) {
    res.status(400).send('Invalid SoundCloud track ID');
    return;
  }
  try {
    const clientId = await getSoundCloudClientId(false);
    if (!clientId) {
      res.status(503).send('SoundCloud client unavailable');
      return;
    }
    const metaRes = await fetch(
      `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${encodeURIComponent(clientId)}`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!metaRes.ok) {
      res.status(404).send('Track unavailable');
      return;
    }
    const track = (await metaRes.json()) as SoundCloudTrackRaw;
    const prog = (track.media?.transcodings || []).find((t) => t.format?.protocol === 'progressive');
    if (!prog || !isAllowedSoundCloudMediaUrl(prog.url)) {
      res.redirect(`/api/music/soundcloud/playlist/${trackId}.m3u8`);
      return;
    }
    const resolvedRes = await fetch(
      `${prog.url}${prog.url.includes('?') ? '&' : '?'}client_id=${encodeURIComponent(clientId)}`,
      { signal: AbortSignal.timeout(7000) }
    );
    const resolvedJson = (await resolvedRes.json()) as { url?: string };
    if (!resolvedJson.url || !isAllowedSoundCloudMediaUrl(resolvedJson.url)) {
      res.status(502).send('Invalid SoundCloud media host');
      return;
    }
    const upstreamHeaders: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
    if (typeof req.headers.range === 'string') upstreamHeaders['Range'] = req.headers.range;
    const audioRes = await fetch(resolvedJson.url, { headers: upstreamHeaders });
    res.status(audioRes.status);
    res.setHeader('Content-Type', audioRes.headers.get('content-type') || 'audio/mpeg');
    const cr = audioRes.headers.get('content-range');
    if (cr) res.setHeader('Content-Range', cr);
    const cl = audioRes.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);
    res.setHeader('Accept-Ranges', 'bytes');
    res.send(Buffer.from(await audioRes.arrayBuffer()));
  } catch (err) {
    console.error('SoundCloud progressive audio error:', err);
    res.status(502).send('Audio stream error');
  }
});

musicRouter.get('/soundcloud/seg', async (req, res) => {
  const token = typeof req.query.t === 'string' ? req.query.t : '';
  if (!token || token.length > 4000) {
    res.status(400).send('Invalid segment parameter');
    return;
  }
  let targetUrl = '';
  try {
    targetUrl = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    res.status(400).send('Malformed segment token');
    return;
  }
  if (!isAllowedSoundCloudMediaUrl(targetUrl)) {
    res.status(403).send('Disallowed media upstream');
    return;
  }
  try {
    const segRes = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!segRes.ok) {
      res.status(segRes.status).send('Segment fetch failed');
      return;
    }
    res.setHeader('Content-Type', segRes.headers.get('content-type') || 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(Buffer.from(await segRes.arrayBuffer()));
  } catch {
    res.status(502).send('Segment stream timeout');
  }
});

function getTimeSlot(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function emptyHabit(): UserMusicHabit {
  return {
    playCounts: {},
    tagCounts: {},
    timeSlots: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    recentTracks: [],
    recentSearches: [],
  };
}

musicRouter.get('/habits', authMiddleware, (req, res) => {
  const userId = req.authUser!.id;
  const row = sqliteDb.prepare('SELECT habit_json FROM music_habits WHERE user_id = ?').get(userId) as
    | { habit_json: string }
    | undefined;
  const habit: UserMusicHabit = row ? JSON.parse(row.habit_json) : emptyHabit();

  const hour = Number(req.query.hour ?? new Date().getHours());
  const currentSlot = getTimeSlot(Number.isFinite(hour) ? hour : 12);

  let topCategory: 'piano' | 'ambient' | 'sleep' | 'lofi' | '432hz' =
    currentSlot === 'night' ? 'sleep' : currentSlot === 'evening' ? '432hz' : currentSlot === 'afternoon' ? 'lofi' : 'piano';
  let topTagCount = 0;

  for (const [catKey, count] of Object.entries(habit.tagCounts || {})) {
    if (count > topTagCount && ['piano', 'ambient', 'sleep', 'lofi', '432hz'].includes(catKey)) {
      topTagCount = count;
      topCategory = catKey as typeof topCategory;
    }
  }

  const catLabels: Record<string, string> = {
    piano: 'Piano dịu êm',
    ambient: 'Ambient tĩnh tại',
    sleep: 'Mưa & Ngủ ngon',
    lofi: 'Lo-Fi nhẹ nhàng',
    '432hz': 'Tần số 432Hz',
  };
  const topTagLabel = catLabels[topCategory] || 'Piano dịu êm';
  const slotLabels: Record<string, string> = {
    morning: 'buổi sáng',
    afternoon: 'buổi chiều',
    evening: 'buổi tối',
    night: 'đêm khuya',
  };

  let reasonText = `Gợi ý theo khung giờ ${slotLabels[currentSlot]} giúp tâm trí thư giãn nhẹ nhàng.`;
  if (topTagCount > 0) {
    reasonText = `Dựa trên thói quen bạn đã nghe ${topTagCount} lần thể loại ${topTagLabel} và khung giờ ${slotLabels[currentSlot]}.`;
  } else if (habit.recentSearches.length > 0) {
    reasonText = `Gợi ý theo từ khóa bạn vừa tìm (“${habit.recentSearches[0]}”) & khung giờ ${slotLabels[currentSlot]}.`;
  }

  res.json({
    habit,
    recommendation: {
      category: topCategory,
      categoryLabel: topTagLabel,
      timeSlot: currentSlot,
      reasonText,
    },
  });
});

musicRouter.post('/habits/event', authMiddleware, (req, res) => {
  const userId = req.authUser!.id;
  const { trackId, title, artist, tag, category, searchQuery, hour } = req.body || {};

  const row = sqliteDb.prepare('SELECT habit_json FROM music_habits WHERE user_id = ?').get(userId) as
    | { habit_json: string }
    | undefined;
  const habit: UserMusicHabit = row ? JSON.parse(row.habit_json) : emptyHabit();
  const resolvedHour = typeof hour === 'number' && hour >= 0 && hour <= 23 ? hour : new Date().getHours();
  const slot = getTimeSlot(resolvedHour);

  if (typeof trackId === 'string' && trackId.trim()) {
    const cleanId = trackId.trim().slice(0, 100);
    const cleanTitle = typeof title === 'string' ? title.trim().slice(0, 120) : 'Bản nhạc thư giãn';
    const cleanArtist = typeof artist === 'string' ? artist.trim().slice(0, 60) : 'Nghệ sĩ';
    const cleanTag = typeof tag === 'string' ? tag.trim().slice(0, 40) : 'Thư giãn';
    const cleanCat =
      typeof category === 'string' && ['piano', 'ambient', 'sleep', 'lofi', '432hz'].includes(category)
        ? category
        : cleanTag.toLowerCase().includes('piano')
        ? 'piano'
        : cleanTag.toLowerCase().includes('432')
        ? '432hz'
        : cleanTag.toLowerCase().includes('ngủ') || cleanTag.toLowerCase().includes('sleep')
        ? 'sleep'
        : cleanTag.toLowerCase().includes('lo-fi') || cleanTag.toLowerCase().includes('lofi')
        ? 'lofi'
        : 'ambient';

    habit.playCounts[cleanId] = (habit.playCounts[cleanId] || 0) + 1;
    habit.tagCounts[cleanCat] = (habit.tagCounts[cleanCat] || 0) + 1;
    habit.timeSlots[slot] = (habit.timeSlots[slot] || 0) + 1;
    habit.recentTracks = [
      { trackId: cleanId, title: cleanTitle, artist: cleanArtist, tag: cleanTag, category: cleanCat, playedAt: new Date().toISOString() },
      ...habit.recentTracks.filter((item) => item.trackId !== cleanId),
    ].slice(0, 12);
  }

  if (typeof searchQuery === 'string' && searchQuery.trim()) {
    const cleanSearch = searchQuery.trim().slice(0, 80);
    habit.recentSearches = [
      cleanSearch,
      ...habit.recentSearches.filter((q) => q.toLowerCase() !== cleanSearch.toLowerCase()),
    ].slice(0, 6);
  }

  sqliteDb
    .prepare(`
      INSERT INTO music_habits (user_id, habit_json)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET habit_json = excluded.habit_json
    `)
    .run(userId, JSON.stringify(habit));

  res.json({ success: true, habit });
});
