import React, { useState, useEffect } from 'react';
import { soundEngine } from '../services/soundEngine';
import { healingPlaylist, type MusicPlayerSnapshot } from '../services/musicPlaylistService';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Flame,
  Wind,
  Bell,
  Sparkles,
  Clock,
  X,
  Music2,
  Play,
  Pause,
  SkipForward,
} from 'lucide-react';

type BreathPhase = 'inhale' | 'hold' | 'exhale';

export const AudioPlayerDrawer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(soundEngine.getIsPlaying());
  const [musicSnap, setMusicSnap] = useState<MusicPlayerSnapshot>(() => healingPlaylist.getSnapshot());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [volumes, setVolumes] = useState(soundEngine.getVolumes());
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0);
  const [remainingTimer, setRemainingTimer] = useState(0);

  // Guided 4-7-8 Breathing Timer State
  const [breathActive, setBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);
  const [breathCycles, setBreathCycles] = useState(0);

  useEffect(() => {
    setVolumes(soundEngine.getVolumes());
    const unsub = soundEngine.subscribe((active) => {
      setIsPlaying(active);
    });
    const unsubMusic = healingPlaylist.subscribe((snap) => {
      setMusicSnap(snap);
    });
    const onOpenBreathing = () => {
      setBreathPhase('inhale');
      setBreathSecondsLeft(4);
      setBreathActive(true);
      setIsBreathingOpen(true);
    };
    window.addEventListener('heali:open-breathing', onOpenBreathing);
    return () => {
      unsub();
      unsubMusic();
      window.removeEventListener('heali:open-breathing', onOpenBreathing);
    };
  }, []);

  useEffect(() => {
    if (!isBreathingOpen || !breathActive) return;

    const timer = window.setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        setBreathPhase((currPhase) => {
          if (currPhase === 'inhale') {
            setBreathSecondsLeft(7);
            return 'hold';
          }
          if (currPhase === 'hold') {
            setBreathSecondsLeft(8);
            return 'exhale';
          }
          setBreathCycles((c) => c + 1);
          setBreathSecondsLeft(4);
          return 'inhale';
        });
        return 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isBreathingOpen, breathActive]);

  const handleTogglePlay = () => {
    const active = soundEngine.toggle();
    setIsPlaying(active);
  };

  const handleVolumeChange = (channel: keyof typeof volumes, val: number) => {
    soundEngine.setVolume(channel, val);
    setVolumes(soundEngine.getVolumes());
  };

  const handleSelectPreset = (
    preset: 'rain_lake' | 'night_garden' | 'warm_hearth' | 'deep_zen'
  ) => {
    soundEngine.applyPreset(preset);
    setVolumes(soundEngine.getVolumes());
    if (!isPlaying) {
      soundEngine.start();
      setIsPlaying(true);
    }
  };

  const handleSetTimer = (mins: number) => {
    setSleepTimerMinutes(mins);
    soundEngine.setSleepTimer(mins, (rem) => {
      setRemainingTimer(rem);
      if (rem <= 0) {
        setIsPlaying(false);
        setSleepTimerMinutes(0);
        healingPlaylist.pause();
      }
    });
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const openBreathingModal = () => {
    setBreathPhase('inhale');
    setBreathSecondsLeft(4);
    setBreathActive(true);
    setIsBreathingOpen(true);
  };

  const closeBreathingModal = () => {
    setBreathActive(false);
    setIsBreathingOpen(false);
  };

  const channelMeta = [
    { key: 'rain' as const, label: 'Mưa nhẹ tí tách', icon: CloudRain, color: 'text-[#4d7588]' },
    { key: 'piano' as const, label: 'Khúc ru Piano êm dịu', icon: Sparkles, color: 'text-[#b56652]' },
    { key: 'waves' as const, label: 'Sóng nước vỗ về', icon: Waves, color: 'text-[#487a71]' },
    { key: 'fire' as const, label: 'Lửa sưởi ấm áp', icon: Flame, color: 'text-[#c27e38]' },
    { key: 'chimes' as const, label: 'Tiếng gió & chuông thanh', icon: Wind, color: 'text-[#46613e]' },
    { key: 'bowl' as const, label: 'Chuông ngân thư thái', icon: Bell, color: 'text-[#5b744d]' },
    { key: 'crickets' as const, label: 'Thanh âm vườn êm ả', icon: Sparkles, color: 'text-[#877c4e]' },
  ];

  const breathPhaseCopy: Record<BreathPhase, { title: string; guide: string; scaleClass: string }> = {
    inhale: {
      title: 'Hít vào thật chậm',
      guide: 'Đón luồng gió mát lành vào lồng ngực trong 4 giây.',
      scaleClass: 'scale-110 bg-[#dce8d7] border-[#46613e]',
    },
    hold: {
      title: 'Giữ nhịp nhẹ nhàng',
      guide: 'Để sự tĩnh lặng lan tỏa khắp cơ thể trong 7 giây.',
      scaleClass: 'scale-110 bg-[#e6efe2] border-[#5f7d57]',
    },
    exhale: {
      title: 'Thở ra buông lỏng',
      guide: 'Nhẹ nhàng thả trôi mọi căng thẳng trong 8 giây.',
      scaleClass: 'scale-90 bg-[#f0eee3] border-[#96a791]',
    },
  };

  const currentTrack =
    musicSnap.tracks.find((t) => t.id === musicSnap.currentTrackId) || musicSnap.tracks[0];
  const anyPlaying = isPlaying || musicSnap.isPlaying;

  return (
    <>
      {/* Clean Cream/Sage Bottom Audio & Breathing Bar */}
      <div className="fixed bottom-[4.5rem] lg:bottom-3 inset-x-3 sm:inset-x-6 z-40 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl bg-[#fafaf4]/96 dark:bg-[#1b241d]/96 border border-[#dfe3d6] dark:border-[#324236] shadow-lg text-[#273829] dark:text-[#edf2e8]">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => healingPlaylist.togglePlay()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 ${
                musicSnap.isPlaying
                  ? 'bg-[#46613e] text-white shadow-sm'
                  : 'bg-[#ebf0e5] dark:bg-[#243227] text-[#46613e] dark:text-[#98c18e] hover:bg-[#e1e8da] dark:hover:bg-[#2c3c2f]'
              }`}
              title={musicSnap.isPlaying ? 'Tạm dừng nhạc chữa lành' : 'Phát nhạc chữa lành'}
              aria-label={musicSnap.isPlaying ? 'Tạm dừng nhạc chữa lành' : 'Phát nhạc chữa lành'}
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
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-[#556b56] dark:text-[#b0c0b2] hover:bg-[#ebf0e5] dark:hover:bg-[#243227] hover:text-[#273829] dark:hover:text-[#edf2e8] transition shrink-0"
              title="Chuyển bài tiếp theo"
              aria-label="Chuyển bài tiếp theo"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-left min-w-0 group"
            >
              <div className="text-sm font-semibold text-[#273829] dark:text-[#edf2e8] truncate group-hover:text-[#46613e] dark:group-hover:text-[#98c18e] transition">
                {musicSnap.isPlaying && currentTrack ? currentTrack.title : 'Nhạc chữa lành & Tiếng gió dịu'}
              </div>
              <div className="text-xs text-[#6d7c6d] dark:text-[#a6b7a8] truncate flex items-center gap-2">
                <span>
                  {musicSnap.isPlaying && currentTrack
                    ? `${currentTrack.artist} · Chạm để chọn bài`
                    : anyPlaying
                    ? 'Đang phát thanh âm · Chạm để mở danh sách nhạc'
                    : 'Chạm nút phát hoặc mở danh sách nhạc chữa lành'}
                </span>
                {remainingTimer > 0 && (
                  <span className="font-mono text-[#46613e] dark:text-[#98c18e] font-medium tabular-nums">
                    · {formatTimer(remainingTimer)}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition ${
                isPlaying
                  ? 'bg-[#e6efe2] dark:bg-[#263829] text-[#46613e] dark:text-[#98c18e]'
                  : 'text-[#6c7d6d] dark:text-[#a6b7a8] hover:bg-[#eef2e8] dark:hover:bg-[#243227] hover:text-[#273829] dark:hover:text-[#edf2e8]'
              }`}
              title={isPlaying ? 'Tắt tiếng mưa & gió' : 'Bật tiếng mưa & gió'}
              aria-label={isPlaying ? 'Tắt tiếng mưa & gió' : 'Bật tiếng mưa & gió'}
            >
              {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={openBreathingModal}
              className="min-h-[40px] shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#eef2e8] dark:hover:bg-[#243227] text-[#46613e] dark:text-[#98c18e] text-xs font-semibold transition whitespace-nowrap"
            >
              <Wind className="w-4 h-4" />
              <span className="hidden sm:inline">Thở cùng Heali</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guided 4-7-8 Breathing Modal ("Thở cùng Heali") */}
      {isBreathingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#faf7ef] border border-[#dcdad0] p-6 shadow-2xl text-[#273829] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e4d8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e6efe2] flex items-center justify-center text-[#46613e]">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-serif-healing">Thở cùng Heali</h3>
                  <p className="text-[11px] text-[#5e7260]">Nhịp thở 4 - 7 - 8 giúp dịu hệ thần kinh</p>
                </div>
              </div>
              <button
                onClick={closeBreathingModal}
                className="p-1.5 rounded-lg text-[#5e7260] hover:text-[#273829]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
              <div
                className={`w-36 h-36 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-1000 shadow-inner ${breathPhaseCopy[breathPhase].scaleClass}`}
              >
                <span className="text-3xl font-bold font-mono text-[#273829]">
                  {breathSecondsLeft}s
                </span>
                <span className="text-xs font-semibold text-[#46613e] mt-1">
                  {breathPhaseCopy[breathPhase].title}
                </span>
              </div>

              <p className="text-xs text-[#4b604d] font-serif-healing italic max-w-xs leading-relaxed">
                {breathPhaseCopy[breathPhase].guide}
              </p>

              <div className="text-[11px] text-[#6d7c6d]">
                Đã hoàn thành {breathCycles} nhịp thở sâu
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setBreathActive((prev) => !prev)}
                className="flex-1 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition shadow-sm"
              >
                {breathActive ? 'Tạm dừng nhịp thở' : 'Tiếp tục thở'}
              </button>
              <button
                type="button"
                onClick={closeBreathingModal}
                className="px-4 py-2.5 rounded-xl bg-[#ecefe5] hover:bg-[#e1e6d8] text-[#273829] text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Sound Mixer Drawer */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1c281e]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#faf7ef] border border-[#dcdad0] p-6 shadow-2xl text-[#273829]">
            <div className="flex items-center justify-between pb-4 border-b border-[#e6e4d8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e6efe2] flex items-center justify-center text-[#46613e]">
                  <Music2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#273829] font-serif-healing">
                    Bộ Hòa Âm Chữa Lành
                  </h3>
                  <p className="text-[11px] text-[#5e7260]">
                    Âm thanh tự nhiên đa tầng, hoạt động ngoại tuyến nhẹ nhàng.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-[#5e7260] hover:text-[#273829]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Healing Music Playlist */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#273829]">
                  Danh sách nhạc chữa lành
                </span>
                <span className="text-[11px] text-[#5e7260]">
                  {musicSnap.tracks.length} bản nhạc
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {musicSnap.tracks.map((track) => {
                  const active = track.id === musicSnap.currentTrackId;
                  const playingThis = active && musicSnap.isPlaying;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() =>
                        active
                          ? healingPlaylist.togglePlay()
                          : healingPlaylist.playTrack(track.id)
                      }
                      className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl border text-left transition ${
                        active
                          ? 'bg-[#e6efe2] border-[#46613e]'
                          : 'bg-[#f1efe5] border-[#dcdad0] hover:border-[#a2b39c]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            playingThis
                              ? 'bg-[#46613e] text-white'
                              : 'bg-white text-[#46613e] border border-[#dce0d4]'
                          }`}
                        >
                          {playingThis ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#273829] truncate">
                            {track.title}
                          </div>
                          <div className="text-[10px] text-[#5e7260] truncate">
                            {track.artist} · {track.sourceLabel}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#5e7260] shrink-0">
                        {track.durationHint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-[#273829] block mb-2">
                Hòa thêm thanh âm tự nhiên
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectPreset('rain_lake')}
                  className="p-2.5 rounded-xl bg-[#f1efe5] border border-[#dcdad0] hover:border-[#46613e] text-left text-xs transition"
                >
                  <span className="font-semibold text-[#273829] block">Mưa nhẹ mặt hồ</span>
                  <span className="text-[10px] text-[#607562]">Mưa rào & sóng nước lăn tăn</span>
                </button>
                <button
                  onClick={() => handleSelectPreset('night_garden')}
                  className="p-2.5 rounded-xl bg-[#f1efe5] border border-[#dcdad0] hover:border-[#46613e] text-left text-xs transition"
                >
                  <span className="font-semibold text-[#273829] block">Khu vườn tĩnh lặng</span>
                  <span className="text-[10px] text-[#607562]">Tiếng gió & chuông nhẹ êm ái</span>
                </button>
                <button
                  onClick={() => handleSelectPreset('warm_hearth')}
                  className="p-2.5 rounded-xl bg-[#f1efe5] border border-[#dcdad0] hover:border-[#46613e] text-left text-xs transition"
                >
                  <span className="font-semibold text-[#273829] block">Bên bếp lửa ấm</span>
                  <span className="text-[10px] text-[#607562]">Tí tách ngọn lửa vỗ về</span>
                </button>
                <button
                  onClick={() => handleSelectPreset('deep_zen')}
                  className="p-2.5 rounded-xl bg-[#f1efe5] border border-[#dcdad0] hover:border-[#46613e] text-left text-xs transition"
                >
                  <span className="font-semibold text-[#273829] block">Thả lỏng sâu lắng</span>
                  <span className="text-[10px] text-[#607562]">Chuông xoay 216Hz thanh tịnh</span>
                </button>
              </div>
            </div>

            {/* Master Volume */}
            <div className="mt-5 p-3.5 rounded-2xl bg-[#f1efe5] border border-[#dfe2d6] flex items-center gap-3">
              <button
                onClick={() => handleVolumeChange('master', volumes.master > 0 ? 0 : 0.7)}
                className="text-[#46613e] hover:text-[#273829]"
              >
                {volumes.master > 0 ? (
                  <Volume2 className="w-5 h-5 text-[#46613e]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-[#7a877a]" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-[#273829] mb-1">
                  <span className="font-medium">Âm lượng tổng</span>
                  <span className="font-mono">{Math.round(volumes.master * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volumes.master}
                  onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                  className="w-full accent-[#46613e] h-1.5 rounded-lg bg-[#dde3d6] cursor-pointer"
                />
              </div>
            </div>

            {/* Individual Channels */}
            <div className="mt-4 space-y-2.5">
              <span className="text-xs font-semibold text-[#273829] block">
                Tùy chỉnh riêng từng thanh âm
              </span>
              <div className="space-y-2">
                {channelMeta.map((ch) => {
                  const Icon = ch.icon;
                  const val = volumes[ch.key];

                  return (
                    <div
                      key={ch.key}
                      className="p-2.5 rounded-xl bg-[#f1efe5] border border-[#e3e5da] flex items-center gap-3"
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${ch.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[11px] text-[#273829] mb-1">
                          <span className="truncate font-medium">{ch.label}</span>
                          <span className="font-mono text-[#5e7260]">{Math.round(val * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.02"
                          value={val}
                          onChange={(e) => handleVolumeChange(ch.key, parseFloat(e.target.value))}
                          className="w-full accent-[#46613e] h-1 rounded-lg bg-[#dde3d6] cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sleep Timer */}
            <div className="mt-5 pt-4 border-t border-[#e6e4d8]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#273829]">
                  <Clock className="w-3.5 h-3.5 text-[#46613e]" />
                  <span>Hẹn giờ tắt tự động</span>
                </div>
                {remainingTimer > 0 && (
                  <span className="text-xs font-mono text-[#46613e]">
                    Còn {formatTimer(remainingTimer)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {[0, 15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSetTimer(mins)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                      sleepTimerMinutes === mins
                        ? 'bg-[#46613e] text-white border border-[#46613e]'
                        : 'bg-[#f1efe5] text-[#4b604d] hover:text-[#273829] border border-[#dcdad0]'
                    }`}
                  >
                    {mins === 0 ? 'Tắt' : `${mins}p`}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Action Button */}
            <div className="mt-5">
              <button
                onClick={handleTogglePlay}
                className="w-full py-2.5 rounded-2xl bg-[#46613e] hover:bg-[#384f31] text-white font-semibold text-sm shadow-md transition"
              >
                {isPlaying ? 'Tạm dừng thanh âm' : 'Bật tiếng gió dịu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
