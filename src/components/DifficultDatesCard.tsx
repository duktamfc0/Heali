import React, { useState } from 'react';
import { Calendar, Plus, Trash2, HeartHandshake, Bell, BellOff } from 'lucide-react';
import type { DifficultDate } from '../hooks/useAppPreferences';
import { VI_COPY } from '../i18n/vi';

interface DifficultDatesCardProps {
  dates: DifficultDate[];
  onAddDate: (item: Omit<DifficultDate, 'id'>) => void;
  onToggleNotify: (id: string) => void;
  onRemoveDate: (id: string) => void;
  showRealWorldBridgeByDefault?: boolean;
  onOpenHelpline: () => void;
}

export const DifficultDatesCard: React.FC<DifficultDatesCardProps> = ({
  dates,
  onAddDate,
  onToggleNotify,
  onRemoveDate,
  showRealWorldBridgeByDefault = false,
  onOpenHelpline,
}) => {
  const [label, setLabel] = useState('');
  const [monthDay, setMonthDay] = useState('');
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [showBridgeDetails, setShowBridgeDetails] = useState(showRealWorldBridgeByDefault);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !monthDay) return;
    onAddDate({
      label: label.trim().slice(0, 60),
      monthDay,
      notifyInApp,
    });
    setLabel('');
    setMonthDay('');
  };

  return (
    <div className="space-y-4">
      {/* Difficult Dates Manager */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
            <Calendar className="w-5 h-5 text-[#46613e] dark:text-[#7aa370]" />
            <span>Những ngày dễ chùng lòng</span>
          </div>
          <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
            Đánh dấu riêng trên thiết bị của bạn (kỷ niệm, sinh nhật người cũ, ngày chia tay...). Heali chỉ hiện lời nhắn dịu trong app nếu bạn tự bật — không gửi thông báo đẩy thúc giục.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            placeholder="Ví dụ: Ngày kỷ niệm cũ, Sinh nhật..."
            className="sm:col-span-5 min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 py-2 text-sm text-[#273829] dark:text-[#edf2e8]"
            required
          />
          <input
            type="date"
            value={monthDay}
            onChange={(e) => setMonthDay(e.target.value)}
            className="sm:col-span-4 min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 py-2 text-sm text-[#273829] dark:text-[#edf2e8]"
            required
          />
          <button
            type="submit"
            className="sm:col-span-3 min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Đánh dấu</span>
          </button>
        </form>

        <label className="inline-flex items-center gap-2 text-sm text-[#4e624f] dark:text-[#b0c0b2] cursor-pointer">
          <input
            type="checkbox"
            checked={notifyInApp}
            onChange={(e) => setNotifyInApp(e.target.checked)}
            className="w-4 h-4 accent-[#46613e]"
          />
          <span>Hiện lời nhắn nhẹ ngay trong app khi trùng ngày này</span>
        </label>

        {dates.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#e5e2d5] dark:border-[#2e3d31]">
            {dates.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-xs text-[#576c59] dark:text-[#b0c0b2] tabular-nums">
                    Ngày: {new Date(item.monthDay).toLocaleDateString('vi-VN')} ·{' '}
                    {item.notifyInApp ? 'Hiện lời nhắn dịu trong app' : 'Đang tắt lời nhắn'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleNotify(item.id)}
                    aria-label={item.notifyInApp ? 'Tắt lời nhắn ngày này' : 'Bật lời nhắn ngày này'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#d6d3c6] dark:border-[#324236]"
                  >
                    {item.notifyInApp ? (
                      <Bell className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
                    ) : (
                      <BellOff className="w-4 h-4 text-[#7c8c7c]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveDate(item.id)}
                    aria-label="Xóa ngày đã đánh dấu"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#9b4b38] hover:bg-[#fdf3ef] dark:hover:bg-[#2c1f1c]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-World Bridge Card ("Quay về đời thực") */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
            <HeartHandshake className="w-5 h-5 text-[#46613e] dark:text-[#7aa370]" />
            <span>{VI_COPY.realWorldBridge.title}</span>
          </div>
          {!showRealWorldBridgeByDefault && (
            <button
              type="button"
              onClick={() => setShowBridgeDetails((v) => !v)}
              className="text-sm font-semibold text-[#46613e] dark:text-[#8eb984] hover:underline"
            >
              {showBridgeDetails ? 'Thu gọn' : 'Đọc thêm'}
            </button>
          )}
        </div>

        {(showBridgeDetails || showRealWorldBridgeByDefault) && (
          <div className="space-y-3 text-base text-[#3c4f3e] dark:text-[#cbd6cc] leading-relaxed">
            <p>{VI_COPY.realWorldBridge.body}</p>
            <p className="text-sm text-[#576c59] dark:text-[#b0c0b2]">
              {VI_COPY.realWorldBridge.disclaimer}
            </p>
            <button
              type="button"
              onClick={onOpenHelpline}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#d6d3c6] dark:border-[#324236] text-sm font-semibold text-[#273829] dark:text-[#edf2e8]"
            >
              Xem số hỗ trợ &amp; cách nhắn cho người thân
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
