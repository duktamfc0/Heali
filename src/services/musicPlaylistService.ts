import Hls from 'hls.js';
import { api } from './api';

export interface HealingTrack {
  id: string;
  title: string;
  artist: string;
  mood: string;
  tag: string;
  sourceLabel: string;
  sourceUrl?: string;
  license: string;
  licenseType?: 'cc0' | 'cc_by' | 'third_party_stream' | 'user_local';
  licenseUrl?: string;
  attribution?: string;
  termsNotice?: string;
  isOfflineCurated?: boolean;
  audioUrl: string;
  artworkUrl?: string;
  durationHint: string;
  provider?: 'soundcloud' | 'audius';
  soundcloudId?: string;
  isSavedOnWeb?: boolean;
  isCustom?: boolean;
  isOnline?: boolean;
}

export type MusicCategoryId =
  | 'recommended'
  | 'piano'
  | 'ambient'
  | 'sleep'
  | 'lofi'
  | '432hz';

export interface HabitRecommendation {
  category: Exclude<MusicCategoryId, 'recommended'>;
  categoryLabel: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  reasonText: string;
}

export interface RecentPlayedItem {
  trackId: string;
  title: string;
  artist: string;
  tag: string;
  category: string;
  playedAt: string;
}

interface LocalHabitStore {
  playCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  recentTracks: RecentPlayedItem[];
  recentSearches: string[];
}

const LOCAL_HABIT_KEY = 'heali_music_habits_local_v1';

function normalizeSearchText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function inferTrackCategory(track: Pick<HealingTrack, 'title' | 'tag' | 'mood'>, fallback: MusicCategoryId): Exclude<MusicCategoryId, 'recommended'> {
  if (fallback !== 'recommended') return fallback;
  const hay = normalizeSearchText(`${track.title} ${track.tag} ${track.mood}`);
  if (hay.includes('piano')) return 'piano';
  if (hay.includes('432')) return '432hz';
  if (hay.includes('ngu') || hay.includes('sleep') || hay.includes('mua')) return 'sleep';
  if (hay.includes('lofi') || hay.includes('lo-fi')) return 'lofi';
  return 'ambient';
}

function getDefaultRecommendation(hour = new Date().getHours()): HabitRecommendation {
  const slot: HabitRecommendation['timeSlot'] =
    hour >= 5 && hour < 12
      ? 'morning'
      : hour >= 12 && hour < 17
      ? 'afternoon'
      : hour >= 17 && hour < 22
      ? 'evening'
      : 'night';
  const catMap: Record<HabitRecommendation['timeSlot'], { cat: HabitRecommendation['category']; label: string; slotName: string }> = {
    morning: { cat: 'piano', label: 'Piano dịu êm', slotName: 'buổi sáng' },
    afternoon: { cat: 'lofi', label: 'Lo-Fi nhẹ nhàng', slotName: 'buổi chiều' },
    evening: { cat: '432hz', label: 'Tần số 432Hz', slotName: 'buổi tối' },
    night: { cat: 'sleep', label: 'Mưa & Ngủ ngon', slotName: 'đêm khuya' },
  };
  const info = catMap[slot];
  return {
    category: info.cat,
    categoryLabel: info.label,
    timeSlot: slot,
    reasonText: `Gợi ý theo khung giờ ${info.slotName} giúp tâm trí thư giãn nhẹ nhàng.`,
  };
}

export const MUSIC_CATEGORIES: Array<{ id: MusicCategoryId; label: string }> = [
  { id: 'recommended', label: 'Đề xuất' },
  { id: 'piano', label: 'Piano dịu' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'sleep', label: 'Mưa & Ngủ' },
  { id: 'lofi', label: 'Lo-Fi nhẹ' },
  { id: '432hz', label: '432Hz' },
];

