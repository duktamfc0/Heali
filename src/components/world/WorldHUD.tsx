import React, { useState } from 'react';
import type { WorldZone } from './WorldEnvironment';
import { WEATHER_OPTIONS, type WeatherMode } from './DynamicWeatherOverlay';
import {
  Compass,
  Sparkles,
  Palette,
  Maximize2,
  Minimize2,
  Waves,
  BookOpen,
  MessageSquareHeart,
  Mail,
  TreeDeciduous,
  CloudRain,
  Heart,
  ChevronDown,
  Flower2,
  CloudFog,
  Moon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  X,
} from 'lucide-react';

export interface WorldHUDProps {
  weatherMode?: WeatherMode;
  onChangeWeatherMode?: (mode: WeatherMode) => void;
  currentZone: WorldZone | null;
  featuredZone?: WorldZone;
  allZones: WorldZone[];
  onInteractZone: (zone: WorldZone) => void;
  onTeleportToZone: (zoneId: WorldZone['id']) => void;
  onQuickWriteJournal?: () => void;
  robeColor: number;
  onUpdateRobeColor: (color: number) => void;
  cameraMode: 'follow' | 'isometric' | 'cinematic';
  onChangeCameraMode: (mode: 'follow' | 'isometric' | 'cinematic') => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onJoystickMove?: (dx: number, dy: number) => void;
  onJoystickEnd?: () => void;
}

const ROBE_COLORS = [
  { name: 'Xanh Rêu Rừng', hex: 0x2d7a58, preview: 'bg-[#2d7a58]' },
  { name: 'Đất Nung Ấm', hex: 0xc25b3b, preview: 'bg-[#c25b3b]' },
  { name: 'Vàng Mù Tạt', hex: 0xd9a43b, preview: 'bg-[#d9a43b]' },
  { name: 'Xanh Sương Mai', hex: 0x5c8596, preview: 'bg-[#5c8596]' },
  { name: 'Xanh Ô Liu', hex: 0x62733b, preview: 'bg-[#62733b]' },
  { name: 'Kem Bạch Dương', hex: 0xd9d2c5, preview: 'bg-[#d9d2c5]' },
];

