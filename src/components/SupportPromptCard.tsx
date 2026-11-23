import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, Wind, HeartHandshake, X, MessageSquare } from 'lucide-react';
import { detectRisk, type RiskLevel } from '../../shared/riskDetector';
import { api } from '../services/api';
import { getCopy, type SupportedLanguage } from '../i18n';

interface SupportPromptCardProps {
  text?: string;
  forcedLevel?: RiskLevel;
  onOpenHelpline?: () => void;
  onStartBreathing?: () => void;
  compact?: boolean;
  language?: SupportedLanguage;
}

export const SupportPromptCard: React.FC<SupportPromptCardProps> = ({
  text = '',
  forcedLevel,
  onOpenHelpline,
  onStartBreathing,
  compact = false,
  language = 'vi',
}) => {
  const copy = getCopy(language);
  const [dismissedLevel, setDismissedLevel] = useState<RiskLevel | 0>(0);
  const [helpfulMarked, setHelpfulMarked] = useState(false);
  const shownLevelRef = useRef<number>(0);

  const computed = text ? detectRisk(text).level : 0;
  const level: RiskLevel =
    forcedLevel !== undefined ? (Math.max(forcedLevel, computed) as RiskLevel) : computed;

  useEffect(() => {
    if (level > 0 && level > shownLevelRef.current) {
      shownLevelRef.current = level;
      void api.trackHealthyMetric('support_card_shown');
    }
  }, [level]);

  if (level === 0 || dismissedLevel >= level) return null;

  const triggerBreathing = () => {
    void api.trackHealthyMetric('support_card_opened');
    if (onStartBreathing) {
      onStartBreathing();
    } else {
      window.dispatchEvent(new CustomEvent('heali:open-breathing'));
    }
  };

  const triggerHelpline = () => {
    void api.trackHealthyMetric('support_card_opened');
    if (onOpenHelpline) {
      onOpenHelpline();
    } else {
      window.dispatchEvent(new CustomEvent('heali:open-helpline'));
    }
  };

  const markHelpful = () => {
    setHelpfulMarked(true);
    void api.trackHealthyMetric('support_helpful_yes');
  };

  // Level 3: Urgent safety overlay / high-contrast calm card (always dismissible, never erases draft)
  if (level === 3) {
    return (
      <div
        role="region"
        aria-label="Hỗ trợ an toàn khẩn cấp"
        className="rounded-2xl bg-[#fdf3ef] dark:bg-[#341f1b] border-2 border-[#a84632] dark:border-[#c6634f] p-4 sm:p-5 text-[#273829] dark:text-[#f8ebe6] shadow-md space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <HeartHandshake className="w-5 h-5 text-[#9b3d2b] dark:text-[#e69280] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#6e2417] dark:text-[#fbd2c9] font-serif-healing">
                {copy.supportPrompts.level3Title}
              </h4>
              <p className="text-sm text-[#3d2a25] dark:text-[#efd5ce] leading-relaxed">
                {copy.supportPrompts.level3Body}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissedLevel(3)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e4741] dark:text-[#d8b7af] hover:bg-[#f2dfd8] dark:hover:bg-[#492c26] transition"
            aria-label="Đóng thẻ gợi ý để tiếp tục viết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="tel:115"
            className="min-h-[48px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9b3d2b] hover:bg-[#802e1f] text-white text-sm sm:text-base font-bold transition shadow-sm"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Gọi Cấp cứu 115</span>
          </a>

          <button
            type="button"
            onClick={triggerHelpline}
            className="min-h-[48px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#faf7ef] dark:bg-[#231917] hover:bg-white dark:hover:bg-[#2d201d] border border-[#b98275] dark:border-[#8f584c] text-[#6e2417] dark:text-[#fbd2c9] text-sm sm:text-base font-semibold transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Xem số hỗ trợ &amp; nhắn người thân</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissedLevel(3)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm text-[#4e5f50] dark:text-[#d8b7af] hover:text-[#273829] dark:hover:text-white font-medium"
          >
            Cứ để mình viết tiếp
          </button>
        </div>
      </div>
    );
  }

  // Level 2: Non-judgmental inline card right below input
  if (level === 2) {
    return (
      <div
        role="region"
        aria-label="Hỗ trợ cảm xúc"
        className="rounded-2xl bg-[#f9efe9] dark:bg-[#2f211d] border border-[#cfa194] dark:border-[#795146] p-4 text-[#273829] dark:text-[#f4e6e1] space-y-3"
      >
        <div className="flex items-start gap-2.5">
          <HeartHandshake className="w-5 h-5 text-[#9b4b38] dark:text-[#e29785] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-[#6e2d1f] dark:text-[#f8cfc5] font-serif-healing">
              {copy.supportPrompts.level2Question}
            </h4>
            <p className="text-xs sm:text-sm text-[#4a3a35] dark:text-[#e3c7bf] leading-relaxed">
              {copy.supportPrompts.level2Body}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={triggerHelpline}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9b4b38] hover:bg-[#823c2b] text-white text-xs sm:text-sm font-semibold transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{copy.supportPrompts.level2CallCta}</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissedLevel(2)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#1b241d] hover:bg-white border border-[#d6cfc4] dark:border-[#4b3e3a] text-[#3c4d3e] dark:text-[#edf2e8] text-xs sm:text-sm font-medium transition"
          >
            {copy.supportPrompts.level2ContinueCta}
          </button>
        </div>
      </div>
    );
  }

  // Level 1: Gentle grounding cue (never modal, dismissible)
  return (
    <div
      role="region"
      aria-label="Gợi ý dịu lại"
      className={`rounded-2xl bg-[#eef3ea] dark:bg-[#212c24] border border-[#c3d3bd] dark:border-[#3c5240] ${compact ? 'p-3' : 'p-3.5 sm:p-4'} text-[#273829] dark:text-[#edf2e8] space-y-2.5`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-semibold text-[#2d452a] dark:text-[#cfe3c9]">
            {copy.supportPrompts.level1Title}
          </p>
          <p className="text-xs text-[#4b604d] dark:text-[#b0c0b2] leading-relaxed">
            {copy.supportPrompts.level1Body}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissedLevel(1)}
          className="p-1.5 rounded-lg text-[#5e7260] dark:text-[#b0c0b2] hover:text-[#273829] dark:hover:text-[#edf2e8]"
          aria-label="Ẩn gợi ý"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={triggerBreathing}
          className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>{copy.moodCheckin.breatheCta}</span>
        </button>
        <button
          type="button"
          onClick={triggerHelpline}
          className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf7ef] dark:bg-[#172019] border border-[#cad5c5] dark:border-[#394b3d] text-[#273829] dark:text-[#edf2e8] text-xs font-medium hover:bg-white dark:hover:bg-[#233227] transition"
        >
          <PhoneCall className="w-3.5 h-3.5 text-[#46613e] dark:text-[#98c18e]" />
          <span>Xem nơi có thể gọi</span>
        </button>
        {!helpfulMarked ? (
          <button
            type="button"
            onClick={markHelpful}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-[#4b604d] dark:text-[#b0c0b2] hover:underline ml-auto"
          >
            Thẻ này có ích
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-[#46613e] dark:text-[#98c18e] ml-auto">
            Cảm ơn phản hồi
          </span>
        )}
      </div>
    </div>
  );
};