export const CURATED_HEALING_TRACKS: HealingTrack[] = [
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
    attribution: 'Clavier Music · CC0 Public Domain',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/relaxing-piano-pixabay-351844.wav',
    durationHint: '01:02',
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
    attribution: '"Meditation Impromptu 01" by Kevin MacLeod (incompetech.com), CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/meditation-impromptu-01.mp3',
    durationHint: '04:46',
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
    attribution: '"Meditation Impromptu 02" by Kevin MacLeod (incompetech.com), CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/meditation-impromptu-02.mp3',
    durationHint: '05:32',
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
    attribution: '"Gymnopedie No. 1" arranged by Kevin MacLeod, CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/gymnopedie-no-1.mp3',
    durationHint: '03:07',
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
    attribution: '"Gymnopedie No. 3" arranged by Kevin MacLeod, CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/gymnopedie-no-3.mp3',
    durationHint: '02:25',
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
    attribution: '"Endless Space" by SolusLunes, CC BY 3.0.',
    isOfflineCurated: true,
    audioUrl: '/assets/audio/endless-space-ambient.mp3',
    durationHint: '02:55',
  },
];

export interface MusicPlayerSnapshot {
  tracks: HealingTrack[];
  savedTracks: HealingTrack[];
  recommendedTracks: HealingTrack[];
  habitRecommendation: HabitRecommendation;
  recentTracks: RecentPlayedItem[];
  recentSearches: string[];
  playCounts: Record<string, number>;
  currentTrackId: string;
  isPlaying: boolean;
  isLoading: boolean;
  isSyncingOnline: boolean;
  activeCategory: MusicCategoryId;
  activeProvider: string;
  preferOpenLicenseOnly: boolean;
  lastAutoAddedCount: number;
  onlineQuery: string;
  onlineCount: number;
  savedCount: number;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: 'all' | 'one';
  shuffle: boolean;
  error: string | null;
}

type Listener = (snapshot: MusicPlayerSnapshot) => void;

