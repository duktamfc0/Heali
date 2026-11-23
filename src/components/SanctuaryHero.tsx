import React, { useState, useEffect, useRef } from 'react';
import type { Lantern } from '../services/api';
import { api } from '../services/api';
import {
  Sparkles,
  Flame,
  Waves,
  Heart,
  X,
  Plus,
  Send,
  Feather,
  Compass,
} from 'lucide-react';

interface SanctuaryHeroProps {
  onOpenFloatModal: () => void;
  onOpenWriteLetter: () => void;
  onNavigateTab: (tab: 'lake' | 'community' | 'journal' | 'letters' | 'wishes') => void;
}

export const SanctuaryHero: React.FC<SanctuaryHeroProps> = ({
  onOpenFloatModal,
  onOpenWriteLetter,
  onNavigateTab,
}) => {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [selectedLantern, setSelectedLantern] = useState<Lantern | null>(null);
  const [ripplingId, setRipplingId] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const lakeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLanterns();
    const interval = setInterval(loadLanterns, 16000);
    return () => clearInterval(interval);
  }, []);

  const loadLanterns = async () => {
    try {
      const list = await api.getLanterns();
      setLanterns(list);
    } catch {
      // ignore
    }
  };

  const handleLakeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lakeRef.current) return;
    const rect = lakeRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev.slice(-6), newRipple]);
  };

  const handleRippleLantern = async (lantern: Lantern, e: React.MouseEvent) => {
    e.stopPropagation();
    setRipplingId(lantern.id);
    const updated = await api.rippleLantern(lantern.id);
    setLanterns(prev => prev.map(l => (l.id === lantern.id ? { ...l, ripples: updated } : l)));
    if (selectedLantern && selectedLantern.id === lantern.id) {
      setSelectedLantern({ ...selectedLantern, ripples: updated });
    }
    setTimeout(() => setRipplingId(null), 1200);
  };

  const getLanternStyles = (color: Lantern['color']) => {
    switch (color) {
      case 'pink':
        return {
          core: 'bg-rose-400 border-rose-300',
          glow: 'shadow-[0_0_28px_rgba(244,114,182,0.95)]',
          halo: 'bg-rose-500/25',
          text: 'text-rose-200',
        };
      case 'lavender':
        return {
          core: 'bg-purple-400 border-purple-300',
          glow: 'shadow-[0_0_28px_rgba(192,132,252,0.95)]',
          halo: 'bg-purple-500/25',
          text: 'text-purple-200',
        };
      case 'moon':
        return {
          core: 'bg-sky-200 border-sky-100',
          glow: 'shadow-[0_0_28px_rgba(186,230,253,0.95)]',
          halo: 'bg-sky-400/20',
          text: 'text-sky-200',
        };
      case 'gold':
      default:
        return {
          core: 'bg-amber-400 border-amber-200',
          glow: 'shadow-[0_0_28px_rgba(251,191,36,0.95)]',
          halo: 'bg-amber-500/30',
          text: 'text-amber-200',
        };
    }
  };

  return (
    <section className="relative w-full rounded-[32px] overflow-hidden border border-purple-500/30 shadow-[0_20px_70px_rgba(12,13,28,0.85)] bg-[#0c0d1e]">
      {/* Interactive 2.5D Moonlit Lake Viewport */}
      <div
        ref={lakeRef}
        onClick={handleLakeClick}
        className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] w-full cursor-pointer select-none overflow-hidden bg-gradient-to-b from-[#090a18] via-[#131432] to-[#0c0e22]"
      >
        {/* Soft Celestial Glow & Fog Layers */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-950/20 via-indigo-950/30 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Shimmering Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(36)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                top: `${(i * 17) % 52}%`,
                left: `${(i * 29) % 97}%`,
                width: `${(i % 3) + 1.2}px`,
                height: `${(i % 3) + 1.2}px`,
                opacity: 0.25 + ((i % 5) * 0.16),
                animationDuration: `${3.5 + (i % 4)}s`,
                animationDelay: `${(i * 0.3)}s`,
              }}
            />
          ))}
        </div>

        {/* Soft Golden Fireflies (Đom Đóm Đêm) */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { top: 28, left: 18, delay: 0 },
            { top: 42, left: 32, delay: 1.8 },
            { top: 35, left: 78, delay: 0.9 },
            { top: 58, left: 62, delay: 2.4 },
            { top: 68, left: 24, delay: 3.1 },
            { top: 48, left: 88, delay: 1.2 },
          ].map((ff, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_12px_#fde047] animate-float-gentle"
              style={{
                top: `${ff.top}%`,
                left: `${ff.left}%`,
                animationDuration: `${5 + i}s`,
                animationDelay: `${ff.delay}s`,
                opacity: 0.75,
              }}
            />
          ))}
        </div>

        {/* Luminous Crescent Moon with Soft Halo */}
        <div className="absolute top-8 right-6 sm:right-16 pointer-events-none flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-amber-200/15 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-100 via-amber-200 to-amber-50 shadow-[0_0_50px_rgba(253,230,138,0.5)]">
            {/* Crater shadows */}
            <div className="absolute top-4 left-5 w-4 h-4 rounded-full bg-amber-200/40" />
            <div className="absolute top-9 left-10 w-6 h-6 rounded-full bg-amber-200/30" />
            <div className="absolute bottom-5 left-7 w-3 h-3 rounded-full bg-amber-200/40" />
          </div>
          {/* Vertical Moonlit Reflection Beam on Water */}
          <div className="absolute top-28 right-8 w-16 h-80 bg-gradient-to-b from-amber-100/20 via-amber-200/5 to-transparent blur-lg transform -skew-x-12 pointer-events-none" />
        </div>

        {/* Weeping Willow Foliage on Top Left */}
        <div className="absolute top-0 left-0 pointer-events-none opacity-70">
          <svg width="280" height="230" viewBox="0 0 280 230" fill="none" className="text-purple-950/90">
            <path d="M0,0 Q80,40 140,10 Q180,60 220,30 Q250,90 280,60" stroke="currentColor" strokeWidth="3" />
            <path d="M30,10 Q45,90 25,160 M70,20 Q85,110 65,190 M120,15 Q140,115 115,180 M180,30 Q195,120 170,200" stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Rolling Ethereal Mist across Lake Horizon */}
        <div className="absolute inset-x-0 bottom-44 h-32 bg-gradient-to-t from-purple-950/25 to-transparent blur-xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

        {/* Water Surface Plane */}
        <div className="absolute inset-x-0 bottom-0 h-64 sm:h-72 bg-gradient-to-b from-[#121435]/80 via-[#0d0f28] to-[#070818] border-t border-purple-500/25">
          {/* Shimmering water ripples */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute top-8 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse" />
            <div className="absolute top-20 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" style={{ animationDuration: '4s' }} />
            <div className="absolute top-36 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-pulse" style={{ animationDuration: '5s' }} />
          </div>

          {/* User Tap Interactive Wave Ripples */}
          {ripples.map(rip => (
            <div
              key={rip.id}
              className="absolute pointer-events-none rounded-full border border-amber-300/70 animate-ping"
              style={{
                left: `${rip.x}%`,
                top: `${rip.y}%`,
                width: '70px',
                height: '28px',
                transform: 'translate(-50%, -50%)',
                animationDuration: '1.4s',
              }}
            />
          ))}

          {/* Floating Lanterns with gentle bobbing motion */}
          {lanterns.map((lantern, idx) => {
            const styles = getLanternStyles(lantern.color);
            const isSelected = selectedLantern?.id === lantern.id;

            return (
              <div
                key={lantern.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLantern(lantern);
                }}
                className="absolute cursor-pointer transition-transform hover:scale-125 active:scale-95 group"
                style={{
                  left: `${lantern.x}%`,
                  top: `${lantern.y}%`,
                  transform: 'translate(-50%, -50%)',
                  animation: `lanternFloat ${7 + (idx % 4)}s ease-in-out infinite`,
                  animationDelay: `${(idx * 0.65)}s`,
                  zIndex: isSelected ? 30 : 10 + Math.floor(lantern.y),
                }}
              >
                {/* Water halo reflection */}
                <div className={`absolute -inset-4 rounded-full ${styles.halo} blur-md animate-pulse`} />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-black/40 blur-xs" />

                {/* Lotus Lantern Core */}
                <div className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full ${styles.core} ${styles.glow} border`}>
                  {/* Candle wick flame */}
                  <div className="w-2.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_#fff] animate-glow-pulse" />
                  {/* Lotus petals base */}
                  <div className="absolute -bottom-1 inset-x-0 flex justify-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
                    <span className="w-2 h-2 rounded-full bg-purple-400/90 -mt-0.5" />
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
                  </div>
                </div>

                {/* Ripple badge count */}
                {lantern.ripples > 1 && (
                  <div className="absolute -top-3.5 -right-2 px-1.5 py-0.5 rounded-full bg-[#181932] border border-amber-300/40 text-[10px] font-medium text-amber-200 flex items-center gap-0.5 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>{lantern.ripples}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Foreground Content: Hero Typography & Sanctuary Intentions */}
        <div className="relative z-20 pt-10 sm:pt-14 px-6 sm:px-12 max-w-3xl pointer-events-none">
          {/* Sanctuary Mood Beacon */}
          <div className="inline-flex items-center gap-2.5 rounded-full bg-[#161734]/85 backdrop-blur-md px-4 py-1.5 border border-purple-400/30 text-xs font-medium text-purple-200 shadow-xl mb-4 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Hồ Trăng An Trú • Đêm nay bạn không đơn độc</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-serif-healing tracking-tight leading-[1.18] drop-shadow-md">
            Ở đây, bạn <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-purple-200">
              không cần phải tỏ ra ổn.
            </span>
          </h1>

          {/* Poetic Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-purple-100/85 font-serif-healing leading-relaxed max-w-2xl drop-shadow">
            Dành cho những đêm dài chênh vênh khi nỗi buồn không biết tỏ cùng ai. Hãy để lòng mình thả trôi theo ánh trăng và những ngọn đèn ấm. Bạn đã luôn nỗ lực rất nhiều rồi, giờ là lúc được nghỉ ngơi.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3.5 pointer-events-auto">
            <button
              onClick={onOpenFloatModal}
              className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-rose-950/60 hover:opacity-95 hover:scale-[1.03] active:scale-[0.98] transition"
            >
              <Flame className="w-5 h-5 text-amber-200 animate-pulse" />
              <span>Thả một hoa đăng</span>
            </button>

            <button
              onClick={onOpenWriteLetter}
              className="flex items-center gap-2 rounded-2xl bg-[#1a1b38]/85 backdrop-blur-md border border-purple-400/40 px-5 py-3.5 text-sm sm:text-base font-semibold text-purple-200 hover:text-white hover:border-amber-300/80 hover:bg-[#202244] transition shadow-lg"
            >
              <Feather className="w-4 h-4 text-amber-300" />
              <span>Viết điều chưa nói</span>
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-purple-300/75 pointer-events-auto">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Chạm vào mặt nước để tạo sóng hoặc nhấn vào hoa đăng để gửi lời chúc lành.
            </span>
          </div>
        </div>
      </div>

      {/* Selected Lantern View Drawer */}
      {selectedLantern && (
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#15162e] to-[#0f1022] border-t border-purple-500/30 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${getLanternStyles(selectedLantern.color).core} shadow-md`}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  Lời thầm thì từ <span className="text-amber-200">{selectedLantern.authorNickname}</span>
                </div>
                <div className="text-xs text-purple-300/70">
                  Thả trôi vào {new Date(selectedLantern.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedLantern(null)}
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/30 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-[#1d1f3d]/60 border border-purple-500/20 text-purple-100 font-serif-healing italic text-sm sm:text-base leading-relaxed">
            "{selectedLantern.message}"
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-purple-300/80 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-300" />
              <span>Đã nhận được <strong>{selectedLantern.ripples}</strong> gợn sóng yêu thương</span>
            </div>

            <button
              onClick={(e) => handleRippleLantern(selectedLantern, e)}
              disabled={ripplingId === selectedLantern.id}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-lg shadow-purple-950/40 hover:from-purple-600 hover:to-indigo-500 transition active:scale-95 disabled:opacity-50"
            >
              <Heart className={`w-4 h-4 text-rose-300 ${ripplingId === selectedLantern.id ? 'animate-ping' : ''}`} />
              <span>Gửi một gợn sóng vỗ về</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
