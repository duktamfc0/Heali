import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldAlert, Send, Power, Lock, Wind, BookOpen, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { detectRisk, type RiskLevel } from '../../shared/riskDetector';
import { SupportPromptCard } from './SupportPromptCard';
import type { SupportedLanguage } from '../i18n';

interface AiCompanionCardProps {
  language: SupportedLanguage;
  enabled: boolean;
  consentAccepted: boolean;
  onToggleEnabled: (next?: boolean) => void;
  onAcceptConsent: (accepted: boolean) => void;
  onOpenHelpline: () => void;
  onOpenBreathing: () => void;
  onOpenJournal: () => void;
}

interface ReflectionTurn {
  role: 'user' | 'model';
  text: string;
}

export const AiCompanionCard: React.FC<AiCompanionCardProps> = ({
  language,
  enabled,
  consentAccepted,
  onToggleEnabled,
  onAcceptConsent,
  onOpenHelpline,
  onOpenBreathing,
  onOpenJournal,
}) => {
  const [turns, setTurns] = useState<ReflectionTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [safetyLevel, setSafetyLevel] = useState<RiskLevel>(0);
  const [turnsUsedToday, setTurnsUsedToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(8);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isClosingTurn, setIsClosingTurn] = useState(false);

  const isEn = language === 'en';

  useEffect(() => {
    if (!enabled) return;
    api
      .getAiCompanionStatus()
      .then((status) => {
        setTurnsUsedToday(status.turnsUsedToday);
        setDailyLimit(status.dailyLimit);
        setIsConfigured(status.isConfigured);
        setIsClosingTurn(status.turnsUsedToday >= status.dailyLimit);
      })
      .catch(() => {});
  }, [enabled]);

  // Run risk detector live cleanly in client too
  const liveRisk = draft.trim() ? detectRisk(draft).level : 0;
  const activeSafetyLevel = Math.max(safetyLevel, liveRisk) as RiskLevel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || isSending || !consentAccepted) return;

    setErrorMsg(null);
    const localRisk = detectRisk(cleaned).level;
    if (localRisk >= 2) {
      setSafetyLevel(localRisk);
      return;
    }

    setIsSending(true);
    try {
      const result = await api.reflectWithCompanion({
        message: cleaned,
        consentAccepted: true,
        language,
        history: turns.slice(-8),
      });

      setTurnsUsedToday(result.turnsUsedToday);
      setDailyLimit(result.dailyLimit);

      if (result.blockedBySafety || !result.reply) {
        setSafetyLevel((result.riskLevel || 2) as RiskLevel);
        return;
      }

      setTurns((prev) => [...prev, { role: 'user', text: cleaned }, { role: 'model', text: result.reply! }]);
      setDraft('');
      setSafetyLevel(0);
      if (result.isClosingTurn) {
        setIsClosingTurn(true);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isEn
          ? 'Could not reach the reflection service right now.'
          : 'Không thể kết nối máy chủ phản chiếu lúc này.'
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!enabled) {
    return (
      <div className="p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#46613e] dark:text-[#8eb984]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Optional Tool · Turned off by default' : 'Công cụ tùy chọn · Đang tắt mặc định'}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold font-serif-healing text-[#243627] dark:text-[#edf2e8]">
            {isEn ? 'Guarded AI Reflective Mirror' : 'Gương Phản Chiếu AI (Có rào chắn an toàn)'}
          </h3>
          <p className="text-sm text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">
            {isEn
              ? 'An optional space that mirrors your words and asks 1–2 gentle open questions to help organize thoughts. Strictly not a therapist, never diagnoses, capped at 8 turns/day, and can be switched off permanently.'
              : 'Không gian tùy chọn giúp tóm tắt suy nghĩ và đặt 1–2 câu hỏi mở dịu nhẹ. Không phải chuyên gia tâm lý, không chẩn đoán, giới hạn 8 lượt/ngày và có thể tắt ngay lập tức.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleEnabled(true)}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0 transition"
        >
          <Power className="w-4 h-4" />
          <span>{isEn ? 'Open Reflective Mirror' : 'Mở Gương phản chiếu'}</span>
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label={isEn ? 'Guarded AI Reflective Mirror' : 'Gương phản chiếu AI có rào chắn'}
      className="p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#c7d6c0] dark:border-[#374a3a] shadow-sm space-y-4"
    >
      {/* Header with Kill Switch */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#46613e] dark:text-[#8eb984]">
            <Sparkles className="w-4 h-4" />
            <span>
              {isEn
                ? `AI Reflection Tool · ${turnsUsedToday}/${dailyLimit} turns today`
                : `Công cụ phản chiếu AI · Đã dùng ${turnsUsedToday}/${dailyLimit} lượt hôm nay`}
            </span>
          </div>
          <h3 className="text-lg font-bold font-serif-healing text-[#243627] dark:text-[#edf2e8]">
            {isEn
              ? 'Automated Reflection Mirror (Not a human or therapist)'
              : 'Gương Phản Chiếu Tự Động (Không phải người thật hay bác sĩ)'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {turns.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTurns([]);
                setErrorMsg(null);
                setSafetyLevel(0);
              }}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs font-medium inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Clear screen' : 'Xoá khung tạm'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleEnabled(false)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#fdf3ef] dark:bg-[#341f1b] border border-[#dfc1b8] dark:border-[#6e3b30] text-[#823020] dark:text-[#fbd2c9] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isEn ? 'Turn off & hide' : 'Tắt ngay'}</span>
          </button>
        </div>
      </div>

      {/* Explicit Third-Party Consent Gate */}
      {!consentAccepted && (
        <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] space-y-3">
          <div className="flex items-start gap-2.5 text-sm text-[#273829] dark:text-[#edf2e8]">
            <Lock className="w-4 h-4 text-[#46613e] dark:text-[#8eb984] shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-semibold">
                {isEn
                  ? 'Clear consent required before first message'
                  : 'Cần xác nhận đồng ý trước khi gửi đoạn chia sẻ đầu tiên'}
              </p>
              <p className="text-xs sm:text-sm text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">
                {isEn
                  ? 'Messages typed here are sent securely to the server-side Gemini model to generate a short reflection and are NOT saved in Heali databases (only your daily turn count is tracked). It will never tell you whether to break up or reconcile, and will never act like a therapist.'
                  : 'Nội dung bạn nhập tại đây sẽ được gửi qua máy chủ xử lý Gemini để tạo phản hồi ngắn và KHÔNG lưu trữ lại trong cơ sở dữ liệu Heali (chỉ đếm số lượt trong ngày). Công cụ sẽ không khuyên chia tay/quay lại hay thay thế chuyên viên tâm lý.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAcceptConsent(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold transition"
          >
            {isEn
              ? 'I understand — allow reflection for this session'
              : 'Tôi đã hiểu và đồng ý dùng công cụ phản chiếu'}
          </button>
        </div>
      )}

      {!isConfigured && (
        <div className="p-3.5 rounded-2xl bg-[#f6efe2] dark:bg-[#2b271c] border border-[#dfc89e] dark:border-[#635132] text-xs sm:text-sm text-[#4e3813] dark:text-[#ecd8ae] flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isEn
              ? 'Server GEMINI_API_KEY is currently not configured. Please use your Private Journal or Calm exercises while offline.'
              : 'Khóa GEMINI_API_KEY phía máy chủ hiện chưa được cấu hình. Bạn có thể dùng Nhật ký riêng tư hoặc các bài thở trong góc Dịu lại nhé.'}
          </span>
        </div>
      )}

      {/* Active Safety Escalation Card */}
      {activeSafetyLevel > 0 && (
        <SupportPromptCard
          forcedLevel={activeSafetyLevel}
          onOpenHelpline={onOpenHelpline}
          onStartBreathing={onOpenBreathing}
          compact
        />
      )}

      {/* Ephemeral Reflection Transcript */}
      {turns.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {turns.map((turn, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                turn.role === 'user'
                  ? 'bg-[#e6efe2] dark:bg-[#233227] text-[#243627] dark:text-[#edf2e8] ml-6'
                  : 'bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-[#273829] dark:text-[#edf2e8] mr-6 font-serif-healing'
              }`}
            >
              <div className="text-[11px] font-sans font-semibold text-[#576c59] dark:text-[#98b496] mb-1">
                {turn.role === 'user'
                  ? isEn
                    ? 'You'
                    : 'Bạn'
                  : isEn
                  ? 'AI Reflection (automated)'
                  : 'Gương phản chiếu AI (tự động)'}
              </div>
              <p className="whitespace-pre-wrap">{turn.text}</p>
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#f7e7e3] dark:bg-[#3a221d] border border-[#dfc0b4] dark:border-[#784237] text-xs sm:text-sm text-[#8f4431] dark:text-[#f2c3b7]">
          {errorMsg}
        </div>
      )}

      {isClosingTurn ? (
        <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#212c24] border border-[#c3d3bd] dark:border-[#3c5240] space-y-3">
          <p className="text-sm text-[#273829] dark:text-[#edf2e8] leading-relaxed">
            {isEn
              ? `You reached today's ${dailyLimit}-turn reflection cap. To protect your rest and avoid screen fatigue, please pause here, drink a glass of water, or switch to a grounding exercise.`
              : `Hôm nay bạn đã dừng lại ở ${dailyLimit} lượt phản chiếu nhẹ. Để tránh mỏi mắt hoặc phụ thuộc màn hình, bạn hãy nghỉ một chút, uống ngụm nước hoặc chuyển sang viết nhật ký riêng nhé.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenBreathing}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#46613e] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{isEn ? '1-minute breathing' : 'Thở 1 phút'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenJournal}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#faf7ef] dark:bg-[#172019] border border-[#c3d3bd] dark:border-[#394b3d] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isEn ? 'Open Private Journal' : 'Ghi vào Nhật ký riêng'}</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!consentAccepted || isSending}
            maxLength={1500}
            rows={3}
            placeholder={
              consentAccepted
                ? isEn
                  ? 'Write briefly what is weighing on your mind right now...'
                  : 'Viết vài dòng ngắn về điều đang làm bạn trăn trở lúc này...'
                : isEn
                ? 'Please confirm consent above to begin...'
                : 'Hãy bấm xác nhận đồng ý ở trên để bắt đầu...'
            }
            className="w-full rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3.5 text-sm sm:text-base text-[#273829] dark:text-[#edf2e8] placeholder:text-[#788778] focus:outline-none focus:border-[#46613e] disabled:opacity-60"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[11px] text-[#576c59] dark:text-[#a6b7a8]">
              <span>
                {isEn
                  ? 'Not saved on server · Max 8 turns/day'
                  : 'Không lưu nội dung trên máy chủ · Giới hạn 8 lượt/ngày'}
              </span>
              {consentAccepted && (
                <button
                  type="button"
                  onClick={() => onAcceptConsent(false)}
                  className="underline hover:text-[#273829] dark:hover:text-white"
                >
                  {isEn ? 'Revoke consent' : 'Rút lại đồng ý'}
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!consentAccepted || isSending || draft.trim().length < 2}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSending
                  ? isEn
                    ? 'Reflecting...'
                    : 'Đang phản chiếu...'
                  : isEn
                  ? 'Reflect gently'
                  : 'Phản chiếu nhẹ'}
              </span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
