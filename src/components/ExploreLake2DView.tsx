import React, { useState, useEffect } from 'react';
import { api, type Lantern } from '../services/api';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import { Waves, Sparkles, Compass, Droplets, Flame, Send } from 'lucide-react';

interface ExploreLake2DViewProps {
  lowMotion: boolean;
  onOpenFloatModal: () => void;
  onOpen3DWorld: () => void;
  onOpenSpiritualRoom: () => void;
  onOpenPrivacy: () => void;
  onOpenSendGift?: () => void;
  onOpenLanternNight?: () => void;
}

export const ExploreLake2DView: React.FC<ExploreLake2DViewProps> = ({
  lowMotion,
  onOpenFloatModal,
  onOpen3DWorld,
  onOpenSpiritualRoom,
  onOpenPrivacy,
  onOpenSendGift,
  onOpenLanternNight,
}) => {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getLanterns()
      .then((list) => setLanterns(list.slice(0, 8)))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRipple = async (id: string) => {
    const updatedRipples = await api.rippleLantern(id);
    setLanterns((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ripples: updatedRipples } : l))
    );
  };

  return (
    <div className="space-y-6 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {/* 3D Interactive Moonlight Lantern Lake Stage */}
      <SanctuaryScene3D
        variant="lake"
        lowMotion={lowMotion}
        allowPureViewToggle
        className="min-h-[250px] sm:min-h-[285px]"
      >
        <div className="p-5 sm:p-8 flex flex-col justify-between min-h-[250px] sm:min-h-[285px] text-[#f4f4ed]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#e5c27b]">
            <Waves className="w-4 h-4" />
            <span>Mặt hồ tĩnh lặng · {lanterns.length} ngọn đèn gần đây</span>
          </div>

          <div className="space-y-4 pt-6">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white">
                Hồ hoa đăng &amp; Khu vườn an trú
              </h1>
              <p className="text-xs sm:text-sm text-[#dce5d9] leading-relaxed font-serif-healing italic">
                Thả một ngọn đèn bình an xuống mặt hồ hoặc mở Khu vườn 3D để dạo quanh.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenFloatModal}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#537949] hover:bg-[#43653a] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-md transition"
              >
                <Waves className="w-4 h-4" />
                <span>Thả hoa đăng</span>
              </button>
              {onOpenSendGift && (
                <button
                  type="button"
                  onClick={onOpenSendGift}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#18231a]/85 hover:bg-[#223125] border border-[#4c6351]/60 text-[#eef3ea] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4 text-[#e5c27b]" />
                  <span>Gửi cho bạn</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpen3DWorld}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#18231a]/85 hover:bg-[#223125] border border-[#4c6351]/60 text-[#eef3ea] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition"
              >
                <Compass className="w-4 h-4 text-[#9fd296]" />
                <span>{lowMotion ? 'Mở Khu vườn 3D (nhẹ)' : 'Mở Khu vườn 3D'}</span>
              </button>
            </div>
          </div>
        </div>
      </SanctuaryScene3D>

      {/* Calm Lantern Water Pond Messages */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold font-serif-healing text-[#243627] dark:text-[#edf2e8]">
            Lời nhắn bình an trên mặt hồ
          </h2>
          <span className="text-xs text-[#576c59] dark:text-[#a6b7a8] tabular-nums">
            Chạm để gửi gợn sóng nhẹ
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236]"
              />
            ))}
          </div>
        ) : lanterns.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-center">
            <p className="text-sm sm:text-base text-[#576c59] dark:text-[#b0c0b2]">
              Mặt hồ đang yên tĩnh. Bạn có thể thả ngọn đèn đầu tiên nếu muốn gửi xuống một lời nhắn ngắn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lanterns.map((lantern) => (
              <div
                key={lantern.id}
                className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex flex-col justify-between gap-3 heali-card-surface"
              >
                <p className="text-sm sm:text-base font-serif-healing leading-relaxed">
                  “{lantern.message}”
                </p>
                <div className="flex items-center justify-between gap-2 text-xs text-[#576c59] dark:text-[#b0c0b2]">
                  <span>{lantern.authorNickname}</span>
                  <button
                    type="button"
                    onClick={() => void handleRipple(lantern.id)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#faf7ef] dark:bg-[#1b241d] border border-[#d6d3c6] dark:border-[#324236] hover:border-[#46613e] inline-flex items-center gap-1.5 font-medium tabular-nums transition"
                  >
                    <Droplets className="w-3.5 h-3.5 text-[#46613e] dark:text-[#7aa370]" />
                    <span>Gợn sóng nhẹ ({lantern.ripples})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secondary Exploration Destinations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {onOpenLanternNight && (
          <button
            type="button"
            onClick={onOpenLanternNight}
            className="p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] hover:border-[#9eb198] dark:hover:border-[#4c6451] text-left space-y-1.5 shadow-sm heali-card-surface"
          >
            <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
              <Flame className="w-5 h-5 text-[#b37e27]" />
              <span>Đêm Hoa Đăng Cộng Đồng</span>
            </div>
            <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
              Đếm ngược các tối Rằm hàng tháng, 14/2 &amp; 11/11 để cùng thả đèn bình an.
            </p>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSpiritualRoom}
          className="p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] hover:border-[#9eb198] dark:hover:border-[#4c6451] text-left space-y-1.5 shadow-sm heali-card-surface"
        >
          <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
            <Sparkles className="w-5 h-5 text-[#46613e] dark:text-[#7aa370]" />
            <span>Phòng Tarot &amp; Ngũ Hành</span>
          </div>
          <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
            Gieo bài gợi mở suy ngẫm cho riêng mình (tham khảo nhẹ nhàng).
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenPrivacy}
          className="p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] hover:border-[#9eb198] dark:hover:border-[#4c6451] text-left space-y-1.5 shadow-sm heali-card-surface"
        >
          <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
            <Compass className="w-5 h-5 text-[#46613e] dark:text-[#7aa370]" />
            <span>Quyền riêng tư &amp; Chế độ nhẹ</span>
          </div>
          <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
            Xem cách dữ liệu được bảo vệ, bật nền tối hoặc giảm chuyển động.
          </p>
        </button>
      </div>
    </div>
  );
};
