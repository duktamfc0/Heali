import React, { useState, useEffect } from 'react';
import type { Wish } from '../services/api';
import { api, PinLockedError } from '../services/api';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import {
  Sparkles,
  Heart,
  TreeDeciduous,
  ArrowRight,
  BookOpen,
  Wind,
  PhoneCall,
  Send,
} from 'lucide-react';
import { VI_COPY } from '../i18n/vi';

interface PersonalJourneyDashboardProps {
  lowMotion?: boolean;
  embeddedIn3DRoom?: boolean;
  onOpenJournal: () => void;
  onOpenWishes: () => void;
  onOpenCalm?: () => void;
  onOpenDailyCard?: () => void;
  onOpenSendGift?: () => void;
  lighterFeedbackAnsweredToday?: boolean;
  onAnswerLighterFeedback?: () => void;
}

export const PersonalJourneyDashboard: React.FC<PersonalJourneyDashboardProps> = ({
  lowMotion = false,
  embeddedIn3DRoom = false,
  onOpenJournal,
  onOpenWishes,
  onOpenCalm,
  onOpenDailyCard,
  onOpenSendGift,
  lighterFeedbackAnsweredToday = false,
  onAnswerLighterFeedback,
}) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [activeEmotionInfo, setActiveEmotionInfo] = useState<string | null>(null);
  const [moodFeedback, setMoodFeedback] = useState<string | null>(null);
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [latestWish, setLatestWish] = useState<Wish | null>(null);
  const [pinLockedNotice, setPinLockedNotice] = useState(false);

  const moodLevels = [
    {
      score: 1,
      label: 'Rất nặng',
      dotColor: 'bg-[#7384ad]',
      feedback: VI_COPY.moodCheckin.lowMoodSupport,
    },
    {
      score: 2,
      label: 'Chùng xuống',
      dotColor: 'bg-[#76949f]',
      feedback: 'Có vẻ hôm nay mọi thứ hơi nặng nề. Nếu muốn, bạn có thể viết ra vài dòng hoặc nghỉ ngơi một chút.',
    },
    {
      score: 3,
      label: 'Tĩnh lặng',
      dotColor: 'bg-[#66a67f]',
      feedback: 'Đã ghi nhận trạng thái lúc này cho riêng bạn.',
    },
    {
      score: 4,
      label: 'Đỡ hơn',
      dotColor: 'bg-[#c7b96b]',
      feedback: 'Đã ghi nhận trạng thái lúc này. Không cần vội, cứ đi theo nhịp của riêng bạn.',
    },
    {
      score: 5,
      label: 'Dịu êm',
      dotColor: 'bg-[#e3b06b]',
      feedback: 'Đã ghi nhận trạng thái lúc này cho riêng bạn.',
    },
  ];

  useEffect(() => {
    api
      .getMoodCheckins()
      .then((res) => {
        setWeeklyCount(res.weeklySelfCareCount);
        if (res.checkins.length > 0) {
          setSelectedMood(res.checkins[0].moodScore);
          setSelectedEmotions(res.checkins[0].emotions || []);
        }
      })
      .catch((err) => {
        if (err instanceof PinLockedError) {
          setPinLockedNotice(true);
        }
      });

    api
      .getWishes()
      .then((wishes) => {
        if (wishes.length > 0) {
          setLatestWish(wishes[0]);
        }
      })
      .catch(() => {});
  }, []);

  const toggleEmotion = (emoName: string) => {
    setActiveEmotionInfo(emoName);
    setSelectedEmotions((prev) =>
      prev.includes(emoName) ? prev.filter((item) => item !== emoName) : [...prev, emoName]
    );
  };

  const handleQuickMoodCheckIn = async (score: number) => {
    setSelectedMood(score);
    const target = moodLevels.find((m) => m.score === score);
    setMoodFeedback(target?.feedback || VI_COPY.moodCheckin.recordedNeutral);

    try {
      await api.saveMoodCheckin({
        moodScore: score,
        emotions: selectedEmotions,
      });
      setWeeklyCount((prev) => (prev === null ? 1 : prev + 1));
    } catch (err) {
      if (err instanceof PinLockedError) {
        setPinLockedNotice(true);
      }
    }
  };

  const emotionDefinition = activeEmotionInfo
    ? VI_COPY.emotionWheel.find((e) => e.name === activeEmotionInfo)?.definition
    : null;

  const activeMoodMeta = moodLevels.find((m) => m.score === (selectedMood || 3)) || moodLevels[2];

  return (
    <section className="space-y-4 heali-stage-enter">
      {/* Interactive 3D Emotion Sanctuary Stage — Crystal reacts smoothly to selectedMood */}
      {!embeddedIn3DRoom && (
        <SanctuaryScene3D
          variant="overview"
          moodScore={selectedMood || 3}
          lowMotion={lowMotion}
          allowPureViewToggle
          className="min-h-[210px] sm:min-h-[235px]"
        >
          <div className="p-5 sm:p-7 flex flex-col justify-end min-h-[210px] sm:min-h-[235px] text-[#f4f4ed] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#b6dbaf]">
              <Heart className="w-3.5 h-3.5 text-[#f0a490]" />
              <span>Góc riêng tư · Trạng thái: {activeMoodMeta.label}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white [text-wrap:balance]">
              Gọi tên điều bạn đang mang lúc này
            </h2>
            <p className="text-xs sm:text-sm text-[#d4e0d3] max-w-xl">
              Chạm chọn cảm giác bên dưới — viên tinh thể nội tâm sẽ đổi sắc dịu theo nhịp lòng của bạn.
            </p>
          </div>
        </SanctuaryScene3D>
      )}

      {/* 3-Panel Honest Dashboard (visual-first, compact copy) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: Emotion Wheel + Mood Check-in */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm flex flex-col justify-between space-y-4 heali-card-surface">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#243627] dark:text-[#edf2e8] font-serif-healing">
              {VI_COPY.moodCheckin.heading}
            </h3>
            <button
              type="button"
              onClick={onOpenJournal}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#46613e] dark:text-[#8eb984] hover:underline shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Nhật ký</span>
            </button>
          </div>

          {/* Emotion Wheel Chips with Definitions */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {VI_COPY.emotionWheel.map((emo) => {
                const active = selectedEmotions.includes(emo.name);
                return (
                  <button
                    key={emo.name}
                    type="button"
                    onClick={() => toggleEmotion(emo.name)}
                    className={`min-h-[38px] px-3 py-1 rounded-xl text-xs sm:text-sm transition ${
                      active
                        ? 'bg-[#46613e] text-white font-semibold'
                        : 'bg-[#f1efe5] dark:bg-[#232f26] text-[#4b604d] dark:text-[#cbd6cc] border border-[#dfe2d5] dark:border-[#324236] hover:border-[#9eb198]'
                    }`}
                  >
                    {emo.name}
                  </button>
                );
              })}
            </div>
            {emotionDefinition && activeEmotionInfo && (
              <p className="text-xs sm:text-sm text-[#4e624f] dark:text-[#b0c0b2] px-1">
                <strong className="text-[#243627] dark:text-[#edf2e8]">{activeEmotionInfo}:</strong>{' '}
                {emotionDefinition}
              </p>
            )}
          </div>

          {/* 5 Mood Choices with luminous color orbs */}
          <div className="grid grid-cols-5 gap-2">
            {moodLevels.map((ml) => {
              const isSelected = selectedMood === ml.score;
              return (
                <button
                  key={ml.score}
                  type="button"
                  onClick={() => void handleQuickMoodCheckIn(ml.score)}
                  className={`min-h-[66px] p-2 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition ${
                    isSelected
                      ? 'border-[#46613e] dark:border-[#7aa370] bg-[#e6efe2] dark:bg-[#2a3b2d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                      : 'border-[#dfe2d5] dark:border-[#324236] bg-[#f1efe5] dark:bg-[#232f26] text-[#4b5f4c] dark:text-[#cbd6cc] hover:border-[#9eb198]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center tabular-nums text-white shadow-sm ${ml.dotColor} ${
                      isSelected ? 'ring-2 ring-offset-2 ring-[#46613e] dark:ring-[#8eb984] dark:ring-offset-[#2a3b2d]' : 'opacity-80'
                    }`}
                  >
                    {ml.score}
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium leading-tight">{ml.label}</span>
                </button>
              );
            })}
          </div>

          {pinLockedNotice && (
            <p className="text-xs sm:text-sm text-[#7a5d2e] dark:text-[#d8b473]">
              Góc riêng tư đang khoá bằng mã PIN. Mở tab Nhật ký để nhập PIN và lưu check-in.
            </p>
          )}

          {/* Supportive non-toxic-positive Mood Feedback */}
          {moodFeedback && (
            <div className="p-4 rounded-2xl bg-[#ebf0e5] dark:bg-[#232f26] border border-[#c7d6c0] dark:border-[#324236] text-base text-[#273829] dark:text-[#edf2e8] font-serif-healing leading-relaxed space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#46613e] dark:text-[#8eb984] shrink-0 mt-1" />
                <span>{moodFeedback}</span>
              </div>
              {selectedMood === 1 && (
                <div className="flex flex-wrap items-center gap-2 font-sans pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCalm
                        ? onOpenCalm()
                        : window.dispatchEvent(new CustomEvent('heali:open-breathing'))
                    }
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold transition"
                  >
                    <Wind className="w-4 h-4" />
                    <span>{VI_COPY.moodCheckin.breatheCta}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenJournal}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#c7d6c0] dark:border-[#324236] text-[#273829] dark:text-[#edf2e8] text-sm font-medium transition"
                  >
                    <BookOpen className="w-4 h-4 text-[#46613e] dark:text-[#8eb984]" />
                    <span>{VI_COPY.moodCheckin.writeCta}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('heali:open-helpline'))}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fdf3ef] border border-[#dfc1b8] text-[#823020] text-sm font-semibold transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{VI_COPY.moodCheckin.helpCta}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel 2: Honest Non-Punitive Weekly Reflection */}
        <div className="p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#e6efe2] dark:bg-[#2a3b2d] border border-[#c7d6c0] dark:border-[#3b4e3f] flex items-center justify-center text-[#46613e] dark:text-[#8eb984] mb-3">
              <Heart className="w-5 h-5" />
            </div>
            <div className="text-xs text-[#5d715f] dark:text-[#b0c0b2]">Nhịp ghé thăm bản thân</div>
            <div className="text-2xl font-bold text-[#243627] dark:text-[#edf2e8] font-serif-healing mt-1 tabular-nums">
              {weeklyCount !== null ? `${weeklyCount} lần trong tuần` : 'Góc riêng tư'}
            </div>
          </div>

          <p className="text-sm text-[#4e624f] dark:text-[#b0c0b2] font-serif-healing leading-relaxed mt-3">
            {weeklyCount && weeklyCount > 0
              ? `${VI_COPY.moodCheckin.weeklySummaryPrefix} ${weeklyCount} ${VI_COPY.moodCheckin.weeklySummarySuffix}`
              : VI_COPY.moodCheckin.emptyWeeklySummary}
          </p>
        </div>

        {/* Panel 3: Recent Personal Intention */}
        <div className="p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#46613e] dark:text-[#8eb984] font-semibold mb-3">
              <TreeDeciduous className="w-4 h-4" />
              <span>Một điều nhỏ cho mình</span>
            </div>

            <div className="mt-1">
              <span className="text-xs text-[#5d715f] dark:text-[#b0c0b2] block mb-1.5">
                Lời nhắn gần đây trên Cây ước:
              </span>
              <p className="text-sm text-[#273829] dark:text-[#edf2e8] font-serif-healing italic line-clamp-3 leading-relaxed">
                “{latestWish?.actionCommitment || 'Nếu hôm nay thấy mệt, bạn chỉ cần làm một việc thật nhỏ: uống một ngụm nước hoặc nghỉ mắt một phút.'}”
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenWishes}
            className="min-h-[44px] flex items-center gap-1.5 text-sm text-[#46613e] dark:text-[#8eb984] hover:underline font-semibold mt-4 transition"
          >
            <span>Xem Cây ước nguyện</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stage 3 Quick Sharing / Reflection Bar & Optional Section 8.4 Feeling Lighter Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(onOpenDailyCard || onOpenSendGift) && (
          <div className="p-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-[#243627] dark:text-[#edf2e8]">
                Gửi dịu dàng · Không lộ riêng tư
              </div>
              <p className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
                Xem câu hỏi phản chiếu hôm nay hoặc gửi 1 ngọn đèn cho người bạn đang buồn.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {onOpenDailyCard && (
                <button
                  type="button"
                  onClick={onOpenDailyCard}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#eef3ea] dark:bg-[#233126] border border-[#c7d6c0] dark:border-[#3a523d] text-xs font-semibold text-[#243627] dark:text-[#edf2e8] inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#46613e] dark:text-[#98c18e]" />
                  <span>Thẻ phản chiếu</span>
                </button>
              )}
              {onOpenSendGift && (
                <button
                  type="button"
                  onClick={onOpenSendGift}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi ngọn đèn</span>
                </button>
              )}
            </div>
          </div>
        )}

        {onAnswerLighterFeedback && (
          <div className="p-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm flex flex-wrap items-center justify-between gap-3">
            {lighterFeedbackAnsweredToday ? (
              <p className="text-xs sm:text-sm text-[#4e624f] dark:text-[#b0c0b2]">
                Cảm ơn bạn đã phản hồi (chỉ lưu số đếm tổng hợp ẩn danh). Dù hôm nay nhẹ hơn hay vẫn còn nặng, cứ đi chậm theo nhịp của bạn.
              </p>
            ) : (
              <>
                <div className="text-xs sm:text-sm font-medium text-[#243627] dark:text-[#edf2e8]">
                  Hôm nay Heali có giúp bạn nhẹ hơn một chút không? <span className="text-[#6d7c6d] font-normal">(có thể bỏ qua)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      void api.trackHealthyMetric('feeling_lighter_yes');
                      onAnswerLighterFeedback();
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#eef3ea] dark:bg-[#233126] border border-[#c7d6c0] dark:border-[#3a523d] text-xs font-semibold"
                  >
                    Có một chút
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void api.trackHealthyMetric('feeling_lighter_no');
                      onAnswerLighterFeedback();
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs font-medium"
                  >
                    Chưa lắm
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