export const WorldHUD: React.FC<WorldHUDProps> = ({
  weatherMode = 'petals',
  onChangeWeatherMode,
  currentZone,
  featuredZone,
  allZones,
  onInteractZone,
  onTeleportToZone,
  onQuickWriteJournal,
  robeColor,
  onUpdateRobeColor,
  cameraMode,
  onChangeCameraMode,
  isZenMode,
  onToggleZenMode,
  onJoystickMove,
  onJoystickEnd,
}) => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);
  const [showHelpTip, setShowHelpTip] = useState(false);

  const renderWeatherIcon = (mode: WeatherMode, active = false) => {
    const cls = `w-4 h-4 ${active ? 'text-[#46613e]' : 'text-[#5c725e]'}`;
    switch (mode) {
      case 'petals':
        return <Flower2 className={cls} />;
      case 'rain':
        return <CloudRain className={cls} />;
      case 'fireflies':
        return <Sparkles className={cls} />;
      case 'mist':
        return <CloudFog className={cls} />;
      case 'clear':
        return <Moon className={cls} />;
    }
  };

  const getZoneIcon = (iconName: string, light = false) => {
    const cls = light ? 'w-4 h-4 text-white' : 'w-4 h-4 text-[#46613e]';
    switch (iconName) {
      case 'Waves':
        return <Waves className={cls} />;
      case 'BookOpen':
        return <BookOpen className={cls} />;
      case 'MessageSquareHeart':
        return <MessageSquareHeart className={cls} />;
      case 'Mail':
        return <Mail className={cls} />;
      case 'TreeDeciduous':
        return <TreeDeciduous className={cls} />;
      case 'CloudRain':
        return <CloudRain className={cls} />;
      case 'MessageCircle':
        return <MessageCircle className={cls} />;
      case 'Sparkles':
        return <Sparkles className={cls} />;
      default:
        return <Heart className={cls} />;
    }
  };

  const activeWeatherOption =
    WEATHER_OPTIONS.find((w) => w.id === weatherMode) ?? WEATHER_OPTIONS[0];

  const promptZone = currentZone ?? featuredZone ?? allZones[0];

  const startMove = (dx: number, dy: number) => {
    onJoystickMove?.(dx, dy);
  };
  const stopMove = () => {
    onJoystickEnd?.();
  };

  if (isZenMode) {
    return (
      <button
        onClick={onToggleZenMode}
        className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-[#f7f5ed]/95 border border-[#d5dbd0] text-[#273829] hover:bg-white text-xs font-medium flex items-center gap-1.5 shadow-md"
      >
        <Minimize2 className="w-4 h-4 text-[#46613e]" />
        <span>Hiện giao diện</span>
      </button>
    );
  }

  return (
    <>
      {/* Top-Left Editorial Hero Block matching the serene garden mockup */}
      <div className="absolute top-5 left-5 sm:top-7 sm:left-8 z-20 pointer-events-none max-w-xs sm:max-w-md space-y-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[#4b6755]">
          <span className="w-2 h-2 rounded-full bg-[#5b7e5f]" />
          <span>Một khoảng thở cho tâm hồn</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-semibold text-[#243627] font-serif-healing leading-tight tracking-tight">
          Khu vườn bình yên
        </h2>

        <p className="text-xs sm:text-sm text-[#395343] leading-relaxed max-w-[260px] sm:max-w-sm">
          Bạn không cần vội. Khu vườn vẫn ở đây, đợi bạn.
        </p>

        <div className="pt-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowMapModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f4f2ea]/92 hover:bg-white border border-[#cad5c6] text-[#273829] text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#46613e]" />
            <span>Các góc nhỏ</span>
          </button>
        </div>
      </div>

      {/* Top-Right Compact Utilities (?, Weather, Customizer, Zen) */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
        {onChangeWeatherMode && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWeatherMenu((prev) => !prev)}
              title="Thay đổi thời tiết khu vườn"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-[#e6efe9]/95 hover:bg-white border border-[#cbd6ca] text-[#273829] text-xs font-medium shadow-sm transition"
            >
              {renderWeatherIcon(weatherMode, true)}
              <span className="hidden sm:inline">{activeWeatherOption.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5b705e]" />
            </button>

            {showWeatherMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#faf7ef]/98 border border-[#d6dcd0] shadow-xl p-2 space-y-1 z-30">
                <div className="px-2.5 py-1.5 border-b border-[#e6e4d8]">
                  <p className="text-[11px] font-bold text-[#273829]">
                    Khí Hậu Khu Vườn
                  </p>
                  <p className="text-[10px] text-[#5e7360]">
                    Chọn bầu không khí nhẹ nhàng
                  </p>
                </div>
                {WEATHER_OPTIONS.map((opt) => {
                  const isSelected = weatherMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChangeWeatherMode(opt.id);
                        setShowWeatherMenu(false);
                      }}
                      className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-[#e7eee2] border border-[#b4c4ae] text-[#273829]'
                          : 'hover:bg-[#f1efe5] border border-transparent text-[#3d5240]'
                      }`}
                    >
                      <div className="mt-0.5">{renderWeatherIcon(opt.id, isSelected)}</div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold">{opt.label}</div>
                        <div className="text-[10px] text-[#5f7462] leading-snug">
                          {opt.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowCustomizer(true)}
          title="Đổi màu áo nhân vật"
          className="w-9 h-9 rounded-full bg-[#e6efe9]/95 hover:bg-white border border-[#cbd6ca] text-[#2c4230] flex items-center justify-center shadow-sm transition"
        >
          <Palette className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleZenMode}
          title="Chế độ tĩnh lặng toàn cảnh"
          className="w-9 h-9 rounded-full bg-[#e6efe9]/95 hover:bg-white border border-[#cbd6ca] text-[#2c4230] flex items-center justify-center shadow-sm transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowHelpTip((prev) => !prev)}
          title="Hướng dẫn di chuyển"
          className="w-9 h-9 rounded-full bg-[#e6efe9]/95 hover:bg-white border border-[#cbd6ca] text-[#2c4230] flex items-center justify-center shadow-sm transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Help Tooltip Popover */}
      {showHelpTip && (
        <div className="absolute top-16 right-5 z-30 w-64 rounded-2xl bg-[#faf7ef]/98 border border-[#d6dcd0] shadow-xl p-3.5 text-xs text-[#273829] space-y-1.5">
          <div className="flex items-center justify-between font-semibold">
            <span>Cách tản bộ trong vườn</span>
            <button onClick={() => setShowHelpTip(false)} className="text-[#5c725e] hover:text-[#273829]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-[#4c624e] leading-relaxed">
            Dùng phím <strong>WASD</strong> / mũi tên, cụm phím <strong>↑ ← ↓ →</strong>, chạm lên thảm cỏ để bước tới từng ngôi nhà, hoặc <strong>kéo chuột</strong> để xoay góc nhìn thung lũng &amp; cuộn để thu phóng.
          </p>
          <div className="pt-1.5 flex items-center gap-1 border-t border-[#e7e5da]">
            {(['follow', 'isometric', 'cinematic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeCameraMode(mode)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition ${
                  cameraMode === mode
                    ? 'bg-[#46613e] text-white'
                    : 'bg-[#edf0e6] text-[#3d5240] hover:bg-[#e1e7da]'
                }`}
              >
                {mode === 'follow' ? 'Góc gần' : mode === 'isometric' ? 'Toàn cảnh' : 'Quay chậm'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Floating Cream Proximity Card (Exact match to "MỘT CÁNH CỬA ĐANG MỞ · Nhà nhật ký · Ghé vào nhà") */}
      <div className="absolute bottom-24 sm:bottom-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-20 sm:w-[460px] pointer-events-auto">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[#f7f5ed]/96 border border-[#dedcd0] shadow-xl">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6a7a68]">
              {currentZone ? 'Điểm dừng chân gần bạn' : 'Một cánh cửa đang mở'}
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-[#273829] font-serif-healing truncate mt-0.5">
              {promptZone.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onInteractZone(promptZone)}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <span>{promptZone.promptText}</span>
            {getZoneIcon(promptZone.iconName, true)}
          </button>
        </div>
      </div>

      {/* Bottom-Left Tactile Directional D-Pad (↑ ← ↓ →) */}
      <div className="absolute bottom-4 left-4 sm:left-6 z-20 pointer-events-auto select-none">
        <div className="grid grid-cols-3 gap-1 w-[124px]">
          <div />
          <button
            type="button"
            aria-label="Đi lên"
            onPointerDown={() => startMove(0, -1)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            onPointerCancel={stopMove}
            className="w-10 h-10 rounded-xl bg-[#e6ece2]/92 hover:bg-white active:bg-[#d5dfd0] border border-[#cbd4c5] text-[#2b3f2d] flex items-center justify-center shadow-md transition"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />

          <button
            type="button"
            aria-label="Sang trái"
            onPointerDown={() => startMove(-1, 0)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            onPointerCancel={stopMove}
            className="w-10 h-10 rounded-xl bg-[#e6ece2]/92 hover:bg-white active:bg-[#d5dfd0] border border-[#cbd4c5] text-[#2b3f2d] flex items-center justify-center shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Đi xuống"
            onPointerDown={() => startMove(0, 1)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            onPointerCancel={stopMove}
            className="w-10 h-10 rounded-xl bg-[#e6ece2]/92 hover:bg-white active:bg-[#d5dfd0] border border-[#cbd4c5] text-[#2b3f2d] flex items-center justify-center shadow-md transition"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Sang phải"
            onPointerDown={() => startMove(1, 0)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            onPointerCancel={stopMove}
            className="w-10 h-10 rounded-xl bg-[#e6ece2]/92 hover:bg-white active:bg-[#d5dfd0] border border-[#cbd4c5] text-[#2b3f2d] flex items-center justify-center shadow-md transition"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom-Right Quick Write Journal Button ("Viết nhanh") */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => onQuickWriteJournal?.()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#e7ece3]/95 hover:bg-white border border-[#cad4c4] text-[#273829] text-xs font-semibold shadow-md transition active:scale-95"
        >
          <BookOpen className="w-4 h-4 text-[#46613e]" />
          <span>Viết nhanh</span>
        </button>
      </div>

      {/* Fast-Travel Map Modal ("Các góc nhỏ") */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#faf7ef] border border-[#dcdad0] shadow-2xl p-6 text-[#273829] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e4d8]">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-[#46613e]" />
                <h3 className="font-bold text-base sm:text-lg font-serif-healing">
                  Các góc nhỏ trong khu vườn
                </h3>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-1.5 rounded-lg text-[#5c725e] hover:text-[#273829]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4f6451]">
              Chọn một góc nhỏ bình yên để bước chân đến ngay lập tức.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {allZones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    onTeleportToZone(z.id);
                    setShowMapModal(false);
                  }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-[#f1efe5] hover:bg-[#e7ece1] border border-[#dfe2d5] hover:border-[#9eb198] text-left transition group"
                >
                  <div className="p-2 rounded-xl bg-white border border-[#dce0d4] group-hover:scale-105 transition">
                    {getZoneIcon(z.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#273829]">
                      {z.name}
                    </h4>
                    <p className="text-[11px] text-[#5c725e] line-clamp-1 mt-0.5">
                      {z.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 rounded-xl bg-[#e7ece1] hover:bg-[#dce4d4] text-xs font-semibold text-[#273829] transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Color Customizer Modal */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#faf7ef] border border-[#dcdad0] shadow-2xl p-6 text-[#273829] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e4d8]">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#46613e]" />
                <h3 className="font-bold text-base font-serif-healing">Sắc áo dạo vườn</h3>
              </div>
              <button
                onClick={() => setShowCustomizer(false)}
                className="p-1.5 rounded-lg text-[#5c725e] hover:text-[#273829]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4f6451]">
              Chọn màu áo dịu nhẹ đồng hành cùng bạn hôm nay.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {ROBE_COLORS.map((col) => {
                const isSelected = robeColor === col.hex;
                return (
                  <button
                    key={col.hex}
                    onClick={() => onUpdateRobeColor(col.hex)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-[#e7eee2] border-[#46613e] text-[#273829] font-semibold'
                        : 'bg-[#f1efe5] border-[#dfe2d5] text-[#4c614e] hover:bg-[#e9ece1]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border border-black/15 shadow-sm ${col.preview}`}
                    />
                    <span className="text-xs">{col.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCustomizer(false)}
                className="px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-xs font-semibold text-white transition"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
