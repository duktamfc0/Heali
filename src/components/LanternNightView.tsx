import React, { useState, useEffect } from 'react';
import { api, type LanternNightResponse } from '../services/api';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import { Leaf, Flame, Calendar, Waves, Send, ShieldCheck, ArrowRight, Droplets } from 'lucide-react';

interface LanternNightViewProps {
  isPublicRoute?: boolean;
  lowMotion?: boolean;
  onEnterApp?: () => void;
  onOpenLanding?: () => void;
  onOpenFloatModal: () => void;
  onOpenSendGift: () => void;
  onOpenHelpline?: () => void;
}

function formatCountdown(targetIso: string): { days: number; hours: number; mins: number; secs: number } {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const secs = Math.floor((diff % (60 * 1000)) / 1000);
  return { days, hours, mins, secs };
}

export const LanternNightView: React.FC<LanternNightViewProps> = ({
  isPublicRoute = false,
  lowMotion = false,
  onEnterApp,
  onOpenLanding,
  onOpenFloatModal,
  onOpenSendGift,
  onOpenHelpline,
}) => {
  const [data, setData] = useState<LanternNightResponse | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const loadData = () => {
    api
      .getLanternNight()
      .then((res) => {
        setData(res);
        setCountdown(formatCountdown(res.nextEvent.startAt));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!data?.nextEvent?.startAt) return;
    const interval = window.setInterval(
      () => setCountdown(formatCountdown(data.nextEvent.startAt)),
      lowMotion ? 30000 : 1000
    );
    return () => window.clearInterval(interval);
  }, [data?.nextEvent?.startAt, lowMotion]);

  const handleRipple = async (id: string) => {
    const ripples = await api.rippleLantern(id);
    setData((prev) =>
      prev
        ? {
            ...prev,
            recentPublicLanterns: prev.recentPublicLanterns.map((l) =>
              l.id === id ? { ...l, ripples } : l
            ),
          }
        : prev
    );
  };

  const innerContent = (
    <div className="space-y-6 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {/* 3D Interactive Lantern Night Lake Stage */}
      <div className="rounded-[28px] overflow-hidden bg-[#17221b] text-[#f4f4ed] border border-[#2f4234] shadow-md relative">
        <SanctuaryScene3D
          variant="lake"
          lowMotion={lowMotion}
          allowPureViewToggle
          className="min-h-[255px] sm:min-h-[295px] rounded-none border-0"
          scrimClassName="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#141d17]/95 via-[#141d17]/40 to-[#141d17]/15"
        >
          <div className="p-6 sm:p-8 flex flex-col justify-end min-h-[255px] sm:min-h-[295px] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#e5c27b]">
              <Flame className="w-4 h-4" />
              <span>
                {data?.nextEvent?.isLiveNow
                  ? 'Đêm Hoa Đăng đang diễn ra tối nay'
                  : 'Sự kiện cộng đồng nhẹ nhàng · Mỗi Rằm hàng tháng, 14/2 & 11/11'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-serif-healing text-white [text-wrap:balance]">
              {data?.nextEvent?.title || 'Đêm Hoa Đăng Cộng Đồng'}
            </h1>
            <p className="text-sm sm:text-base text-[#dbe4d9] max-w-2xl leading-relaxed font-serif-healing italic">
              {data?.nextEvent?.subtitle ||
                'Không cần nói chuyện nếu bạn thấy mệt. Chỉ cần đặt một ngọn đèn bình an lên mặt hồ lúc 20:00–23:00 và nhìn thấy mình không hoàn toàn đơn độc.'}
            </p>
          </div>
        </SanctuaryScene3D>

        {/* Real Countdown + Real Lantern Count Bar */}
        <div className="p-5 sm:p-6 bg-[#17221b] flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[#293a2d]">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#9db4a0]">
                {data?.nextEvent?.isLiveNow ? 'Đang mở mặt hồ tới 23:00' : 'Đếm ngược tới đêm kế tiếp'}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#f4d58d] mt-0.5">
                {data?.nextEvent?.isLiveNow
                  ? 'Đang diễn ra tối nay'
                  : `${countdown.days} ngày · ${String(countdown.hours).padStart(2, '0')}:${String(
                      countdown.mins
                    ).padStart(2, '0')}:${String(countdown.secs).padStart(2, '0')}`}
              </div>
            </div>

            <div className="h-9 w-px bg-[#2c3f31] hidden sm:block" />

            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#9db4a0]">
                Hoa đăng thật đang sáng trên hồ
              </div>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#f2f6ee] mt-0.5">
                {data?.publicLanternsCount ?? 0} ngọn đèn
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenFloatModal}
              className="min-h-[46px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#527349] text-white text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              <Waves className="w-4 h-4" />
              <span>Thả một ngọn đèn ngay</span>
            </button>
            <button
              type="button"
              onClick={onOpenSendGift}
              className="min-h-[46px] px-4 py-2 rounded-xl bg-[#27382c] hover:bg-[#314637] border border-[#445c49] text-[#f2f6ee] text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4 text-[#e5c27b]" />
              <span>Gửi ngọn đèn cho bạn bè</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Schedule Cards */}
      {data && data.upcomingEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.upcomingEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] space-y-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#46613e] dark:text-[#98c18e] tabular-nums">
                <Calendar className="w-4 h-4" />
                <span>{new Date(ev.startAt).toLocaleDateString('vi-VN')} · 20:00–23:00</span>
              </div>
              <h2 className="text-base font-bold font-serif-healing">{ev.title}</h2>
              <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">{ev.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {/* Live Public Lantern Wall (zero PII) */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold font-serif-healing">Những ngọn đèn gần đây trên mặt hồ</h2>
            <p className="text-xs text-[#576c59] dark:text-[#a6b7a8]">
              Mỗi lời nhắn đều ẩn danh và đã qua lớp lọc từ khóa an toàn.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold"
          >
            Làm mới mặt hồ
          </button>
        </div>

        {!data || data.recentPublicLanterns.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] text-center text-sm text-[#576c59] dark:text-[#b0c0b2]">
            Mặt hồ đang tĩnh lặng. Bạn có thể bấm “Thả một ngọn đèn ngay” để thắp ngọn đèn đầu tiên tối nay.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.recentPublicLanterns.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex flex-col justify-between gap-3 heali-card-surface"
              >
                <p className="text-sm sm:text-base font-serif-healing leading-relaxed">“{l.message}”</p>
                <div className="flex items-center justify-between gap-2 text-xs text-[#576c59] dark:text-[#b0c0b2]">
                  <span>{l.authorNickname}</span>
                  <button
                    type="button"
                    onClick={() => void handleRipple(l.id)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#faf7ef] dark:bg-[#1b241d] border border-[#d6d3c6] dark:border-[#324236] hover:border-[#46613e] inline-flex items-center gap-1.5 tabular-nums transition"
                  >
                    <Droplets className="w-3.5 h-3.5 text-[#46613e] dark:text-[#7aa370]" />
                    <span>Gợn sóng nhẹ ({l.ripples})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!isPublicRoute) {
    return innerContent;
  }

  return (
    <div className="min-h-screen bg-[#f4f4ed] dark:bg-[#141a15] text-[#273829] dark:text-[#edf2e8] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#fafaf4]/95 dark:bg-[#182019]/95 backdrop-blur-sm border-b border-[#e2e6da] dark:border-[#2c3a2e] px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenLanding}
            className="flex items-center gap-2 min-h-[44px]"
          >
            <Leaf className="w-5 h-5 text-[#496946] dark:text-[#8eb984]" />
            <span className="text-2xl font-bold font-serif-healing">
              heali<span className="text-[#496946] dark:text-[#8eb984]">.</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenLanding && (
              <button
                type="button"
                onClick={onOpenLanding}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829]"
              >
                Giới thiệu
              </button>
            )}
            {onOpenHelpline && (
              <button
                type="button"
                onClick={onOpenHelpline}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#9b3d2b] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Cần giúp ngay</span>
              </button>
            )}
            {onEnterApp && (
              <button
                type="button"
                onClick={onEnterApp}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <span>Vào góc nhỏ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-16">{innerContent}</main>
    </div>
  );
};