class HealingMusicPlaylistService {
  private audio: HTMLAudioElement | null = null;
  private hls: Hls | null = null;
  private loadedTrackUrl: string | null = null;
  private customTracks: HealingTrack[] = [];
  private savedTracks: HealingTrack[] = [];
  private onlineTracks: HealingTrack[] = [];
  private tracks: HealingTrack[] = [...CURATED_HEALING_TRACKS];
  private trackCatalogById = new Map<string, HealingTrack>();
  private habitRecommendation: HabitRecommendation = getDefaultRecommendation();
  private localHabit: LocalHabitStore = this.readLocalHabit();
  private currentTrackId: string = CURATED_HEALING_TRACKS[0].id;
  private isPlaying = false;
  private isLoading = false;
  private isSyncingOnline = false;
  private hasAutoSynced = false;
  private activeCategory: MusicCategoryId = 'recommended';
  private activeProvider = 'SoundCloud';
  private preferOpenLicenseOnly = false;
  private lastAutoAddedCount = 0;
  private onlineQuery = '';
  private currentTime = 0;
  private duration = 0;
  private volume = 0.72;
  private repeatMode: 'all' | 'one' = 'all';
  private shuffle = false;
  private error: string | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    CURATED_HEALING_TRACKS.forEach((t) => this.trackCatalogById.set(t.id, t));
  }

  private readLocalHabit(): LocalHabitStore {
    if (typeof window === 'undefined') {
      return { playCounts: {}, tagCounts: {}, recentTracks: [], recentSearches: [] };
    }
    try {
      const raw = localStorage.getItem(LOCAL_HABIT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LocalHabitStore>;
        return {
          playCounts: parsed.playCounts || {},
          tagCounts: parsed.tagCounts || {},
          recentTracks: Array.isArray(parsed.recentTracks) ? parsed.recentTracks : [],
          recentSearches: Array.isArray(parsed.recentSearches) ? parsed.recentSearches : [],
        };
      }
    } catch {
      // ignore storage errors
    }
    return { playCounts: {}, tagCounts: {}, recentTracks: [], recentSearches: [] };
  }

  private writeLocalHabit() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_HABIT_KEY, JSON.stringify(this.localHabit));
    } catch {
      // ignore storage errors
    }
  }

  private computeLocalRecommendation() {
    const def = getDefaultRecommendation();
    let bestCat: HabitRecommendation['category'] = def.category;
    let bestCount = 0;

    for (const [cat, count] of Object.entries(this.localHabit.tagCounts)) {
      if (count > bestCount && ['piano', 'ambient', 'sleep', 'lofi', '432hz'].includes(cat)) {
        bestCount = count;
        bestCat = cat as HabitRecommendation['category'];
      }
    }

    const labels: Record<HabitRecommendation['category'], string> = {
      piano: 'Piano dịu êm',
      ambient: 'Ambient tĩnh tại',
      sleep: 'Mưa & Ngủ ngon',
      lofi: 'Lo-Fi nhẹ nhàng',
      '432hz': 'Tần số 432Hz',
    };

    const slotLabel: Record<HabitRecommendation['timeSlot'], string> = {
      morning: 'buổi sáng',
      afternoon: 'buổi chiều',
      evening: 'buổi tối',
      night: 'đêm khuya',
    };

    if (bestCount > 0) {
      this.habitRecommendation = {
        category: bestCat,
        categoryLabel: labels[bestCat],
        timeSlot: def.timeSlot,
        reasonText: `Dựa trên thói quen bạn đã nghe ${bestCount} lần thể loại ${labels[bestCat]} và khung giờ ${slotLabel[def.timeSlot]}.`,
      };
    } else if (this.localHabit.recentSearches.length > 0) {
      this.habitRecommendation = {
        ...def,
        reasonText: `Gợi ý theo từ khóa bạn vừa tìm (“${this.localHabit.recentSearches[0]}”) & khung giờ ${slotLabel[def.timeSlot]}.`,
      };
    } else {
      this.habitRecommendation = def;
    }
  }

  private buildRecommendedTracks(): HealingTrack[] {
    const preferredCat = this.habitRecommendation.category;
    const candidates = new Map<string, HealingTrack>();

    [...this.customTracks, ...this.savedTracks, ...CURATED_HEALING_TRACKS, ...this.onlineTracks].forEach((t) => {
      this.trackCatalogById.set(t.id, t);
      candidates.set(t.id, t);
    });

    const scored = Array.from(candidates.values()).map((track) => {
      const plays = this.localHabit.playCounts[track.id] || 0;
      const trackCat = inferTrackCategory(track, 'recommended');
      const catBonus = trackCat === preferredCat ? 8 : 0;
      const playBonus = Math.min(12, plays * 3);
      return { track, score: catBonus + playBonus };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((item) => item.track);
  }

  private filterMatchingLocalTracks(query: string): HealingTrack[] {
    const normQuery = normalizeSearchText(query);
    if (!normQuery) return [];
    const tokens = normQuery.split(/\s+/).filter(Boolean);
    const seen = new Set<string>();
    const results: HealingTrack[] = [];
    for (const track of [...this.customTracks, ...this.savedTracks, ...CURATED_HEALING_TRACKS]) {
      if (seen.has(track.id)) continue;
      const hay = normalizeSearchText(`${track.title} ${track.artist} ${track.tag} ${track.mood}`);
      if (tokens.every((tok) => hay.includes(tok))) {
        seen.add(track.id);
        results.push(track);
      }
    }
    return results;
  }

  private rebuildTracks(includeCurated: boolean, query = '') {
    const currentlyPlaying = this.tracks.find((t) => t.id === this.currentTrackId);
    const merged: HealingTrack[] = [];
    const seen = new Set<string>();

    const isAllowedByLicense = (t: HealingTrack) => {
      if (!this.preferOpenLicenseOnly) return true;
      return (
        t.isCustom ||
        t.isOfflineCurated ||
        t.licenseType === 'cc0' ||
        t.licenseType === 'cc_by' ||
        t.licenseType === 'user_local'
      );
    };

    const pushUnique = (list: HealingTrack[]) => {
      list.forEach((t) => {
        this.trackCatalogById.set(t.id, t);
        if (!isAllowedByLicense(t)) return;
        if (!seen.has(t.id)) {
          seen.add(t.id);
          merged.push(t);
        }
      });
    };

    if (query.trim()) {
      const localMatches = this.filterMatchingLocalTracks(query);
      pushUnique(localMatches);
      if (!this.preferOpenLicenseOnly) {
        pushUnique(this.onlineTracks);
      }
    } else {
      pushUnique(this.customTracks);
      if (!this.preferOpenLicenseOnly) {
        pushUnique(this.savedTracks);
      }
      if (includeCurated || this.preferOpenLicenseOnly) {
        pushUnique(CURATED_HEALING_TRACKS);
      }
      if (!this.preferOpenLicenseOnly) {
        pushUnique(this.onlineTracks);
      }
    }

    // Keep actively playing track in list so playback never breaks mid-song
    if (currentlyPlaying && !seen.has(currentlyPlaying.id)) {
      merged.unshift(currentlyPlaying);
    }

    this.tracks = merged;
  }

  public setPreferOpenLicenseOnly(enabled: boolean) {
    this.preferOpenLicenseOnly = enabled;
    this.rebuildTracks(
      (this.activeCategory === 'recommended' && !this.onlineQuery) || (!this.onlineQuery && this.onlineTracks.length === 0) || enabled,
      this.onlineQuery
    );
    this.emit();
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (this.audio) return this.audio;

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = this.volume;

    audio.addEventListener('timeupdate', () => {
      this.currentTime = audio.currentTime || 0;
      this.emit();
    });

    audio.addEventListener('loadedmetadata', () => {
      this.duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      this.isLoading = false;
      this.emit();
    });

    audio.addEventListener('canplay', () => {
      this.isLoading = false;
      this.error = null;
      this.emit();
    });

    audio.addEventListener('waiting', () => {
      this.isLoading = true;
      this.emit();
    });

    audio.addEventListener('playing', () => {
      this.isPlaying = true;
      this.isLoading = false;
      this.error = null;
      this.emit();
    });

    audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.emit();
    });

    audio.addEventListener('ended', () => {
      if (this.repeatMode === 'one') {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
      } else {
        this.next();
      }
    });

    audio.addEventListener('error', () => {
      this.isPlaying = false;
      this.isLoading = false;
      this.error = 'Không thể phát bản nhạc này, vui lòng chọn bài khác.';
      this.emit();
    });

    this.audio = audio;
    return audio;
  }

  public getSnapshot(): MusicPlayerSnapshot {
    return {
      tracks: [...this.tracks],
      savedTracks: [...this.savedTracks],
      recommendedTracks: this.buildRecommendedTracks(),
      habitRecommendation: this.habitRecommendation,
      recentTracks: [...this.localHabit.recentTracks],
      recentSearches: [...this.localHabit.recentSearches],
      playCounts: { ...this.localHabit.playCounts },
      currentTrackId: this.currentTrackId,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      isSyncingOnline: this.isSyncingOnline,
      activeCategory: this.activeCategory,
      activeProvider: this.activeProvider,
      preferOpenLicenseOnly: this.preferOpenLicenseOnly,
      lastAutoAddedCount: this.lastAutoAddedCount,
      onlineQuery: this.onlineQuery,
      onlineCount: this.onlineTracks.length,
      savedCount: this.savedTracks.length,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      repeatMode: this.repeatMode,
      shuffle: this.shuffle,
      error: this.error,
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  public subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    if (!this.hasAutoSynced && typeof window !== 'undefined') {
      this.hasAutoSynced = true;
      void this.loadSavedLibrary();
      void this.refreshHabits();
      void this.syncOnlineCatalog('recommended', '');
    }
    return () => {
      this.listeners.delete(cb);
    };
  }

  public async loadSavedLibrary() {
    try {
      const res = await fetch('/api/music/library');
      if (!res.ok) return;
      const data = (await res.json()) as { tracks?: HealingTrack[] };
      const list = Array.isArray(data.tracks)
        ? data.tracks.map((t) => ({ ...t, isSavedOnWeb: true }))
        : [];
      this.savedTracks = list;
      this.rebuildTracks(
        (this.activeCategory === 'recommended' && !this.onlineQuery) || (!this.onlineQuery && this.onlineTracks.length === 0),
        this.onlineQuery
      );
      this.emit();
    } catch {
      // ignore offline library error
    }
  }

  public async removeSavedTrack(trackId: string) {
    const token = api.getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/music/library/${encodeURIComponent(trackId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-heali-token': token,
        },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { tracks?: HealingTrack[] };
      this.savedTracks = Array.isArray(data.tracks)
        ? data.tracks.map((t) => ({ ...t, isSavedOnWeb: true }))
        : this.savedTracks.filter((t) => t.id !== trackId);
      this.rebuildTracks(this.activeCategory === 'recommended' && !this.onlineQuery, this.onlineQuery);
      this.emit();
    } catch {
      // ignore error
    }
  }

  public async refreshHabits() {
    this.computeLocalRecommendation();
    const token = api.getToken();
    if (!token) {
      this.emit();
      return;
    }

    try {
      const hour = new Date().getHours();
      const res = await fetch(`/api/music/habits?hour=${hour}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-heali-token': token,
        },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        habit?: LocalHabitStore;
        recommendation?: HabitRecommendation;
      };
      if (data.habit) {
        this.localHabit = {
          playCounts: data.habit.playCounts || this.localHabit.playCounts,
          tagCounts: data.habit.tagCounts || this.localHabit.tagCounts,
          recentTracks: Array.isArray(data.habit.recentTracks)
            ? data.habit.recentTracks
            : this.localHabit.recentTracks,
          recentSearches: Array.isArray(data.habit.recentSearches)
            ? data.habit.recentSearches
            : this.localHabit.recentSearches,
        };
        this.writeLocalHabit();
      }
      if (data.recommendation) {
        this.habitRecommendation = data.recommendation;
      }
      this.emit();
    } catch {
      this.emit();
    }
  }

  private async recordHabitEvent(payload: {
    track?: HealingTrack;
    searchQuery?: string;
  }) {
    const hour = new Date().getHours();
    let category: string | undefined;

    if (payload.track) {
      const t = payload.track;
      category = inferTrackCategory(t, this.activeCategory);
      this.localHabit.playCounts[t.id] = (this.localHabit.playCounts[t.id] || 0) + 1;
      this.localHabit.tagCounts[category] = (this.localHabit.tagCounts[category] || 0) + 1;
      this.localHabit.recentTracks = [
        {
          trackId: t.id,
          title: t.title,
          artist: t.artist,
          tag: t.tag,
          category,
          playedAt: new Date().toISOString(),
        },
        ...this.localHabit.recentTracks.filter((item) => item.trackId !== t.id),
      ].slice(0, 12);
    }

    if (payload.searchQuery?.trim()) {
      const cleanQ = payload.searchQuery.trim().slice(0, 80);
      this.localHabit.recentSearches = [
        cleanQ,
        ...this.localHabit.recentSearches.filter((q) => q.toLowerCase() !== cleanQ.toLowerCase()),
      ].slice(0, 6);
    }

    this.writeLocalHabit();
    this.computeLocalRecommendation();
    this.emit();

    const token = api.getToken();
    if (!token) return;

    try {
      await fetch('/api/music/habits/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-heali-token': token,
        },
        body: JSON.stringify({
          trackId: payload.track?.id,
          title: payload.track?.title,
          artist: payload.track?.artist,
          tag: payload.track?.tag,
          category,
          searchQuery: payload.searchQuery,
          hour,
        }),
      });
      await this.refreshHabits();
    } catch {
      // keep local habit intact
    }
  }

  public async syncOnlineCatalog(category: MusicCategoryId = this.activeCategory, query = '') {
    const cleanQuery = query.trim();
    this.activeCategory = category;
    this.onlineQuery = cleanQuery;
    this.isSyncingOnline = true;
    this.lastAutoAddedCount = 0;
    this.error = null;
    this.emit();

    if (cleanQuery) {
      void this.recordHabitEvent({ searchQuery: cleanQuery });
    }

    try {
      const params = new URLSearchParams({ category });
      if (cleanQuery) params.set('q', cleanQuery);

      const token = api.getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-heali-token'] = token;
      }

      const res = await fetch(`/api/music/discover?${params.toString()}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        provider?: string;
        tracks?: HealingTrack[];
        autoAddedCount?: number;
        savedTracks?: HealingTrack[];
      };

      this.activeProvider = data.provider || 'SoundCloud';
      this.onlineTracks = Array.isArray(data.tracks) ? data.tracks : [];
      this.lastAutoAddedCount = Number(data.autoAddedCount || 0);
      if (Array.isArray(data.savedTracks)) {
        this.savedTracks = data.savedTracks.map((t) => ({ ...t, isSavedOnWeb: true }));
      }
      const includeCurated = category === 'recommended' && !cleanQuery;
      this.rebuildTracks(includeCurated || (!cleanQuery && this.onlineTracks.length === 0), cleanQuery);
    } catch {
      this.rebuildTracks(!cleanQuery, cleanQuery);
    } finally {
      this.isSyncingOnline = false;
      this.emit();
    }
  }

  public getCurrentTrack(): HealingTrack {
    return (
      this.tracks.find((t) => t.id === this.currentTrackId) ||
      this.trackCatalogById.get(this.currentTrackId) ||
      this.tracks[0] ||
      CURATED_HEALING_TRACKS[0]
    );
  }

  private destroyHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  public async playTrack(trackId: string) {
    const target =
      this.tracks.find((t) => t.id === trackId) ||
      this.trackCatalogById.get(trackId) ||
      CURATED_HEALING_TRACKS.find((t) => t.id === trackId);
    if (!target) return;

    if (!this.tracks.some((t) => t.id === target.id)) {
      this.tracks = [target, ...this.tracks];
    }

    const audio = this.ensureAudio();
    if (!audio) return;

    const isSameTrack = this.currentTrackId === target.id && this.loadedTrackUrl === target.audioUrl;
    this.currentTrackId = target.id;
    this.error = null;

    void this.recordHabitEvent({ track: target });

    if (isSameTrack) {
      this.emit();
      try {
        await audio.play();
      } catch {
        this.isPlaying = false;
        this.isLoading = false;
        this.emit();
      }
      return;
    }

    this.destroyHls();
    this.loadedTrackUrl = target.audioUrl;
    this.isLoading = true;
    this.currentTime = 0;
    this.duration = 0;
    this.emit();

    const isHlsStream = target.audioUrl.includes('.m3u8');
    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
      });
      this.hls = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.isLoading = false;
        this.error = null;
        this.emit();
        void audio.play().catch(() => {
          this.isPlaying = false;
          this.isLoading = false;
          this.emit();
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          this.isPlaying = false;
          this.isLoading = false;
          this.error = 'Luồng SoundCloud đang tạm bận, bạn hãy thử lại hoặc chọn bản nhạc khác nhé.';
          this.destroyHls();
          this.emit();
        }
      });

      hls.loadSource(target.audioUrl);
      hls.attachMedia(audio);
      return;
    }

    audio.src = target.audioUrl;
    audio.load();
    try {
      await audio.play();
    } catch {
      this.isPlaying = false;
      this.isLoading = false;
      this.emit();
    }
  }

  public async togglePlay() {
    const audio = this.ensureAudio();
    if (!audio) return;

    if (this.isPlaying) {
      audio.pause();
      return;
    }

    const track = this.getCurrentTrack();
    if (!this.loadedTrackUrl || this.loadedTrackUrl !== track.audioUrl) {
      await this.playTrack(track.id);
      return;
    }

    try {
      await audio.play();
    } catch {
      this.isPlaying = false;
      this.emit();
    }
  }

  public pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  public next() {
    if (this.tracks.length === 0) return;
    const currentIdx = this.tracks.findIndex((t) => t.id === this.currentTrackId);
    let nextIdx = 0;
    if (this.shuffle && this.tracks.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * this.tracks.length);
      } while (nextIdx === currentIdx);
    } else {
      nextIdx = (currentIdx + 1) % this.tracks.length;
    }
    void this.playTrack(this.tracks[nextIdx].id);
  }

  public prev() {
    if (this.tracks.length === 0) return;
    const audio = this.audio;
    if (audio && audio.currentTime > 4) {
      audio.currentTime = 0;
      return;
    }
    const currentIdx = this.tracks.findIndex((t) => t.id === this.currentTrackId);
    const prevIdx = (currentIdx - 1 + this.tracks.length) % this.tracks.length;
    void this.playTrack(this.tracks[prevIdx].id);
  }

  public seek(seconds: number) {
    const audio = this.audio;
    if (!audio || !Number.isFinite(seconds)) return;
    const clamped = Math.max(0, Math.min(this.duration || seconds, seconds));
    audio.currentTime = clamped;
    this.currentTime = clamped;
    this.emit();
  }

  public setVolume(value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.volume = clamped;
    if (this.audio) {
      this.audio.volume = clamped;
    }
    this.emit();
  }

  public toggleRepeatMode() {
    this.repeatMode = this.repeatMode === 'all' ? 'one' : 'all';
    this.emit();
  }

  public toggleShuffle() {
    this.shuffle = !this.shuffle;
    this.emit();
  }

  public addLocalFiles(files: FileList | File[]) {
    const added: HealingTrack[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|flac|opus)$/i.test(file.name)) {
        return;
      }
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      const objUrl = URL.createObjectURL(file);
      const track: HealingTrack = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: cleanName || 'Nhạc chữa lành tự chọn',
        artist: 'Tải lên từ thiết bị của bạn',
        mood: 'Riêng tư & dịu êm',
        tag: 'Nhạc của bạn',
        sourceLabel: 'Tệp cá nhân',
        license: 'Cá nhân',
        licenseType: 'user_local',
        attribution: 'Tệp âm thanh lưu cục bộ từ thiết bị của bạn',
        audioUrl: objUrl,
        durationHint: '--:--',
        isCustom: true,
      };
      added.push(track);
    });

    if (added.length > 0) {
      this.customTracks = [...added, ...this.customTracks];
      this.rebuildTracks(this.activeCategory === 'recommended' && !this.onlineQuery, this.onlineQuery);
      this.emit();
      void this.playTrack(added[0].id);
    }
    return added.length;
  }

  public removeCustomTrack(trackId: string) {
    const target = this.customTracks.find((t) => t.id === trackId && t.isCustom);
    if (!target) return;

    if (this.currentTrackId === trackId) {
      this.pause();
    }
    if (target.audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.audioUrl);
    }
    this.customTracks = this.customTracks.filter((t) => t.id !== trackId);
    this.rebuildTracks(this.activeCategory === 'recommended' && !this.onlineQuery, this.onlineQuery);
    if (this.currentTrackId === trackId && this.tracks.length > 0) {
      this.currentTrackId = this.tracks[0].id;
      this.currentTime = 0;
      this.duration = 0;
    }
    this.emit();
  }
}

export const healingPlaylist = new HealingMusicPlaylistService();
