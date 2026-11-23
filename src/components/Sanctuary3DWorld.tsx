import React, { useState } from 'react';
import { R3FScene } from './world/r3f/R3FScene';
import type { WorldZone } from './world/WorldEnvironment';
import { WEATHER_OPTIONS, type WeatherMode } from './world/DynamicWeatherOverlay';
import {
  Sparkles,
  Heart,
  X,
  Flower2,
  CloudRain,
  CloudFog,
  Moon,
} from 'lucide-react';

interface Sanctuary3DWorldProps {
  weatherMode?: WeatherMode;
  onChangeWeatherMode?: (mode: WeatherMode) => void;
  onInteriorChange?: (isInside: boolean) => void;
  onOpenFloatModal: () => void;
  onOpenWriteLetter: () => void;
  onSelectZone: (zone: 'lake' | 'community' | 'journal' | 'letters' | 'wishes' | 'rain_room' | 'stranger_chat' | 'spiritual_room') => void;
}

export const Sanctuary3DWorld: React.FC<Sanctuary3DWorldProps> = ({
  weatherMode = 'petals',
  onChangeWeatherMode,
  onInteriorChange,
  onOpenFloatModal,
  onOpenWriteLetter,
  onSelectZone,
}) => {
  const [showAlcoveModal, setShowAlcoveModal] = useState(false);
  const [showGardenModal, setShowGardenModal] = useState(false);

  const renderWeatherIcon = (mode: WeatherMode, active: boolean) => {
    const cls = `w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#4f684e]'}`;
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

  const handleSelectZone = (zoneId: WorldZone['id']) => {
    if (zoneId === 'lake') {
      onOpenFloatModal();
    } else if (zoneId === 'letters') {
      onOpenWriteLetter();
    } else if (zoneId === 'listening_alcove') {
      setShowAlcoveModal(true);
    } else if (zoneId === 'personal_garden') {
      setShowGardenModal(true);
    } else if (zoneId === 'stranger_chat') {
      onSelectZone('stranger_chat');
    } else if (zoneId === 'rain_room') {
      onSelectZone('rain_room');
    } else {
      onSelectZone(zoneId);
    }
  };

  return (
    <section className="relative space-y-4">
      {/* 3D Real-Time Explorable Sanctuary Viewport */}
      <R3FScene
        weatherMode={weatherMode}
        onChangeWeatherMode={onChangeWeatherMode}
        onInteriorChange={onInteriorChange}
        onSelectZone={handleSelectZone}
        onOpenFloatModal={onOpenFloatModal}
        onOpenWriteLetter={onOpenWriteLetter}
      />

      {/* Compact Garden Atmosphere Switcher Strip */}
      {onChangeWeatherMode && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-[#faf7ef] border border-[#dedcd0] shadow-sm text-[#273829]">
          <div className="flex items-center gap-2 text-xs text-[#4b604d]">
            <span className="p-1 rounded-lg bg-[#e6ede0] text-[#46613e]">
              {renderWeatherIcon(weatherMode, false)}
            </span>
            <span className="font-semibold text-[#273829]">Khí hậu khu vườn:</span>
            <span className="hidden md:inline text-[#607562] italic font-serif-healing">
              {WEATHER_OPTIONS.find((w) => w.id === weatherMode)?.subtitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {WEATHER_OPTIONS.map((opt) => {
              const active = weatherMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeWeatherMode(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition ${
                    active
                      ? 'bg-[#46613e] border border-[#46613e] text-white font-semibold shadow-sm'
                      : 'bg-[#f0eee3] border border-[#dcd9cc] text-[#4b604d] hover:text-[#273829] hover:border-[#b6c3b1]'
                  }`}
                >
                  {renderWeatherIcon(opt.id, active)}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Listening Alcove (Góc Lắng Nghe) */}
      {showAlcoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#faf7ef] border border-[#dcdad0] p-6 shadow-2xl text-[#273829] space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#e6e4d8]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#f5e7e2] border border-[#e3c6bc]">
                  <Heart className="w-5 h-5 text-[#b55a44]" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#273829] font-serif-healing">
                    Góc Lắng Nghe 1:1
                  </h4>
                  <span className="text-[11px] text-[#5e7260]">
                    Không gian đồng hành & lắng nghe thấu cảm
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAlcoveModal(false)}
                className="p-1 rounded-lg text-[#5e7260] hover:text-[#273829]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#f1efe5] border border-[#e2e0d4] text-[#354837] font-serif-healing text-xs leading-relaxed space-y-2">
              <p>
                Góc Lắng Nghe là tính năng đồng hành ẩn danh 1:1 có kiểm duyệt an toàn, hiện đang được hoàn thiện cho giai đoạn tiếp theo của Heali.
              </p>
              <p className="text-[#566b58]">
                Trong lúc này, bạn có thể gửi gắm tâm sự tại <strong>Vườn Tâm Tình</strong> hoặc sử dụng nút <strong>Hỗ Trợ Khẩn Cấp</strong> trên thanh điều hướng nếu bạn đang gặp khủng hoảng tâm lý.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setShowAlcoveModal(false);
                  onSelectZone('stranger_chat');
                }}
                className="px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-xs font-semibold text-white transition shadow-sm"
              >
                Vào Góc Gặp Gỡ 1:1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Personal Garden (Khu Vườn Của Riêng Bạn) */}
      {showGardenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#faf7ef] border border-[#dcdad0] p-6 shadow-2xl text-[#273829] space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#e6e4d8]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#e6efe2] border border-[#c6d6c0]">
                  <Flower2 className="w-5 h-5 text-[#46613e]" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#273829] font-serif-healing">
                    Khu Vườn Của Riêng Bạn
                  </h4>
                  <span className="text-[11px] text-[#5e7260]">
                    Không gian chăm sóc nội tâm & nuôi dưỡng hạt mầm
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowGardenModal(false)}
                className="p-1 rounded-lg text-[#5e7260] hover:text-[#273829]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#f1efe5] border border-[#e2e0d4] text-[#354837] font-serif-healing text-xs leading-relaxed space-y-2">
              <p>
                Mỗi cảm xúc bạn ghi lại, mỗi ngọn hoa đăng bạn thả trôi và mỗi cam kết lành mạnh bạn thực hiện sẽ kết tinh thành dưỡng chất nuôi mầm hoa trong khu vườn tâm hồn này.
              </p>
              <p className="text-[#46613e] italic">
                “Từng bông hoa đều cần thời gian trong bóng tối trước khi nở rộ dưới ánh mặt trời.”
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setShowGardenModal(false);
                  const dash = document.getElementById('personal-journey-section');
                  dash?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-xs font-semibold text-white transition shadow-sm"
              >
                Xem Tiến Trình Chữa Lành
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
