import React, { useState, useEffect, useRef } from 'react';
import type { Lantern } from '../services/api';
import { api } from '../services/api';
import { Sparkles, Heart, Waves, Plus, Eye, X, MessageCircleHeart } from 'lucide-react';

interface SanctuaryLakeProps {
  onOpenFloatModal: () => void;
  onOpenConfessions: () => void;
  onOpenWishes: () => void;
}

export const SanctuaryLake: React.FC<SanctuaryLakeProps> = ({
  onOpenFloatModal,
  onOpenConfessions,
  onOpenWishes,
}) => {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [selectedLantern, setSelectedLantern] = useState<Lantern | null>(null);
  const [ripplingId, setRipplingId] = useState<string | null>(null);
  const [interactiveRipples, setInteractiveRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const fetchLanterns = async () => {
    try {
      const list = await api.getLanterns();
      setLanterns(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLanterns();
    const interval = setInterval(fetchLanterns, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLakeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newRipple = { id: Date.now(), x, y };
    setInteractiveRipples(prev => [...prev.slice(-6), newRipple]);
  };

  const handleRippleLantern = async (lantern: Lantern, e: React.MouseEvent) => {
    e.stopPropagation();
    setRipplingId(lantern.id);
    const updatedRipples = await api.rippleLantern(lantern.id);
    setLanterns(prev => prev.map(l => l.id === lantern.id ? { ...l, ripples: updatedRipples } : l));
    if (selectedLantern && selectedLantern.id === lantern.id) {
      setSelectedLantern({ ...selectedLantern, ripples: updatedRipples });
    }
    setTimeout(() => setRipplingId(null), 1200);
  };

  const getLanternColorClasses = (color: Lantern['color']) => {
    switch (color) {
      case 'pink':
        return {
          bg: 'bg-rose-400',
          glow: 'shadow-[0_0_24px_rgba(244,114,182,0.85)]',
          border: 'border-rose-300',
          halo: 'bg-rose-500/20',
          text: 'text-rose-200',
        };
      case 'lavender':
        return {
          bg: 'bg-purple-400',
          glow: 'shadow-[0_0_24px_rgba(192,132,252,0.85)]',
          border: 'border-purple-300',
          halo: 'bg-purple-500/20',
          text: 'text-purple-200',
        };
      case 'moon':
        return {
          bg: 'bg-blue-200',
          glow: 'shadow-[0_0_24px_rgba(191,219,254,0.9)]',
          border: 'border-blue-100',
          halo: 'bg-blue-400/20',
          text: 'text-blue-100',
        };
      case 'gold':
      default:
        return {
          bg: 'bg-amber-400',
          glow: 'shadow-[0_0_24px_rgba(251,191,36,0.9)]',
          border: 'border-amber-200',
          halo: 'bg-amber-500/25',
          text: 'text-amber-200',
        };
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-purple-900/40 bg-[#0d0e1c] shadow-2xl transition-all">
      {/* Visual Sky & Celestial Backdrop */}
      <div
        ref={canvasRef}
        onClick={handleLakeClick}
        className="relative h-[380px] sm:h-[460px] w-full cursor-pointer select-none overflow-hidden bg-gradient-to-b from-[#0a0a18] via-[#12132e] to-[#0c0d1c]"
      >
        {/* Distant Mountains / Horizon Silhouette */}
        <div className="absolute inset-x-0 bottom-36 h-28 opacity-40 pointer-events-none">
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="w-full h-full fill-[#070814]">
            <path d="M0,120 Q200,40 450,110 T900,60 Q1050,100 1200,80 L1200,200 L0,200 Z" />
          </svg>
        </div>

        {/* Shimmering Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                top: `${(i * 19) % 55}%`,
                left: `${(i * 37) % 96}%`,
                width: `${(i % 3) + 1.5}px`,
                height: `${(i % 3) + 1.5}px`,
                opacity: 0.3 + ((i % 5) * 0.15),
                animationDuration: `${3 + (i % 4)}s`,
                animationDelay: `${(i * 0.4)}s`,
              }}
            />
          ))}
        </div>

        {/* Moon with Luminous Aura */}
        <div className="absolute top-6 right-8 sm:right-16 pointer-events-none flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full bg-amber-200/10 blur-2xl animate-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-100 via-amber-200 to-amber-50 shadow-[0_0_40px_rgba(253,230,138,0.45)]">
            {/* Crater details */}
            <div className="absolute top-3 left-4 w-3.5 h-3.5 rounded-full bg-amber-200/40" />
            <div className="absolute top-7 left-8 w-5 h-5 rounded-full bg-amber-200/30" />
            <div className="absolute bottom-4 left-5 w-2 h-2 rounded-full bg-amber-200/40" />
          </div>
          {/* Subtle Moon reflection shimmer line */}
          <div className="absolute top-24 right-6 w-12 h-44 bg-gradient-to-b from-amber-100/15 via-amber-200/5 to-transparent blur-md transform -skew-x-12" />
        </div>

        {/* Weeping Willow Foliage Silhouette on Lake Edge */}
        <div className="absolute top-0 left-0 pointer-events-none opacity-60">
          <svg width="240" height="200" viewBox="0 0 240 200" fill="none" className="text-purple-950/80">
            <path d="M0,0 Q60,30 110,10 Q140,50 170,30 Q200,90 230,60" stroke="currentColor" strokeWidth="3" />
            <path d="M20,10 Q35,80 15,140 M50,20 Q65,100 45,170 M90,15 Q110,95 85,160 M140,30 Q150,110 130,180" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Water Surface Plane */}
        <div className="absolute inset-x-0 bottom-0 h-52 sm:h-64 bg-gradient-to-b from-[#11132b]/80 via-[#0d0f24] to-[#070815] border-t border-purple-500/20">
          {/* Water wave texture ripples */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-6 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse" />
            <div className="absolute top-16 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" style={{ animationDuration: '4s' }} />
            <div className="absolute top-28 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-pulse" style={{ animationDuration: '5s' }} />
          </div>

          {/* User Tap Interactive Ripples */}
          {interactiveRipples.map(rip => (
            <div
              key={rip.id}
              className="absolute pointer-events-none rounded-full border border-amber-300/60 animate-ping"
              style={{
                left: `${rip.x}%`,
                top: `${rip.y}%`,
                width: '60px',
                height: '24px',
                transform: 'translate(-50%, -50%)',
                animationDuration: '1.4s',
              }}
            />
          ))}

          {/* Floating Lanterns on the Lake */}
          {lanterns.map((lantern, idx) => {
            const styles = getLanternColorClasses(lantern.color);
            const isSelected = selectedLantern?.id === lantern.id;

            return (
              <div
                key={lantern.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLantern(lantern);
                }}
                className="absolute cursor-pointer transition-transform hover:scale-110 active:scale-95 group"
                style={{
                  left: `${lantern.x}%`,
                  top: `${lantern.y}%`,
                  transform: 'translate(-50%, -50%)',
                  animation: `lanternFloat ${7 + (idx % 4)}s ease-in-out infinite`,
                  animationDelay: `${(idx * 0.7)}s`,
                  zIndex: isSelected ? 30 : 10 + Math.floor(lantern.y),
                }}
              >
                {/* Water halo reflection */}
                <div className={`absolute -inset-4 rounded-full ${styles.halo} blur-md animate-pulse`} />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-black/40 blur-xs" />

                {/* Lotus Lantern Core */}
                <div className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${styles.bg} ${styles.glow} border ${styles.border}`}>
                  {/* Candle wick flame */}
                  <div className="w-2.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_#fff] animate-glow-pulse" />
                  {/* Subtle lotus petals base */}
                  <div className="absolute -bottom-1 inset-x-0 flex justify-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
                    <span className="w-2 h-2 rounded-full bg-purple-400/90 -mt-0.5" />
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
                  </div>
                </div>

                {/* Ripple badge count */}
                {lantern.ripples > 1 && (
                  <div className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-full bg-[#181932] border border-amber-300/40 text-[10px] font-medium text-amber-200 flex items-center gap-0.5 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>{lantern.ripples}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ambient Top Message & Header Badge */}
        <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#161730]/80 backdrop-blur-md px-3.5 py-1.5 border border-purple-400/20 text-xs font-medium text-purple-200 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Hồ Trăng An Trú • {lanterns.length} ngọn hoa đăng đang trôi</span>
          </div>
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 flex items-center justify-between gap-3 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFloatModal();
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold text-white shadow-xl shadow-rose-950/50 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>Thả Hoa Đăng Cầu Nguyện</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenWishes();
              }}
              className="flex items-center gap-1.5 rounded-2xl bg-[#1b1d38]/85 backdrop-blur-md border border-purple-400/30 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-purple-200 hover:text-white hover:border-purple-300 transition shadow-lg"
              title="Cây nguyện ước"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Cây Nguyện Ước</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenConfessions();
              }}
              className="flex items-center gap-1.5 rounded-2xl bg-[#1b1d38]/85 backdrop-blur-md border border-purple-400/30 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-purple-200 hover:text-white hover:border-purple-300 transition shadow-lg"
              title="Tâm tình cộng đồng"
            >
              <MessageCircleHeart className="w-4 h-4 text-rose-300" />
              <span className="hidden sm:inline">Tâm Tình Ẩn Danh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Lantern Drawer / Modal */}
      {selectedLantern && (
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#15162e] to-[#0f1022] border-t border-purple-500/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getLanternColorClasses(selectedLantern.color).bg} shadow-md`}>
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
    </div>
  );
};
