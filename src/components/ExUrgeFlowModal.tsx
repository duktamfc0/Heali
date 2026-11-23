import React, { useState, useEffect } from 'react';
import { Clock, Mail, Wind, X, Pause, Play } from 'lucide-react';
import { SupportPromptCard } from './SupportPromptCard';
import { VI_COPY } from '../i18n/vi';
import { saveLetterDraft } from '../utils/offlineDrafts';

interface ExUrgeFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveToUnsentLetter: (draftText: string) => void;
  onOpenBreathing: () => void;
}

export const ExUrgeFlowModal: React.FC<ExUrgeFlowModalProps> = ({
  isOpen,
  onClose,
  onMoveToUnsentLetter,
  onOpenBreathing,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [timerPaused, setTimerPaused] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<string>('');
  const [messageDraft, setMessageDraft] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(600);
    setTimerPaused(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timerPaused || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isOpen, timerPaused, secondsLeft]);

  if (!isOpen) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleMoveToLetter = () => {
    const combinedNote = [
      selectedIntent ? `Điều mình từng mong: ${selectedIntent}` : '',
      messageDraft.trim(),
    ]
      .filter(Boolean)
      .join('\n\n');

    saveLetterDraft({
      recipient: 'ex',
      recipientName: 'Người từng thương',
      title: 'Những điều định nhắn nhưng giữ lại đây',
      content: combinedNote,
    });
    onMoveToUnsentLetter(combinedNote);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ex-urge-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 sm:p-7 shadow-2xl text-[#273829] dark:text-[#edf2e8] space-y-5 my-auto">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-center text-[#46613e] dark:text-[#7aa370] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ex-urge-title" className="text-xl font-bold font-serif-healing">
                {VI_COPY.exUrge.title}
              </h2>
              <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] mt-1 leading-relaxed">
                {VI_COPY.exUrge.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#576c59] dark:text-[#b0c0b2] hover:bg-[#eef2e8] dark:hover:bg-[#232f26] transition"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gentle 10-Minute Pause Countdown */}
        <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[#576c59] dark:text-[#b0c0b2]">
              Thời gian dừng nhẹ nhàng
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#243627] dark:text-[#edf2e8] mt-0.5">
              {formattedTime}
            </div>
            <p className="text-xs text-[#576c59] dark:text-[#b0c0b2] mt-0.5">
              {secondsLeft === 0
                ? '10 phút đã trôi qua. Quyền quyết định vẫn là của bạn.'
                : 'Chưa cần quyết định gửi hay không ngay lúc này.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTimerPaused((p) => !p)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] text-sm font-medium inline-flex items-center gap-1.5 transition"
          >
            {timerPaused ? (
              <>
                <Play className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
                <span>Chạy tiếp</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
                <span>Tạm dừng</span>
              </>
            )}
          </button>
        </div>

        {/* Step 1: Reflection Question */}
        <div className="space-y-2.5">
          <div className="text-sm font-semibold text-[#243627] dark:text-[#edf2e8]">
            {VI_COPY.exUrge.questionLabel}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VI_COPY.exUrge.intentOptions.map((option) => {
              const active = selectedIntent === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedIntent(active ? '' : option)}
                  className={`min-h-[44px] p-3 rounded-xl border text-left text-sm transition ${
                    active
                      ? 'bg-[#e6efe2] dark:bg-[#2a3b2d] border-[#46613e] dark:border-[#7aa370] font-semibold'
                      : 'bg-[#f1efe5] dark:bg-[#232f26] border-[#dcdad0] dark:border-[#324236] hover:border-[#9eb198]'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Draft Text Area + Support Check */}
        <div className="space-y-2">
          <label htmlFor="ex-urge-draft" className="block text-sm font-semibold">
            {VI_COPY.exUrge.draftLabel}
          </label>
          <textarea
            id="ex-urge-draft"
            rows={4}
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            placeholder="Cứ gõ ra ở đây điều bạn định nhắn... Chỉ mình bạn thấy dòng này."
            className="w-full rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3.5 text-base text-[#273829] dark:text-[#edf2e8] placeholder:text-[#6f7e70] focus:outline-none focus:border-[#46613e] resize-none font-serif-healing leading-relaxed"
          />
          <SupportPromptCard text={messageDraft} compact />
        </div>

        {/* Actions: Move to Unsent Letter or Breathe */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e5e2d5] dark:border-[#2e3d31]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBreathing();
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-sm font-semibold inline-flex items-center gap-2 transition"
          >
            <Wind className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
            <span>Thở 1 phút</span>
          </button>

          <button
            type="button"
            onClick={handleMoveToLetter}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition"
          >
            <Mail className="w-4 h-4" />
            <span>{VI_COPY.exUrge.moveToUnsentLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
