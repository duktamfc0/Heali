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
  LayoutGrid,
  Eye,
  RotateCcw,
  Smartphone,
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
  onResetCamera?: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  isMobileFrame?: boolean;
  onToggleMobileFrame?: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onJoystickMove?: (dx: number, dy: number) => void;
  onJoystickEnd?: () => void;
  onOpenAllFeatures?: () => void;
}

const ROBE_COLORS = [
  { name: 'Rêu Rừng', hex: 0x2d7a58, preview: 'bg-[#2d7a58]' },
  { name: 'Đất Nung', hex: 0xb86642, preview: 'bg-[#b86642]' },
  { name: 'Vàng Mù Tạt', hex: 0xc79238, preview: 'bg-[#c79238]' },
  { name: 'Sương Mai', hex: 0x6b8f9c, preview: 'bg-[#6b8f9c]' },
  { name: 'Ô Liu', hex: 0x5c7246, preview: 'bg-[#5c7246]' },
  { name: 'Kem Bạch Dương', hex: 0xd9ccb8, preview: 'bg-[#d9ccb8]' },
];

const GLASS_PANEL =
  'bg-[#faf7ef]/92 backdrop-blur-md border border-[#cfd8c9] text-[#273829] shadow-lg';

const GLASS_BTN =
  'bg-[#faf7ef]/90 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] shadow-md transition';

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
  onResetCamera,
  isZenMode,
  onToggleZenMode,
  isMobileFrame = false,
  onToggleMobileFrame,
  onJoystickMove,
  onJoystickEnd,
  onOpenAllFeatures,
}) => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);
  const [showHelpTip, setShowHelpTip] = useState(false);

  const renderWeatherIcon = (mode: WeatherMode, active = false) => {
    const cls = `w-4 h-4 ${active ? 'text-[#46613e]' : 'text-[#7a8b7c]'}`;
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
    const cls = light ? 'w-4 h-4 text-[#faf7ef]' : 'w-4 h-4 text-[#46613e]';
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
        type="button"
        onClick={onToggleZenMode}
        className={`absolute top-4 right-4 z-20 min-h-[44px] px-4 py-2 rounded-2xl ${GLASS_BTN} text-xs font-medium flex items-center gap-2`}
      >
        <Minimize2 className="w-4 h-4 text-[#46613e]" />
        <span>Hiện giao diện</span>
      </button>
    );
  }

  return (
    <>
      {/* Top-Left Sanctuary Editorial Hero */}
      <div
        className={`absolute top-4 left-4 ${
          isMobileFrame ? 'max-w-[235px] space-y-2' : 'sm:top-6 sm:left-7 max-w-[260px] sm:max-w-md space-y-2'
        } z-20 pointer-events-none`}
      >
        <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#f4f7f2] drop-shadow-[0_2px_6px_rgba(20,34,26,0.55)]">
          Một khoảng thở cho tâm hồn
        </p>

        <h2
          className={`font-serif-healing ${
            isMobileFrame ? 'text-2xl' : 'text-2xl sm:text-4xl'
          } font-medium text-[#ffffff] leading-tight drop-shadow-[0_3px_14px_rgba(20,34,26,0.5)]`}
        >
          Khu vườn bình yên
        </h2>

        <p className="text-xs sm:text-sm text-[#f7f5ed] leading-relaxed drop-shadow-[0_2px_8px_rgba(20,34,26,0.5)]">
          Bạn không cần vội. Khu vườn vẫn ở đây, đợi bạn.
        </p>

        <div className="pt-1 pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMapModal(true)}
            className={`min-h-[42px] inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl ${GLASS_BTN} text-xs font-medium cursor-pointer whitespace-nowrap`}
          >
            <Compass className="w-4 h-4 text-[#46613e]" />
            <span>Các góc nhỏ</span>
          </button>

          {onOpenAllFeatures && (
            <button
              type="button"
              onClick={onOpenAllFeatures}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#46613e] hover:bg-[#3a5233] text-[#faf7ef] text-xs font-medium shadow-md transition cursor-pointer whitespace-nowrap"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tất cả chức năng</span>
            </button>
          )}
        </div>
      </div>

      {/* Top-Right Floating Utility Controls */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex flex-wrap justify-end items-center gap-1.5 max-w-[160px] sm:max-w-none">
        {onChangeWeatherMode && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWeatherMenu((prev) => !prev)}
              title="Thay đổi thời tiết khu vườn"
              className={`min-h-[42px] flex items-center gap-1.5 px-3 py-2 rounded-2xl ${GLASS_BTN} text-xs font-medium whitespace-nowrap`}
            >
              {renderWeatherIcon(weatherMode, true)}
              {!isMobileFrame && <span className="hidden md:inline">{activeWeatherOption.label}</span>}
              <ChevronDown className="w-3.5 h-3.5 text-[#546455]" />
            </button>

            {showWeatherMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#faf7ef]/98 backdrop-blur-md border border-[#cfd8c9] shadow-2xl p-2 space-y-1 z-30 text-[#273829]">
                <div className="px-2.5 py-1.5 border-b border-[#e5e2d8]">
                  <p className="text-[11px] font-semibold text-[#273829]">Thời Tiết Khu Vườn</p>
                  <p className="text-[10px] text-[#7a8b7c]">Chọn bầu không khí nhẹ nhàng</p>
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
                          ? 'bg-[#e6efe3] border border-[#b9cbb6] text-[#273829]'
                          : 'hover:bg-[#f1ede2] border border-transparent text-[#3b4a3e]'
                      }`}
                    >
                      <div className="mt-0.5">{renderWeatherIcon(opt.id, isSelected)}</div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium">{opt.label}</div>
                        <div className="text-[10px] text-[#546455] leading-snug">{opt.subtitle}</div>
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
          onClick={() => {
            const nextMode =
              cameraMode === 'follow'
                ? 'isometric'
                : cameraMode === 'isometric'
                  ? 'cinematic'
                  : 'follow';
            onChangeCameraMode(nextMode);
          }}
          title="Đổi góc nhìn camera"
          className={`min-h-[42px] flex items-center gap-1.5 px-3 rounded-2xl ${GLASS_BTN} text-xs font-medium whitespace-nowrap`}
        >
          <Eye className="w-4 h-4 text-[#46613e]" />
          {!isMobileFrame && (
            <span className="hidden lg:inline">
              {cameraMode === 'follow'
                ? 'Góc gần'
                : cameraMode === 'isometric'
                  ? 'Toàn cảnh'
                  : 'Quay chậm'}
            </span>
          )}
        </button>

        {onResetCamera && (
          <button
            type="button"
            onClick={onResetCamera}
            title="Đặt lại góc nhìn"
            className={`w-[42px] h-[42px] rounded-2xl ${GLASS_BTN} flex items-center justify-center`}
          >
            <RotateCcw className="w-4 h-4 text-[#46613e]" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowCustomizer(true)}
          title="Đổi màu áo nhân vật"
          className={`w-[42px] h-[42px] rounded-2xl ${GLASS_BTN} flex items-center justify-center`}
        >
          <Palette className="w-4 h-4 text-[#46613e]" />
        </button>

        {onToggleMobileFrame && (
          <button
            type="button"
            onClick={onToggleMobileFrame}
            title={isMobileFrame ? 'Chế độ toàn màn hình' : 'Xem khung Mobile 9:16'}
            className={`w-[42px] h-[42px] rounded-2xl flex items-center justify-center transition ${
              isMobileFrame
                ? 'bg-[#46613e] text-[#faf7ef] shadow-md'
                : GLASS_BTN
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleZenMode}
          title="Chế độ tĩnh lặng toàn cảnh"
          className={`w-[42px] h-[42px] rounded-2xl ${GLASS_BTN} flex items-center justify-center`}
        >
          <Maximize2 className="w-4 h-4 text-[#46613e]" />
        </button>

        <button
          type="button"
          onClick={() => setShowHelpTip((prev) => !prev)}
          title="Hướng dẫn di chuyển"
          className={`w-[42px] h-[42px] rounded-2xl ${GLASS_BTN} flex items-center justify-center`}
        >
          <HelpCircle className="w-4 h-4 text-[#46613e]" />
        </button>
      </div>

      {/* Help Tooltip Popover */}
      {showHelpTip && (
        <div className="absolute top-18 right-4 sm:right-5 z-30 w-64 rounded-2xl bg-[#faf7ef]/98 backdrop-blur-md border border-[#cfd8c9] shadow-2xl p-3.5 text-xs text-[#273829] space-y-1.5">
          <div className="flex items-center justify-between font-semibold">
            <span>Cách tản bộ trong vườn</span>
            <button
              type="button"
              onClick={() => setShowHelpTip(false)}
              className="text-[#7a8b7c] hover:text-[#273829]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-[#546455] leading-relaxed">
            Dùng phím <strong>WASD</strong> / mũi tên, cụm phím <strong>↑ ← ↓ →</strong>, chạm lên thảm cỏ để bước tới từng ngôi nhà, hoặc <strong>kéo chuột mọi hướng</strong> để xoay góc nhìn và cuộn để thu phóng.
          </p>
          <div className="pt-1.5 flex items-center gap-1 border-t border-[#e5e2d8]">
            {(['follow', 'isometric', 'cinematic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeCameraMode(mode)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-medium transition ${
                  cameraMode === mode
                    ? 'bg-[#46613e] text-[#faf7ef]'
                    : 'bg-[#f1ede2] text-[#3b4a3e] hover:bg-[#e7e2d3]'
                }`}
              >
                {mode === 'follow' ? 'Góc gần' : mode === 'isometric' ? 'Toàn cảnh' : 'Quay chậm'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Floating Zone Proximity Card */}
      <div
        className={`absolute ${
          isMobileFrame
            ? 'bottom-28 inset-x-3.5'
            : 'bottom-28 sm:bottom-20 md:bottom-5 inset-x-3.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] lg:w-[460px]'
        } z-20 pointer-events-auto`}
      >
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl ${GLASS_PANEL}`}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#46613e]">
              {currentZone ? 'Điểm dừng chân gần bạn' : 'Một cánh cửa đang mở'}
            </p>
            <h3 className="font-serif-healing text-base sm:text-lg font-medium text-[#273829] truncate mt-0.5">
              {promptZone.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onInteractZone(promptZone)}
            className="shrink-0 min-h-[42px] flex items-center gap-2 px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#3a5233] text-[#faf7ef] text-xs font-medium shadow-sm transition active:scale-95 whitespace-nowrap"
          >
            <span>{promptZone.promptText}</span>
            {getZoneIcon(promptZone.iconName, true)}
          </button>
        </div>
      </div>

      {/* Bottom-Left Directional D-Pad */}
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
            className={`w-10 h-10 rounded-xl ${GLASS_BTN} flex items-center justify-center active:scale-95`}
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
            className={`w-10 h-10 rounded-xl ${GLASS_BTN} flex items-center justify-center active:scale-95`}
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
            className={`w-10 h-10 rounded-xl ${GLASS_BTN} flex items-center justify-center active:scale-95`}
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
            className={`w-10 h-10 rounded-xl ${GLASS_BTN} flex items-center justify-center active:scale-95`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom-Right Quick Write Journal Button */}
      <div className="absolute bottom-5 right-4 sm:right-6 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => onQuickWriteJournal?.()}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-2xl ${GLASS_BTN} text-xs font-medium active:scale-95 whitespace-nowrap`}
        >
          <BookOpen className="w-4 h-4 text-[#46613e]" />
          <span>Viết nhanh</span>
        </button>
      </div>

      {/* Fast-Travel Map Modal ("Các góc nhỏ") */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2922]/45 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#faf7ef] border border-[#cfd8c9] shadow-2xl p-6 text-[#273829] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2d8]">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-[#46613e]" />
                <h3 className="font-serif-healing font-medium text-base sm:text-lg">
                  Các góc nhỏ trong khu vườn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="p-1.5 rounded-xl text-[#7a8b7c] hover:text-[#273829] hover:bg-[#f1ede2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#546455]">
              Chọn một góc nhỏ yên bình trên đảo trời xanh để bước chân đến ngay lập tức.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {allZones.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    onTeleportToZone(z.id);
                    setShowMapModal(false);
                  }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-[#f1ede2]/75 hover:bg-[#e6efe3] border border-[#dce3d5] hover:border-[#b9cbb6] text-left transition group"
                >
                  <div className="p-2 rounded-xl bg-white border border-[#dce3d5] group-hover:scale-105 transition">
                    {getZoneIcon(z.iconName)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#273829]">{z.name}</h4>
                    <p className="text-[11px] text-[#546455] line-clamp-1 mt-0.5">{z.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#f1ede2] hover:bg-[#e7e2d3] border border-[#cfd8c9] text-xs font-medium text-[#273829] transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Color Customizer Modal */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2922]/45 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#faf7ef] border border-[#cfd8c9] shadow-2xl p-6 text-[#273829] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2d8]">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#46613e]" />
                <h3 className="font-serif-healing font-medium text-base">Sắc áo dạo vườn</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomizer(false)}
                className="p-1.5 rounded-xl text-[#7a8b7c] hover:text-[#273829] hover:bg-[#f1ede2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#546455]">
              Chọn gam màu thiên nhiên nhẹ nhàng đồng hành cùng bạn hôm nay.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {ROBE_COLORS.map((col) => {
                const isSelected = robeColor === col.hex;
                return (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => onUpdateRobeColor(col.hex)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-[#e6efe3] border-[#46613e] text-[#273829] font-semibold'
                        : 'bg-[#f1ede2]/65 border-[#dce3d5] text-[#3b4a3e] hover:bg-[#e7e2d3]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border border-[#cfd8c9] shadow-sm ${col.preview}`}
                    />
                    <span className="text-xs">{col.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCustomizer(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#3a5233] text-xs font-medium text-[#faf7ef] transition"
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
