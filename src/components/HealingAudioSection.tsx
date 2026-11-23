import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../services/soundEngine';
import {
  healingPlaylist,
  MUSIC_CATEGORIES,
  type MusicCategoryId,
  type MusicPlayerSnapshot,
} from '../services/musicPlaylistService';
import {
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  CloudRain,
  Music,
  Wind,
  Bell,
  Clock,
  Sparkles,
  Waves,
  Upload,
  ExternalLink,
  Trash2,
  ListMusic,
  Disc3,
  Search,
  RefreshCw,
  X,
  HeartHandshake,
} from 'lucide-react';

export const HealingAudioSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(soundEngine.getIsPlaying());
  const [volumes, setVolumes] = useState(soundEngine.getVolumes());
  const [activePreset, setActivePreset] = useState<string>('rain_lake');
  const [timerMins, setTimerMins] = useState(0);
  const [remainingTimer, setRemainingTimer] = useState(0);

  const [musicSnap, setMusicSnap] = useState<MusicPlayerSnapshot>(() => healingPlaylist.getSnapshot());
  const [searchTerm, setSearchTerm] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubSound = soundEngine.subscribe((active) => {
      setIsPlaying(active);
    });
    const unsubMusic = healingPlaylist.subscribe((snap) => {
      setMusicSnap(snap);
    });
    return () => {
      unsubSound();
      unsubMusic();
    };
  }, []);

  const handleTogglePlay = () => {
    const active = soundEngine.toggle();
    setIsPlaying(active);
  };

  const handleVolumeChange = (channel: keyof typeof volumes, val: number) => {
    soundEngine.setVolume(channel, val);
    setVolumes(soundEngine.getVolumes());
  };

  const handleApplyPreset = (
    preset: 'rain_lake' | 'piano_lullaby' | 'night_garden' | 'warm_hearth' | 'deep_zen'
  ) => {
    setActivePreset(preset);
    soundEngine.applyPreset(preset);
    setVolumes(soundEngine.getVolumes());
    if (!isPlaying) {
      soundEngine.start();
      setIsPlaying(true);
    }
  };

  const handleSetTimer = (mins: number) => {
    setTimerMins(mins);
    soundEngine.setSleepTimer(mins, (rem) => {
      setRemainingTimer(rem);
      if (rem <= 0) {
        setIsPlaying(false);
        setTimerMins(0);
        healingPlaylist.pause();
      }
    });
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const count = healingPlaylist.addLocalFiles(files);
    if (count > 0) {
      setImportNotice(`Đã thêm ${count} bản nhạc vào danh sách phát chữa lành.`);
    } else {
      setImportNotice('Vui lòng chọn tệp âm thanh hợp lệ (.mp3, .wav, .ogg, .m4a).');
    }
    e.target.value = '';
    window.setTimeout(() => setImportNotice(null), 4000);
  };

  const handleCategoryChange = (cat: MusicCategoryId) => {
    setSearchTerm('');
    void healingPlaylist.syncOnlineCatalog(cat, '');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void healingPlaylist.syncOnlineCatalog(musicSnap.activeCategory, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    void healingPlaylist.syncOnlineCatalog(musicSnap.activeCategory, '');
  };

  const handleQuickSearchChip = (term: string) => {
    setSearchTerm(term);
    void healingPlaylist.syncOnlineCatalog(musicSnap.activeCategory, term);
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentTrack =
    musicSnap.tracks.find((t) => t.id === musicSnap.currentTrackId) || musicSnap.tracks[0];

  const channels = [
    { key: 'rain' as const, label: 'Mưa nhẹ tí tách', icon: CloudRain, color: 'text-[#4d7588]' },
    { key: 'piano' as const, label: 'Khúc ru Piano', icon: Music, color: 'text-[#a95843]' },
    { key: 'crickets' as const, label: 'Thanh âm vườn êm dịu', icon: Sparkles, color: 'text-[#877c4e]' },
    { key: 'chimes' as const, label: 'Chuông gió & tiếng gió', icon: Wind, color: 'text-[#46613e]' },
    { key: 'waves' as const, label: 'Sóng nước vỗ về', icon: Waves, color: 'text-[#487a71]' },
    { key: 'bowl' as const, label: 'Chuông ngân 216Hz', icon: Bell, color: 'text-[#5b744d]' },
  ];

  return (
    <section
      id="healing-audio-section"
      className="relative overflow-hidden rounded-[28px] bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-9 shadow-sm space-y-7 text-[#273829] dark:text-[#edf2e8]"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#4e6b4f] dark:text-[#8eb984] flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Kho Nhạc Bản Quyền Mở &amp; Thanh Âm Chữa Lành
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#243627] dark:text-[#edf2e8] font-serif-healing">
            Dỗ dành giấc ngủ &amp; Xoa dịu tâm can
          </h2>
          <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2] mt-1 font-serif-healing italic max-w-xl">
            Ưu tiên nhạc giấy phép mở CC0 / CC BY hoạt động ngoại tuyến và minh bạch ghi công nguồn, kèm tùy chọn kết nối kho trực tuyến.
          </p>
        </div>

        {/* Ambient Layer Quick Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 ${
              isPlaying
                ? 'bg-[#b55a44] hover:bg-[#9b4b38] text-white'
                : 'bg-[#eef2e9] hover:bg-[#e3eadc] text-[#273829] border border-[#cfd8c9]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Tắt tiếng thiên nhiên</span>
              </>
            ) : (
              <>
                <Wind className="w-4 h-4 text-[#46613e]" />
                <span>Bật tiếng mưa & gió</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CURATED + LIVE ONLINE HEALING MUSIC PLAYLIST */}
      <div className="rounded-3xl bg-[#f1efe5] border border-[#dcd9cc] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e2dfd3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#46613e] text-white flex items-center justify-center shrink-0">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#243627] font-serif-healing">
                Danh sách nhạc chữa lành
              </h3>
              <p className="text-[11px] text-[#5e7260]">
                {musicSnap.tracks.length} bản nhạc ({musicSnap.onlineCount} bài từ {musicSnap.activeProvider} · {musicSnap.savedCount} bài đã lưu lên web)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => void healingPlaylist.syncOnlineCatalog(musicSnap.activeCategory, searchTerm)}
              disabled={musicSnap.isSyncingOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf7ef] hover:bg-white text-[#3c5438] border border-[#cfd7c7] text-xs font-medium transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${musicSnap.isSyncingOnline ? 'animate-spin' : ''}`} />
              <span>Làm mới SoundCloud</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Thêm MP3</span>
            </button>
            <a
              href="https://soundcloud.com/search"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf7ef] hover:bg-white text-[#3c5438] border border-[#cfd7c7] text-xs font-medium transition"
            >
              <span>SoundCloud</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Category Filter & Live Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {MUSIC_CATEGORIES.map((cat) => {
              const active = musicSnap.activeCategory === cat.id && !musicSnap.onlineQuery;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    active
                      ? 'bg-[#46613e] text-white shadow-sm'
                      : 'bg-[#faf7ef] dark:bg-[#232f26] text-[#4b604d] dark:text-[#cbd6cc] hover:text-[#273829] dark:hover:text-white border border-[#dcdad0] dark:border-[#324236]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => healingPlaylist.setPreferOpenLicenseOnly(!musicSnap.preferOpenLicenseOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                musicSnap.preferOpenLicenseOnly
                  ? 'bg-[#2c4a2b] text-white border-[#2c4a2b] shadow-sm'
                  : 'bg-[#eef3ea] dark:bg-[#223125] text-[#354c38] dark:text-[#cfe3c9] border-[#c4d4be] dark:border-[#374a3a]'
              }`}
            >
              {musicSnap.preferOpenLicenseOnly ? 'Đang lọc: CC0 / CC BY & Ngoại tuyến' : 'Chỉ nhạc CC0 / CC BY mở'}
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#6d7c6d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên bài hát từ SoundCloud (tự thêm vào web)..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#faf7ef] border border-[#d6d3c6] text-xs text-[#273829] placeholder:text-[#7c8c7c] focus:outline-none focus:border-[#46613e]"
              />
              {(searchTerm || musicSnap.onlineQuery) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  title="Xóa tìm kiếm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#6d7c6d] hover:text-[#273829]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={musicSnap.isSyncingOnline}
              className="px-3 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition shrink-0"
            >
              {musicSnap.isSyncingOnline ? 'Đang lấy...' : 'Tìm & Lưu'}
            </button>
          </form>
        </div>

        {/* Auto-Added SoundCloud Confirmation Banner */}
        {musicSnap.onlineQuery && !musicSnap.isSyncingOnline && musicSnap.onlineCount > 0 && (
          <div className="px-3.5 py-2 rounded-xl bg-[#e6efe2] border border-[#bfd2b9] text-xs text-[#274224] flex flex-wrap items-center justify-between gap-2">
            <span>
              Đã kết nối <strong>{musicSnap.activeProvider}</strong> cho từ khóa “{musicSnap.onlineQuery}”
              {musicSnap.lastAutoAddedCount > 0
                ? ` và tự động thêm ${musicSnap.lastAutoAddedCount} bài hát mới vào danh sách web!`
                : ' và đồng bộ vào danh sách nhạc trên web.'}
            </span>
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-[11px] font-semibold underline text-[#365433] hover:text-[#1f331d]"
            >
              Xem toàn bộ kho nhạc web ({musicSnap.savedCount} bài đã lưu)
            </button>
          </div>
        )}

        {/* Recent Searches Quick Chips */}
        {musicSnap.recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[#5e7260]">Tìm gần đây:</span>
            {musicSnap.recentSearches.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuickSearchChip(q)}
                className="px-2.5 py-0.5 rounded-lg bg-[#faf7ef] hover:bg-white border border-[#dcdad0] text-[#3c5438] transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Habit-Based Personalized Recommendation Card */}
        {musicSnap.recommendedTracks.length > 0 && (
          <div className="rounded-2xl bg-[#e9efe4] border border-[#cad7c4] p-3.5 sm:p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#46613e] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <HeartHandshake className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#243627] flex items-center gap-2">
                    <span>Gợi ý theo thói quen của bạn</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/80 text-[#46613e] text-[10px] font-semibold">
                      {musicSnap.habitRecommendation.categoryLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4e6350] leading-snug mt-0.5">
                    {musicSnap.habitRecommendation.reasonText}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCategoryChange(musicSnap.habitRecommendation.category)}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white hover:bg-[#faf7ef] border border-[#c3d2bd] text-[#354d32] text-[11px] font-semibold transition shrink-0"
              >
                Lọc thể loại hợp gu
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {musicSnap.recommendedTracks.map((rec) => {
                const isRecActive = rec.id === musicSnap.currentTrackId;
                const isRecPlaying = isRecActive && musicSnap.isPlaying;
                const plays = musicSnap.playCounts[rec.id] || 0;
                return (
                  <button
                    key={`rec-${rec.id}`}
                    type="button"
                    onClick={() =>
                      isRecActive
                        ? healingPlaylist.togglePlay()
                        : healingPlaylist.playTrack(rec.id)
                    }
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
                      isRecPlaying
                        ? 'bg-[#46613e] border-[#46613e] text-white shadow-sm'
                        : 'bg-[#faf7ef] hover:bg-white border-[#d2dccd] text-[#243627]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isRecPlaying
                          ? 'bg-white/20 text-white'
                          : 'bg-[#e6efe2] text-[#46613e]'
                      }`}
                    >
                      {isRecPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold truncate">{rec.title}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isRecPlaying ? 'text-white/85' : 'text-[#5e7260]'
                        }`}
                      >
                        {rec.artist}
                        {plays > 0 ? ` · Đã nghe ${plays}x` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {importNotice && (
          <div className="px-3.5 py-2 rounded-xl bg-[#e6efe2] border border-[#bfd2b9] text-xs text-[#2b4429]">
            {importNotice}
          </div>
        )}

        {/* Active Player Console */}
        {currentTrack && (
          <div className="rounded-2xl bg-[#faf7ef] border border-[#dad7ca] p-4 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-11 h-11 rounded-2xl object-cover border border-[#c8d6c2] shrink-0"
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-2xl bg-[#e6efe2] border border-[#c8d6c2] flex items-center justify-center shrink-0 ${
                      musicSnap.isPlaying ? 'animate-pulse' : ''
                    }`}
                  >
                    <Disc3 className="w-5 h-5 text-[#46613e]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#243627] truncate">
                      {currentTrack.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#ebf0e5] text-[#46613e] text-[10px] font-semibold">
                      {currentTrack.license || currentTrack.sourceLabel}
                    </span>
                  </div>
                  <div className="text-xs text-[#5e7260] truncate">
                    {currentTrack.artist} · {currentTrack.mood}
                  </div>
                  {(currentTrack.attribution || currentTrack.termsNotice) && (
                    <div className="text-[11px] text-[#576c59] mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>{currentTrack.attribution || currentTrack.termsNotice}</span>
                      {currentTrack.licenseUrl && (
                        <a
                          href={currentTrack.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-[#46613e] font-medium"
                        >
                          Xem giấy phép
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Transport Controls */}
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => healingPlaylist.toggleShuffle()}
                  title="Phát ngẫu nhiên"
                  className={`p-2 rounded-xl transition ${
                    musicSnap.shuffle
                      ? 'bg-[#e6efe2] text-[#46613e]'
                      : 'text-[#6c7d6d] hover:text-[#273829] hover:bg-[#f1efe5]'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => healingPlaylist.prev()}
                  title="Bài trước"
                  className="p-2 rounded-xl text-[#394d3b] hover:bg-[#f1efe5] transition"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => healingPlaylist.togglePlay()}
                  className="w-10 h-10 rounded-full bg-[#46613e] hover:bg-[#384f31] text-white flex items-center justify-center shadow-sm transition active:scale-95"
                  title={musicSnap.isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc chữa lành'}
                >
                  {musicSnap.isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => healingPlaylist.next()}
                  title="Bài tiếp theo"
                  className="p-2 rounded-xl text-[#394d3b] hover:bg-[#f1efe5] transition"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => healingPlaylist.toggleRepeatMode()}
                  title={musicSnap.repeatMode === 'one' ? 'Lặp lại 1 bài' : 'Lặp lại danh sách'}
                  className={`p-2 rounded-xl transition ${
                    musicSnap.repeatMode === 'one'
                      ? 'bg-[#e6efe2] text-[#46613e]'
                      : 'text-[#6c7d6d] hover:text-[#273829] hover:bg-[#f1efe5]'
                  }`}
                >
                  {musicSnap.repeatMode === 'one' ? (
                    <Repeat1 className="w-4 h-4" />
                  ) : (
                    <Repeat className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Seek Timeline + Music Volume */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 flex items-center gap-2.5 text-[11px] font-mono text-[#5e7260]">
                <span className="w-9">{formatTime(musicSnap.currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={musicSnap.duration > 0 ? musicSnap.duration : 100}
                  step={0.5}
                  value={musicSnap.duration > 0 ? musicSnap.currentTime : 0}
                  onChange={(e) => healingPlaylist.seek(parseFloat(e.target.value))}
                  className="w-full accent-[#46613e] h-1.5 rounded-lg bg-[#dce2d5] cursor-pointer"
                />
                <span className="w-9 text-right">
                  {musicSnap.duration > 0 ? formatTime(musicSnap.duration) : currentTrack.durationHint}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:w-36">
                <Volume2 className="w-3.5 h-3.5 text-[#46613e] shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={musicSnap.volume}
                  onChange={(e) => healingPlaylist.setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#46613e] h-1.5 rounded-lg bg-[#dce2d5] cursor-pointer"
                />
              </div>
            </div>

            {musicSnap.error && (
              <p className="text-xs text-[#b55a44]">{musicSnap.error}</p>
            )}
          </div>
        )}

        {/* Tracklist Grid */}
        {musicSnap.tracks.length === 0 && !musicSnap.isSyncingOnline ? (
          <div className="p-6 rounded-2xl bg-[#faf7ef] border border-[#e0ddd0] text-center space-y-2">
            <p className="text-xs sm:text-sm text-[#4e624f]">
              Không tìm thấy bài hát nào khớp với từ khóa “{musicSnap.onlineQuery}”.
            </p>
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-3.5 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition"
            >
              Xem toàn bộ danh sách nhạc
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {musicSnap.tracks.map((track, idx) => {
            const isActive = track.id === musicSnap.currentTrackId;
            const isTrackPlaying = isActive && musicSnap.isPlaying;

            return (
              <div
                key={track.id}
                className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${
                  isActive
                    ? 'bg-[#e6efe2] border-[#46613e] shadow-sm'
                    : 'bg-[#faf7ef] border-[#e0ddd0] hover:border-[#a7b8a1]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    isActive
                      ? healingPlaylist.togglePlay()
                      : healingPlaylist.playTrack(track.id)
                  }
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                      isTrackPlaying
                        ? 'bg-[#46613e] text-white'
                        : isActive
                        ? 'bg-white text-[#46613e] border border-[#b9cbb3]'
                        : 'bg-[#eef2e9] text-[#556b56] group-hover:bg-[#46613e] group-hover:text-white'
                    }`}
                  >
                    {isTrackPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-[#6d7c6d]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#243627] truncate">
                        {track.title}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5e7260] mt-0.5">
                      <span className="truncate">{track.artist}</span>
                      <span>·</span>
                      <span className="text-[#46613e] font-medium">{track.tag}</span>
                      <span>·</span>
                      <span>{track.sourceLabel}</span>
                      {track.isSavedOnWeb && (
                        <>
                          <span>·</span>
                          <span className="text-[#345931] font-semibold">Đã lưu trên web</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-mono text-[#5e7260]">
                    {track.durationHint}
                  </span>
                  {track.sourceUrl && (
                    <a
                      href={track.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-[#6a7c6b] hover:text-[#46613e] hover:bg-white/70 transition"
                      title="Mở trên SoundCloud"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {(track.isCustom || track.isSavedOnWeb) && (
                    <button
                      type="button"
                      onClick={() =>
                        track.isCustom
                          ? healingPlaylist.removeCustomTrack(track.id)
                          : void healingPlaylist.removeSavedTrack(track.id)
                      }
                      className="p-1.5 rounded-lg text-[#8c7a72] hover:text-[#b55a44] hover:bg-white/70 transition"
                      title={track.isCustom ? 'Gỡ bài nhạc tự thêm' : 'Gỡ khỏi danh sách đã lưu trên web'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {musicSnap.isSyncingOnline && (
          <div className="text-xs text-[#46613e] font-medium">
            Đang kết nối SoundCloud để tìm kiếm & tự động thêm nhạc vào web...
          </div>
        )}

        <p className="text-[11px] text-[#607562] leading-relaxed">
          Khi bạn nhập tên bài hát và nhấn <strong>Tìm & Lưu</strong>, Heali tự động lấy luồng phát từ <strong>SoundCloud</strong> và lưu thẳng vào danh sách nhạc trên web (hỗ trợ phát HLS trực tiếp, kết hợp kho nhạc bản quyền mở ngoại tuyến & nút <strong>Thêm MP3</strong>).
        </p>
      </div>

      {/* Atmospheric Natural Soundscape Presets */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-[#273829] block">
          Hòa thêm thanh âm tự nhiên (hoạt động ngoại tuyến)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'rain_lake' as const, label: 'Mưa nhẹ mặt hồ', desc: 'Mưa rào & tiếng sóng vỗ' },
            { id: 'piano_lullaby' as const, label: 'Khúc ru Piano', desc: 'Giai điệu đàn êm đềm' },
            { id: 'night_garden' as const, label: 'Vườn cây tĩnh lặng', desc: 'Tiếng gió & chuông nhẹ' },
            { id: 'warm_hearth' as const, label: 'Bên bếp lửa ấm', desc: 'Tiếng củi bập bùng ấm áp' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id)}
              className={`p-3 rounded-2xl border text-left transition ${
                activePreset === p.id && isPlaying
                  ? 'border-[#46613e] bg-[#e6efe2] shadow-sm'
                  : 'border-[#dfe2d5] bg-[#f1efe5] hover:border-[#a2b39c]'
              }`}
            >
              <div className="text-xs font-bold text-[#243627] mb-0.5">{p.label}</div>
              <div className="text-[10px] text-[#5e7260] leading-tight">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Sound Channel Sliders */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-[#273829] block">
          Tùy chỉnh riêng các lớp thanh âm thiên nhiên
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const val = volumes[ch.key];

            return (
              <div
                key={ch.key}
                className="p-3.5 rounded-2xl bg-[#f1efe5] border border-[#dfe2d5] flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#dce0d4] flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${ch.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[11px] text-[#273829] mb-1">
                    <span className="font-medium truncate">{ch.label}</span>
                    <span className="font-mono text-[#5e7260]">{Math.round(val * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={val}
                    onChange={(e) => handleVolumeChange(ch.key, parseFloat(e.target.value))}
                    className="w-full accent-[#46613e] h-1.5 rounded-lg bg-[#dce2d5] cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sleep Timer & Master Ambient Volume */}
      <div className="pt-4 border-t border-[#e5e3d8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#273829]">
            <Clock className="w-4 h-4 text-[#46613e]" />
            <span>Hẹn giờ tắt cả nhạc & âm thanh:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0, 15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSetTimer(mins)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  timerMins === mins
                    ? 'bg-[#46613e] text-white border border-[#46613e]'
                    : 'bg-[#f1efe5] text-[#4b604d] hover:text-[#273829] border border-[#dcdad0]'
                }`}
              >
                {mins === 0 ? 'Tắt' : `${mins} phút`}
              </button>
            ))}
          </div>

          {remainingTimer > 0 && (
            <span className="text-xs font-mono text-[#46613e] font-semibold ml-1">
              Còn {formatTime(remainingTimer)}
            </span>
          )}
        </div>

        {/* Master ambient slider */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Volume2 className="w-4 h-4 text-[#46613e]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volumes.master}
            onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
            className="w-full accent-[#46613e] h-1.5 rounded-lg bg-[#dce2d5] cursor-pointer"
          />
          <span className="font-mono text-xs text-[#5e7260] w-8 text-right">
            {Math.round(volumes.master * 100)}%
          </span>
        </div>
      </div>
    </section>
  );
};
