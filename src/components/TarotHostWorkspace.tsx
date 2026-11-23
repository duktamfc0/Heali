import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair,
  BookOpen,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Droplets,
  Flame,
  Hand,
  Heart,
  HelpCircle,
  HeartPulse,
  RefreshCw,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Wand2,
  Wind,
  X,
} from 'lucide-react';
import {
  FULL_TAROT_DECK,
  MAJOR_ARCANA,
  TAROT_EMPATHY_MOODS,
  TAROT_LESSONS,
  TAROT_SPREADS,
  buildTarotHostReading,
  getCardSelfQuestion,
  getHealthAndPaceMeaning,
  getTarotCardImageUrl,
  type DrawnTarotCard,
  type TarotCardDef,
  type TarotSpreadId,
  type TarotSuit,
  type TarotTopic,
} from '../data/tarotDeck';
import tarotCardBackImg from '../assets/images/tarot_card_back_1795400313431.jpg';

type TarotWorkspaceMode = 'reading' | 'learn';
type SuitFilter = 'all' | TarotSuit;

export interface TarotHostWorkspaceProps {
  onRequestAdvisorBooking?: (prefill: { topic: string; note: string }) => void;
  onOpenAdvisorChairs?: () => void;
}

const TOPIC_OPTIONS: Array<{ id: TarotTopic; label: string }> = [
  { id: 'healing', label: 'Soi chiếu nội tâm' },
  { id: 'love', label: 'Tình cảm & Kết nối' },
  { id: 'work', label: 'Công việc & Nhịp sống' },
  { id: 'direction', label: 'Suy ngẫm hôm nay' },
];

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, idx) => idx);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getSuitAccent(suit: TarotSuit): {
  icon: React.ComponentType<{ className?: string }>;
  faceBg: string;
  accentText: string;
  label: string;
} {
  switch (suit) {
    case 'wands':
      return {
        icon: Flame,
        faceBg: 'bg-[#3b291f] text-[#f8ede3]',
        accentText: 'text-[#e5aa70]',
        label: 'Lửa · Bộ Gậy',
      };
    case 'cups':
      return {
        icon: Droplets,
        faceBg: 'bg-[#1f343d] text-[#eaf3f6]',
        accentText: 'text-[#8ecae6]',
        label: 'Nước · Bộ Cốc',
      };
    case 'swords':
      return {
        icon: Wind,
        faceBg: 'bg-[#2a313c] text-[#eef1f5]',
        accentText: 'text-[#b8c4d4]',
        label: 'Khí · Bộ Kiếm',
      };
    case 'pentacles':
      return {
        icon: Sprout,
        faceBg: 'bg-[#253625] text-[#f1f4ea]',
        accentText: 'text-[#a8c686]',
        label: 'Đất · Bộ Tiền',
      };
    default:
      return {
        icon: Star,
        faceBg: 'bg-[#273829] text-[#f5efe0]',
        accentText: 'text-[#d8be82]',
        label: 'Ẩn Chính · Linh',
      };
  }
}

interface TarotCardArtworkProps {
  card: TarotCardDef;
  reversed?: boolean;
  className?: string;
  lazy?: boolean;
}

const TarotCardArtwork: React.FC<TarotCardArtworkProps> = ({
  card,
  reversed = false,
  className = '',
  lazy = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const accent = getSuitAccent(card.suit);
  const SuitIcon = accent.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#c8b27d]/60 bg-[#f6f0de] shadow-sm aspect-[5/8.5] flex items-center justify-center ${className}`}
    >
      {!imgFailed ? (
        <img
          src={getTarotCardImageUrl(card.id)}
          alt={`${card.nameVi} (${card.nameEn})`}
          loading={lazy ? 'lazy' : 'eager'}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
            reversed ? 'rotate-180' : ''
          }`}
        />
      ) : (
        <div
          className={`w-full h-full ${accent.faceBg} flex flex-col items-center justify-center p-2 text-center gap-1`}
        >
          <SuitIcon className={`w-6 h-6 ${accent.accentText} ${reversed ? 'rotate-180' : ''}`} />
          <span className="text-[11px] font-bold font-serif-healing leading-tight">
            {card.nameVi}
          </span>
        </div>
      )}
    </div>
  );
};

interface FlippableTarotCardProps {
  card: TarotCardDef;
  reversed?: boolean;
  flipped: boolean;
  onToggleFlip?: () => void;
  size?: 'sm' | 'md';
  glowOnReveal?: boolean;
}

const FlippableTarotCard: React.FC<FlippableTarotCardProps> = ({
  card,
  reversed = false,
  flipped,
  onToggleFlip,
  size = 'md',
  glowOnReveal = true,
}) => {
  const isSmall = size === 'sm';
  return (
    <div
      className={`relative tarot-perspective select-none ${
        isSmall ? 'w-11 shrink-0' : 'w-40 shrink-0'
      }`}
    >
      {glowOnReveal && flipped && !isSmall && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(216,190,130,0.48)_0%,rgba(216,190,130,0.16)_52%,transparent_75%)] blur-md tarot-aura-breathe"
        />
      )}

      <button
        type="button"
        onClick={onToggleFlip}
        disabled={!onToggleFlip}
        aria-label={
          onToggleFlip
            ? flipped
              ? `Úp lại lá ${card.nameVi}`
              : `Lật mở lá ${card.nameVi}`
            : card.nameVi
        }
        title={onToggleFlip ? 'Chạm để lật / úp lá bài' : undefined}
        className={`relative w-full aspect-[5/8.5] tarot-card-3d block text-left focus-visible:outline-2 focus-visible:outline-[#d8be82] focus-visible:outline-offset-2 rounded-xl ${
          flipped ? 'is-flipped' : ''
        } ${onToggleFlip ? 'cursor-pointer group' : 'cursor-default'}`}
      >
        {/* Back Face */}
        <div
          className={`tarot-card-face absolute inset-0 overflow-hidden bg-[#1e2c20] ${
            isSmall
              ? 'rounded-md border border-[#c8b27d]/80 shadow-sm'
              : 'rounded-xl border-2 border-[#c8b27d]/85 shadow-lg group-hover:border-[#ebd396]'
          }`}
        >
          <img
            src={tarotCardBackImg}
            alt={`Mặt sau lá ${card.nameVi}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Front Face (180deg rotated in 3D space) */}
        <div className="tarot-card-face tarot-card-face-front absolute inset-0 overflow-hidden rounded-xl">
          <TarotCardArtwork
            card={card}
            reversed={reversed}
            className={
              isSmall
                ? 'w-full h-full rounded-md border border-[#d8be82]/85 shadow-sm'
                : 'w-full h-full shadow-xl border-2 border-[#d8be82]'
            }
          />
          {flipped && !isSmall && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
            >
              <div
                className="w-2/3 h-full tarot-light-sweep"
                style={{
                  background:
                    'linear-gradient(110deg, transparent 0%, rgba(255,248,220,0.45) 45%, rgba(216,190,130,0.22) 65%, transparent 100%)',
                }}
              />
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

export const TarotHostWorkspace: React.FC<TarotHostWorkspaceProps> = ({
  onRequestAdvisorBooking,
  onOpenAdvisorChairs,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<TarotWorkspaceMode>('reading');

  // --- Reading Mode State ---
  const [tarotTopic, setTarotTopic] = useState<TarotTopic>('healing');
  const [selectedMoodId, setSelectedMoodId] = useState<string>('');
  const [userQuestion, setUserQuestion] = useState('');
  const [spreadId, setSpreadId] = useState<TarotSpreadId>('timeline');
  const [useFullDeck, setUseFullDeck] = useState(true);
  const [allowReversed, setAllowReversed] = useState(true);

  const activeDeck = useMemo(
    () => (useFullDeck ? FULL_TAROT_DECK : MAJOR_ARCANA),
    [useFullDeck]
  );
  const activeSpread = useMemo(
    () => TAROT_SPREADS.find((s) => s.id === spreadId) || TAROT_SPREADS[1],
    [spreadId]
  );

  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(FULL_TAROT_DECK.length));
  const [drawnCards, setDrawnCards] = useState<DrawnTarotCard[]>([]);
  const [revealedCardIds, setRevealedCardIds] = useState<Record<string, boolean>>({});
  const [isShuffling, setIsShuffling] = useState(false);
  const [copiedReading, setCopiedReading] = useState(false);
  const flipTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers: number[] = [];
    const pending = drawnCards.filter((d) => !revealedCardIds[d.card.id]);
    pending.forEach((item, idx) => {
      const t = window.setTimeout(() => {
        setRevealedCardIds((prev) => ({ ...prev, [item.card.id]: true }));
      }, 120 + idx * 180);
      timers.push(t);
    });
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [drawnCards]);

  useEffect(() => {
    return () => {
      flipTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // --- Learn & Encyclopedia Mode State ---
  const [activeLessonId, setActiveLessonId] = useState<string>(TAROT_LESSONS[0].id);
  const [suitFilter, setSuitFilter] = useState<SuitFilter>('all');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [studyCard, setStudyCard] = useState<TarotCardDef | null>(null);
  const [studyReversed, setStudyReversed] = useState(false);

  const activeLesson = useMemo(
    () => TAROT_LESSONS.find((l) => l.id === activeLessonId) || TAROT_LESSONS[0],
    [activeLessonId]
  );

  const filteredLibraryCards = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    return FULL_TAROT_DECK.filter((card) => {
      if (suitFilter !== 'all' && card.suit !== suitFilter) return false;
      if (!q) return true;
      return (
        card.nameVi.toLowerCase().includes(q) ||
        card.nameEn.toLowerCase().includes(q) ||
        card.code.toLowerCase().includes(q) ||
        card.archetype.toLowerCase().includes(q) ||
        card.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [suitFilter, libraryQuery]);

  const handleSelectMood = (moodId: string) => {
    const mood = TAROT_EMPATHY_MOODS.find((m) => m.id === moodId);
    if (!mood) return;
    setSelectedMoodId(mood.id);
    setTarotTopic(mood.topic);
    setUserQuestion(mood.sampleQuestion);
  };

  const handleResetSpread = (
    nextSpreadId: TarotSpreadId = spreadId,
    nextFullDeck: boolean = useFullDeck
  ) => {
    const targetDeckLen = nextFullDeck ? FULL_TAROT_DECK.length : MAJOR_ARCANA.length;
    setSpreadId(nextSpreadId);
    setUseFullDeck(nextFullDeck);
    setDrawnCards([]);
    setRevealedCardIds({});
    setDeckOrder(shuffleIndices(targetDeckLen));
    setCopiedReading(false);
    setIsShuffling(true);
    const t = window.setTimeout(() => setIsShuffling(false), 580);
    flipTimersRef.current.push(t);
  };

  const handlePickCard = (deckIdx: number) => {
    if (drawnCards.length >= activeSpread.cardCount) return;
    const picked = activeDeck[deckIdx];
    if (!picked) return;
    if (drawnCards.some((d) => d.card.id === picked.id)) return;
    const reversed = allowReversed ? Math.random() < 0.28 : false;
    setDrawnCards((prev) => [
      ...prev,
      {
        card: picked,
        reversed,
        positionIndex: prev.length,
      },
    ]);
  };

  const handleAutoDrawRemaining = () => {
    const remainingCount = activeSpread.cardCount - drawnCards.length;
    if (remainingCount <= 0) return;

    const alreadyIds = new Set(drawnCards.map((d) => d.card.id));
    const availableSlots = deckOrder.filter((idx) => {
      const card = activeDeck[idx];
      return card && !alreadyIds.has(card.id);
    });
    if (availableSlots.length === 0) return;

    const nextItems: DrawnTarotCard[] = [];
    const chosenIndices = new Set<number>();
    while (nextItems.length < remainingCount && chosenIndices.size < availableSlots.length) {
      const randSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      if (chosenIndices.has(randSlot)) continue;
      chosenIndices.add(randSlot);
      const card = activeDeck[randSlot];
      nextItems.push({
        card,
        reversed: allowReversed ? Math.random() < 0.28 : false,
        positionIndex: drawnCards.length + nextItems.length,
      });
    }
    setDrawnCards((prev) => [...prev, ...nextItems]);
  };

  const isReadingComplete = drawnCards.length === activeSpread.cardCount;

  const hostSynthesis = useMemo(() => {
    if (!isReadingComplete) return null;
    return buildTarotHostReading(
      drawnCards,
      activeSpread,
      tarotTopic,
      userQuestion,
      selectedMoodId
    );
  }, [isReadingComplete, drawnCards, activeSpread, tarotTopic, userQuestion, selectedMoodId]);

  const handleCopyReading = async () => {
    if (!hostSynthesis) return;
    const lines = [
      `HEALI HOST TAROT · ${activeSpread.name.toUpperCase()}`,
      userQuestion.trim() ? `Câu hỏi: ${userQuestion.trim()}` : '',
      '',
      `LỜI ĐỒNG CẢM TỪ HOST: ${hostSynthesis.empathyMessage}`,
      '',
      ...drawnCards.map((d, idx) => {
        const pos = activeSpread.positions[idx];
        return `${idx + 1}. ${pos?.title}: ${d.card.nameVi} (${d.card.nameEn}) — ${
          d.reversed ? 'Ngược chiều' : 'Xuôi chiều'
        }\n   Ý nghĩa: ${d.reversed ? d.card.reversed : d.card.upright}\n   Tình cảm: ${
          d.card.loveMeaning
        }\n   Công việc: ${d.card.workMeaning}\n   Soi chiếu nội tâm: ${d.card.healingMeaning}`;
      }),
      '',
      `TỔNG KẾT ĐA KHÍA CẠNH (THAM KHẢO SUY NGẪM):\n- Tình cảm: ${hostSynthesis.aspectReadings.love}\n- Công việc: ${hostSynthesis.aspectReadings.work}\n- Soi chiếu nội tâm: ${hostSynthesis.aspectReadings.healing}\n- Sức khỏe & Nhịp sống: ${hostSynthesis.aspectReadings.health}`,
      '',
      `GỢI Ý THỰC HÀNH NHẸ NHÀNG:\n${hostSynthesis.actionSteps.map((s) => `- ${s}`).join('\n')}`,
      `Câu hỏi tự vấn: ${hostSynthesis.journalPrompt}`,
      `Lời nhắn bình an: "${hostSynthesis.closingAffirmation}"`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedReading(true);
      window.setTimeout(() => setCopiedReading(false), 3000);
    } catch {
      // ignore clipboard denial
    }
  };

  const handleBridgeToAdvisor = () => {
    const cardsList = drawnCards
      .map((d) => `${d.card.nameVi} (${d.reversed ? 'Ngược' : 'Xuôi'})`)
      .join(', ');
    const prefillTopic =
      userQuestion.trim() ||
      `Soi chiếu qua Tarot (${TOPIC_OPTIONS.find((t) => t.id === tarotTopic)?.label || 'Soi chiếu nội tâm'})`;
    const prefillNote = `Trải bài vừa rút (${activeSpread.name}): ${cardsList}. Nhờ cố vấn gợi mở thêm góc nhìn nhẹ nhàng giúp mình.`;

    if (onRequestAdvisorBooking) {
      onRequestAdvisorBooking({ topic: prefillTopic, note: prefillNote });
    } else if (onOpenAdvisorChairs) {
      onOpenAdvisorChairs();
    }
  };

  const navigateStudyCard = (dir: -1 | 1) => {
    if (!studyCard) return;
    const list = filteredLibraryCards.length > 0 ? filteredLibraryCards : FULL_TAROT_DECK;
    const idx = list.findIndex((c) => c.id === studyCard.id);
    if (idx === -1) return;
    const nextIdx = (idx + dir + list.length) % list.length;
    setStudyCard(list[nextIdx]);
  };

  const currentStep = isReadingComplete ? 3 : drawnCards.length > 0 ? 2 : 1;

  return (
    <div className="space-y-6">
      {/* Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e2d5]">
        <div className="flex items-center gap-1.5 bg-[#f1efe5] p-1 rounded-xl border border-[#dcd9cc] self-start">
          <button
            type="button"
            onClick={() => setWorkspaceMode('reading')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
              workspaceMode === 'reading'
                ? 'bg-[#273829] text-white shadow-sm'
                : 'text-[#4b604d] hover:text-[#273829]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Trải bài cùng Host (78 lá)</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('learn')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
              workspaceMode === 'learn'
                ? 'bg-[#273829] text-white shadow-sm'
                : 'text-[#4b604d] hover:text-[#273829]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Học xem Tarot & Tra cứu 78 lá</span>
          </button>
        </div>

        <div className="text-xs text-[#546956] flex items-center gap-2 tabular-nums">
          <span>22 Ẩn Chính</span>
          <span aria-hidden="true">·</span>
          <span>56 Ẩn Phụ</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-[#273829]">Đủ bộ ảnh cổ điển</span>
        </div>
      </div>

      {/* MODE 1: INTERACTIVE TAROT HOST READING */}
      {workspaceMode === 'reading' && (
        <div className="space-y-6">
          {/* Guided 3-Step Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {[
              { step: 1, title: '01. Chia sẻ tâm tư', desc: 'Chọn cảm xúc & đặt câu hỏi' },
              { step: 2, title: '02. Chọn trải bài & Rút lá', desc: 'Chạm trực giác trên 78 lá bài' },
              { step: 3, title: '03. Luận giải đa khía cạnh', desc: 'Nhận lời khuyên từ Host Tarot' },
            ].map((item) => {
              const active = currentStep === item.step;
              const done = currentStep > item.step;
              return (
                <div
                  key={item.step}
                  className={`px-4 py-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-[#e6efe2] border-[#9bb892] text-[#223920]'
                      : done
                      ? 'bg-[#f1efe5] border-[#cfd5c4] text-[#355432]'
                      : 'bg-[#faf7ef] border-[#e2dfd3] text-[#6a7c6b]'
                  }`}
                >
                  <div>
                    <div className="font-bold">{item.title}</div>
                    <div className="text-[11px] opacity-85 mt-0.5">{item.desc}</div>
                  </div>
                  {done && <Check className="w-4 h-4 text-[#3b6a37] shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Step 1 & Step 2 Panel */}
          <div className="rounded-3xl bg-[#f1efe5] border border-[#dcd9cc] p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Empathy Moods + Topic + Question */}
              <div className="lg:col-span-6 space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#243627]">
                    Hôm nay lòng bạn đang mang điều gì? (Chạm để Host thấu hiểu ngay)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TAROT_EMPATHY_MOODS.map((mood) => {
                      const active = selectedMoodId === mood.id;
                      return (
                        <button
                          key={mood.id}
                          type="button"
                          onClick={() => handleSelectMood(mood.id)}
                          className={`px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition ${
                            active
                              ? 'bg-[#273829] text-[#faf7ef] border-[#273829]'
                              : 'bg-[#faf7ef] text-[#334835] border-[#dcdad0] hover:border-[#9eb198]'
                          }`}
                        >
                          {mood.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#243627]">Chủ đề trọng tâm</div>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_OPTIONS.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setTarotTopic(topic.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap shrink-0 ${
                          tarotTopic === topic.id
                            ? 'bg-[#46613e] text-white'
                            : 'bg-[#faf7ef] text-[#4b604d] border border-[#dcdad0] hover:border-[#9eb198]'
                        }`}
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#243627]">
                    Câu hỏi hoặc tâm sự riêng gửi tới Host Tarot
                  </label>
                  <textarea
                    rows={2}
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Ví dụ: Mình đang phân vân không biết nên tiếp tục chờ đợi mối quan hệ này hay buông nhẹ để bình yên..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ef] border border-[#d6d3c6] text-xs sm:text-sm text-[#273829] placeholder:text-[#8b988b] focus:outline-none focus:border-[#46613e]"
                  />
                </div>
              </div>

              {/* Right: Spread Selector + Deck Config */}
              <div className="lg:col-span-6 space-y-4">
                <div className="text-xs font-bold text-[#243627]">
                  Chọn kiểu trải bài phù hợp độ sâu bạn cần
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TAROT_SPREADS.map((sp) => {
                    const active = sp.id === spreadId;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => handleResetSpread(sp.id, useFullDeck)}
                        className={`p-3.5 rounded-2xl border text-left transition ${
                          active
                            ? 'bg-[#273829] text-[#faf7ef] border-[#273829]'
                            : 'bg-[#faf7ef] text-[#273829] border-[#dcdad0] hover:border-[#9eb198]'
                        }`}
                      >
                        <div className="text-xs font-bold leading-snug">{sp.name}</div>
                        <div
                          className={`text-[11px] mt-1 leading-relaxed ${
                            active ? 'text-[#cfd9cd]' : 'text-[#576c59]'
                          }`}
                        >
                          {sp.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetSpread(spreadId, !useFullDeck)}
                      className="px-3 py-1.5 rounded-xl bg-[#faf7ef] border border-[#d6d3c6] text-xs font-medium text-[#273829] hover:bg-white transition whitespace-nowrap shrink-0"
                    >
                      {useFullDeck ? 'Bộ bài: Đủ 78 lá' : 'Bộ bài: 22 Ẩn Chính'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllowReversed((prev) => !prev)}
                      className="px-3 py-1.5 rounded-xl bg-[#faf7ef] border border-[#d6d3c6] text-xs font-medium text-[#273829] hover:bg-white transition whitespace-nowrap shrink-0"
                    >
                      {allowReversed ? 'Chiều bài: Xuôi & Ngược' : 'Chiều bài: Chỉ Xuôi'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetSpread(spreadId, useFullDeck)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf7ef] hover:bg-white border border-[#cfd7c7] text-xs font-medium text-[#3c5438] whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Xáo lại bài</span>
                    </button>
                    {!isReadingComplete && (
                      <button
                        type="button"
                        onClick={handleAutoDrawRemaining}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition whitespace-nowrap shrink-0"
                      >
                        <Hand className="w-3.5 h-3.5" />
                        <span>Host rút giúp</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Botanical Velvet Table Cloth for 78-card Picking */}
            <div className="rounded-3xl bg-[#1f2e21] border border-[#3c523f] p-4 sm:p-5 space-y-4 text-[#f5efe0]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#dde5d9] font-serif-healing italic">
                  {isReadingComplete
                    ? `Đã mở đủ ${activeSpread.cardCount} lá bài cho trải bài "${activeSpread.name}". Mời bạn đọc bản luận giải chi tiết bên dưới.`
                    : `Hít một hơi thật sâu, giữ câu hỏi trong tâm trí rồi chạm chọn lá thứ ${
                        drawnCards.length + 1
                      }/${activeSpread.cardCount} (${
                        activeSpread.positions[drawnCards.length]?.title || ''
                      }) trên bàn bài ${activeDeck.length} lá:`}
                </p>
                <span className="text-xs font-semibold text-[#d8be82] tabular-nums">
                  {drawnCards.length} / {activeSpread.cardCount} lá đã chọn
                </span>
              </div>

              {/* Spread Position Slots */}
              <div
                className={`grid gap-2.5 ${
                  activeSpread.cardCount === 1
                    ? 'grid-cols-1 max-w-sm'
                    : activeSpread.cardCount === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                }`}
              >
                {activeSpread.positions.map((pos, idx) => {
                  const drawn = drawnCards[idx];
                  const isSlotFlipped = drawn ? Boolean(revealedCardIds[drawn.card.id]) : false;
                  return (
                    <div
                      key={pos.title}
                      className={`p-2.5 rounded-xl border text-xs transition-all duration-300 flex items-center gap-2.5 ${
                        drawn
                          ? 'bg-[#314834] border-[#d8be82]/75 text-[#faf7ef] shadow-[0_0_18px_-6px_rgba(216,190,130,0.45)] tarot-slot-enter'
                          : idx === drawnCards.length
                          ? 'bg-[#293d2c] border-[#d8be82] text-[#f5e7c1]'
                          : 'bg-[#19251b] border-[#334736] text-[#9cb09e]'
                      }`}
                    >
                      {drawn && (
                        <FlippableTarotCard
                          card={drawn.card}
                          reversed={drawn.reversed}
                          flipped={isSlotFlipped}
                          size="sm"
                          glowOnReveal={false}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[11px] truncate">{pos.title}</div>
                        <div className="text-[11px] mt-0.5 truncate opacity-90">
                          {drawn
                            ? `${drawn.card.nameVi} (${drawn.reversed ? 'Ngược' : 'Xuôi'})`
                            : pos.prompt}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Interactive Face-Down Deck Grid */}
              <div
                className={`grid gap-1.5 pt-1 ${
                  useFullDeck
                    ? 'grid-cols-6 sm:grid-cols-10 md:grid-cols-[repeat(13,minmax(0,1fr))]'
                    : 'grid-cols-6 sm:grid-cols-11'
                }`}
              >
                {deckOrder.map((deckIdx, visualIdx) => {
                  const cardObj = activeDeck[deckIdx];
                  if (!cardObj) return null;
                  const alreadyPicked = drawnCards.some((d) => d.card.id === cardObj.id);
                  const disabled = alreadyPicked || isReadingComplete;
                  return (
                    <button
                      key={cardObj.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handlePickCard(deckIdx)}
                      style={
                        isShuffling
                          ? { animationDelay: `${(visualIdx % 13) * 28}ms` }
                          : undefined
                      }
                      className={`relative aspect-[2/3] rounded-lg border overflow-hidden transition-all duration-200 select-none ${
                        isShuffling ? 'tarot-shuffle-ripple' : ''
                      } ${
                        alreadyPicked
                          ? 'border-[#d8be82] opacity-15 scale-90'
                          : disabled
                          ? 'border-[#3e5441] opacity-40 cursor-not-allowed'
                          : 'border-[#c8b27d]/80 hover:-translate-y-2 hover:shadow-[0_10px_22px_-6px_rgba(216,190,130,0.5)] hover:border-[#f0dba3] cursor-pointer'
                      }`}
                      title={`Lá úp #${visualIdx + 1}`}
                    >
                      <img
                        src={tarotCardBackImg}
                        alt={`Mặt sau lá bài #${visualIdx + 1}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {!alreadyPicked && (
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-[#141f16]/80 text-[8px] font-mono text-[#e9d8a6] tabular-nums">
                          {visualIdx + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drawn Cards Multi-Aspect Breakdown */}
          {drawnCards.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-[#243627] font-serif-healing">
                    Luận giải chi tiết từng lá theo đủ khía cạnh
                  </h3>
                  <p className="text-xs text-[#546956]">
                    Mỗi lá bài phản chiếu đồng thời Tình cảm, Công việc, Chữa lành nội tâm và Nhịp sống cơ thể.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('learn')}
                  className="text-xs font-semibold text-[#46613e] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Học cách tự đọc bài</span>
                </button>
              </div>

              <div
                className={`grid gap-5 ${
                  activeSpread.cardCount === 1
                    ? 'grid-cols-1 max-w-2xl mx-auto'
                    : activeSpread.cardCount === 3
                    ? 'grid-cols-1 lg:grid-cols-3'
                    : 'grid-cols-1 lg:grid-cols-2'
                }`}
              >
                {drawnCards.map((item, idx) => {
                  const pos = activeSpread.positions[idx];
                  const accent = getSuitAccent(item.card.suit);
                  const healthInsight = getHealthAndPaceMeaning(item.card, item.reversed);
                  const isFlipped = Boolean(revealedCardIds[item.card.id]);

                  return (
                    <div
                      key={item.card.id}
                      className="rounded-3xl bg-[#f1efe5] border border-[#cfd5c4] hover:border-[#c8b27d] hover:shadow-[0_12px_30px_-14px_rgba(182,150,84,0.45)] transition-all duration-300 p-5 space-y-4 shadow-sm flex flex-col justify-between tarot-result-emerge"
                    >
                      <div className="space-y-4">
                        {/* Header metadata */}
                        <div className="flex items-center justify-between gap-2 text-xs pb-2 border-b border-[#e0ddd0]">
                          <span className="font-bold text-[#243627]">{pos?.title}</span>
                          <span
                            className={`font-semibold ${
                              item.reversed ? 'text-[#9b4b38]' : 'text-[#355432]'
                            }`}
                          >
                            {item.reversed ? 'Ngược chiều (180°)' : 'Xuôi chiều'}
                          </span>
                        </div>

                        {/* 3D Flippable Card Art + Core Description */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 pt-1">
                          <div className="flex flex-col items-center gap-1.5">
                            <FlippableTarotCard
                              card={item.card}
                              reversed={item.reversed}
                              flipped={isFlipped}
                              onToggleFlip={() =>
                                setRevealedCardIds((prev) => ({
                                  ...prev,
                                  [item.card.id]: !prev[item.card.id],
                                }))
                              }
                            />
                            <span className="text-[10px] text-[#6d7d69]">
                              Chạm vào lá bài để úp / lật lại
                            </span>
                          </div>
                          <div className="text-center space-y-1">
                            <div className="text-[11px] text-[#546956] flex items-center justify-center gap-1.5">
                              <span>{accent.label}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{item.card.code}</span>
                            </div>
                            <h4 className="text-lg font-bold text-[#243627] font-serif-healing leading-snug">
                              {item.card.nameVi}
                            </h4>
                            <div className="text-xs text-[#5e7260]">
                              {item.card.nameEn} · <span className="italic">“{item.card.archetype}”</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[#2d3f2f] leading-relaxed font-serif-healing bg-[#faf7ef] p-3.5 rounded-2xl border border-[#e3e0d4]">
                          {item.reversed ? item.card.reversed : item.card.upright}
                        </p>

                        {/* 4 Detailed Aspects on Each Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-[#faf7ef] border border-[#e3e0d4] space-y-1">
                            <div className="font-bold text-[#243627] flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5 text-[#9a4f46]" />
                              <span>Tình cảm</span>
                            </div>
                            <p className="text-[#455a47] leading-relaxed">{item.card.loveMeaning}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-[#faf7ef] border border-[#e3e0d4] space-y-1">
                            <div className="font-bold text-[#243627] flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-[#7a5d2e]" />
                              <span>Công việc & Tài chính</span>
                            </div>
                            <p className="text-[#455a47] leading-relaxed">{item.card.workMeaning}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-[#faf7ef] border border-[#e3e0d4] space-y-1">
                            <div className="font-bold text-[#243627] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#46613e]" />
                              <span>Soi chiếu nội tâm</span>
                            </div>
                            <p className="text-[#455a47] leading-relaxed">{item.card.healingMeaning}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-[#faf7ef] border border-[#e3e0d4] space-y-1">
                            <div className="font-bold text-[#243627] flex items-center gap-1.5">
                              <HeartPulse className="w-3.5 h-3.5 text-[#37635c]" />
                              <span>Sức khỏe &amp; Nhịp sống</span>
                            </div>
                            <p className="text-[#455a47] leading-relaxed">{healthInsight}</p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#eef3ea] border border-[#c7d7c2] text-xs space-y-1">
                          <div className="font-bold text-[#264223] flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Câu hỏi tự vấn cho lá bài này</span>
                          </div>
                          <p className="text-[#2f4b2c] leading-relaxed italic font-serif-healing">
                            {getCardSelfQuestion(item.card, item.reversed)}
                          </p>
                        </div>

                        <div className="text-xs text-[#546956] leading-relaxed">
                          <span className="font-semibold text-[#243627]">Biểu tượng tranh: </span>
                          {item.card.symbolism}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#e0ddd0] space-y-1.5">
                        <div className="text-xs text-[#355432] font-semibold leading-relaxed">
                          Gợi ý nhẹ: {item.card.advice}
                        </div>
                        <div className="text-[11px] text-[#5c725e] flex flex-wrap items-center gap-1.5">
                          {item.card.keywords.map((kw, kIdx) => (
                            <React.Fragment key={kw}>
                              {kIdx > 0 && <span aria-hidden="true">·</span>}
                              <span>{kw}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HOST TAROT FULL EMPATHETIC MULTI-ASPECT CONSULTATION REPORT */}
          {hostSynthesis && (
            <div className="relative overflow-hidden rounded-3xl bg-[#273829] text-[#f5efe0] p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_-18px_rgba(39,56,41,0.55)] border border-[#46613e] tarot-result-emerge">
              {/* Subtle Candlelit Ambient Radial Glow & Light Sweep */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(216,190,130,0.22)_0%,rgba(216,190,130,0.06)_48%,transparent_72%)] blur-2xl tarot-aura-breathe"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 tarot-light-sweep"
                style={{
                  background:
                    'linear-gradient(110deg, transparent 0%, rgba(235,211,150,0.1) 48%, rgba(255,248,220,0.14) 52%, transparent 100%)',
                }}
              />

              {/* Report Header */}
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3d5440]">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[#d8be82] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Bản Luận Giải Toàn Diện Từ Host Tarot</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif-healing text-white">
                    {hostSynthesis.openingWhisper}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleCopyReading()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#364d39] hover:bg-[#435e46] text-[#f5efe0] text-xs font-semibold transition whitespace-nowrap shrink-0"
                  >
                    {copiedReading ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#a8e0a1]" />
                        <span>Đã chép bản luận giải</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chép toàn bộ quẻ</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetSpread(spreadId, useFullDeck)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d8be82] hover:bg-[#e5cd95] text-[#1f2e21] text-xs font-bold transition whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Trải quẻ mới</span>
                  </button>
                </div>
              </div>

              {/* Empathetic Resonance Opening */}
              <div className="rounded-2xl bg-[#314634] border border-[#4a664d] p-4 sm:p-5 space-y-1.5">
                <div className="text-xs font-bold text-[#d8be82]">
                  Lời thấu cảm đầu tiên dành cho bạn
                </div>
                <p className="text-sm text-[#f7f4eb] font-serif-healing leading-relaxed">
                  {hostSynthesis.empathyMessage}
                </p>
              </div>

              {/* Energy Structure + Connected Story */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 rounded-2xl bg-[#1f2e21] border border-[#3a503d] p-4 space-y-3">
                  <div className="text-xs font-bold text-[#d8be82]">
                    Cấu trúc năng lượng & Nguyên tố
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#d6e0d2] tabular-nums">
                    <span>Ẩn Chính: {hostSynthesis.majorCount}/{drawnCards.length}</span>
                    <span aria-hidden="true">·</span>
                    <span>Lửa: {hostSynthesis.elementCounts['Lửa']}</span>
                    <span aria-hidden="true">·</span>
                    <span>Nước: {hostSynthesis.elementCounts['Nước']}</span>
                    <span aria-hidden="true">·</span>
                    <span>Khí: {hostSynthesis.elementCounts['Khí']}</span>
                    <span aria-hidden="true">·</span>
                    <span>Đất: {hostSynthesis.elementCounts['Đất']}</span>
                  </div>
                  <p className="text-xs text-[#c7d3c4] leading-relaxed">
                    {hostSynthesis.elementInsight}
                  </p>
                  <p className="text-xs text-[#c7d3c4] leading-relaxed pt-2 border-t border-[#324635]">
                    {hostSynthesis.orientationNote}
                  </p>
                </div>

                <div className="lg:col-span-7 rounded-2xl bg-[#1f2e21] border border-[#3a503d] p-4 space-y-3">
                  <div className="text-xs font-bold text-[#d8be82]">
                    Mạch nối câu chuyện tổng quẻ
                  </div>
                  <p className="text-xs sm:text-sm text-[#eef2e6] leading-relaxed font-serif-healing">
                    {hostSynthesis.narrative}
                  </p>
                </div>
              </div>

              {/* 4 Life Aspects Deep Synthesis */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#d8be82]">
                  Tổng hợp luận giải theo 4 khía cạnh đời sống
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-2xl bg-[#1f2e21] border border-[#3a503d] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#f2c6be] flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Tình cảm & Kết nối</span>
                    </div>
                    <p className="text-xs text-[#dce4d9] leading-relaxed">
                      {hostSynthesis.aspectReadings.love}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#1f2e21] border border-[#3a503d] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#ecd298] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Công việc & Tài chính</span>
                    </div>
                    <p className="text-xs text-[#dce4d9] leading-relaxed">
                      {hostSynthesis.aspectReadings.work}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#1f2e21] border border-[#3a503d] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#b8dfaf] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Soi chiếu nội tâm</span>
                    </div>
                    <p className="text-xs text-[#dce4d9] leading-relaxed">
                      {hostSynthesis.aspectReadings.healing}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#1f2e21] border border-[#3a503d] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#a8dce3] flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>Sức khỏe, Giấc ngủ & Nhịp sống</span>
                    </div>
                    <p className="text-xs text-[#dce4d9] leading-relaxed">
                      {hostSynthesis.aspectReadings.health}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bright Spot & Gentle Caution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="rounded-2xl bg-[#2f4532] border border-[#4a694e] p-4 space-y-1.5">
                  <div className="text-xs font-bold text-[#bce8b3] flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Điểm sáng đang nâng đỡ bạn</span>
                  </div>
                  <p className="text-xs text-[#edf3e9] leading-relaxed">{hostSynthesis.brightSpot}</p>
                </div>
                <div className="rounded-2xl bg-[#343629] border border-[#5b563c] p-4 space-y-1.5">
                  <div className="text-xs font-bold text-[#ebd396] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Điều cần nhẹ nhàng lưu ý</span>
                  </div>
                  <p className="text-xs text-[#f0ede2] leading-relaxed">
                    {hostSynthesis.gentleCaution}
                  </p>
                </div>
              </div>

              {/* 7-Day Action Steps + Journal Prompt */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 rounded-2xl bg-[#314634] border border-[#445e47] p-4 space-y-2.5">
                  <div className="text-xs font-bold text-[#d8be82]">
                    Lộ trình 3 bước lời khuyên thực tế
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#f3f5ec]">
                    {hostSynthesis.actionSteps.map((step) => (
                      <li key={step} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-5 rounded-2xl bg-[#314634] border border-[#445e47] p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#d8be82]">
                      Câu hỏi tự vấn cùng Host
                    </div>
                    <p className="text-xs sm:text-sm text-[#eef2e6] italic font-serif-healing leading-relaxed">
                      {hostSynthesis.journalPrompt}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#445e47]">
                    <div className="text-[11px] text-[#c7d3c4]">Lời khẳng định giữ bình yên:</div>
                    <div className="text-xs sm:text-sm font-semibold text-[#f5e7c1] mt-1 font-serif-healing">
                      “{hostSynthesis.closingAffirmation}”
                    </div>
                  </div>
                </div>
              </div>

              {/* Value-First Bridge to Paid 1:1 Advisor Seat */}
              {(onRequestAdvisorBooking || onOpenAdvisorChairs) && (
                <div className="rounded-2xl bg-[#faf7ef] text-[#243627] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#d8be82]">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#46613e] flex items-center gap-1.5">
                      <Armchair className="w-4 h-4" />
                      <span>Muốn hỏi sâu 1:1 về câu chuyện riêng của bạn?</span>
                    </div>
                    <p className="text-xs text-[#455a47] leading-relaxed max-w-2xl">
                      {hostSynthesis.advisorInvite}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBridgeToAdvisor}
                    className="px-4 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-bold transition whitespace-nowrap shrink-0 self-start md:self-center"
                  >
                    Đặt ghế Cố vấn 1:1 với quẻ này
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: LEARN HOW TO READ TAROT & FULL 78-CARD LIBRARY */}
      {workspaceMode === 'learn' && (
        <div className="space-y-8">
          {/* Part A: Host Curriculum (4 Interactive Lessons) */}
          <div className="rounded-3xl bg-[#f1efe5] border border-[#dcd9cc] p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#243627] font-serif-healing">
                Cẩm nang Học xem Tarot — Tư duy như một Host thực thụ
              </h3>
              <p className="text-xs sm:text-sm text-[#546956] mt-1">
                Nắm vững 4 nguyên tắc nền tảng dưới đây để tự tin đọc bài, kết nối câu chuyện và đưa lời khuyên sâu sắc mà không cần học vẹt máy móc.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-4 space-y-2">
                {TAROT_LESSONS.map((lesson) => {
                  const active = lesson.id === activeLesson.id;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition ${
                        active
                          ? 'bg-[#273829] text-[#faf7ef] border-[#273829]'
                          : 'bg-[#faf7ef] text-[#273829] border-[#dcdad0] hover:border-[#9eb198]'
                      }`}
                    >
                      <div
                        className={`text-[11px] font-mono tabular-nums ${
                          active ? 'text-[#d8be82]' : 'text-[#5b715d]'
                        }`}
                      >
                        Bài {lesson.step}
                      </div>
                      <div className="text-xs sm:text-sm font-bold mt-0.5 leading-snug">
                        {lesson.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-8 rounded-2xl bg-[#faf7ef] border border-[#dcd9cc] p-5 space-y-4">
                <div className="space-y-1.5 pb-3 border-b border-[#e5e2d5]">
                  <div className="text-xs font-mono text-[#46613e] tabular-nums">
                    Bài học {activeLesson.step}
                  </div>
                  <h4 className="text-lg font-bold text-[#243627] font-serif-healing">
                    {activeLesson.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#455a47] leading-relaxed">
                    {activeLesson.summary}
                  </p>
                </div>

                <div className="space-y-3">
                  {activeLesson.bullets.map((b) => (
                    <div
                      key={b.heading}
                      className="p-3.5 rounded-xl bg-[#f4f2ea] border border-[#e3e0d3] space-y-1"
                    >
                      <div className="text-xs sm:text-sm font-bold text-[#243627]">{b.heading}</div>
                      <p className="text-xs text-[#4b604d] leading-relaxed">{b.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[#e6efe2] border border-[#bfd2b8] text-xs text-[#264223] leading-relaxed">
                  <span className="font-bold">Bí quyết Host Tarot: </span>
                  {activeLesson.hostTip}
                </div>
              </div>
            </div>
          </div>

          {/* Part B: Complete 78-Card Encyclopedia */}
          <div className="rounded-3xl bg-[#f1efe5] border border-[#dcd9cc] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#243627] font-serif-healing">
                  Thư viện trọn bộ 78 lá bài Tarot
                </h3>
                <p className="text-xs text-[#546956] mt-0.5">
                  Chạm vào từng lá bài để quan sát tranh gốc, học biểu tượng, ý nghĩa Xuôi/Ngược và cách luận đủ các khía cạnh.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-[#5e7260] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Tìm tên lá (VD: The Star, 5 Cốc...)"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#faf7ef] border border-[#d6d3c6] text-xs text-[#273829] placeholder:text-[#8b988b] focus:outline-none focus:border-[#46613e]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as const, label: 'Tất cả (78)' },
                { id: 'major' as const, label: 'Ẩn Chính (22)' },
                { id: 'wands' as const, label: 'Bộ Gậy · Lửa (14)' },
                { id: 'cups' as const, label: 'Bộ Cốc · Nước (14)' },
                { id: 'swords' as const, label: 'Bộ Kiếm · Khí (14)' },
                { id: 'pentacles' as const, label: 'Bộ Tiền · Đất (14)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSuitFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    suitFilter === f.id
                      ? 'bg-[#46613e] text-white'
                      : 'bg-[#faf7ef] text-[#4b604d] border border-[#dcdad0] hover:border-[#9eb198]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredLibraryCards.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#faf7ef] border border-[#e0ddd0] text-center text-xs text-[#546956]">
                Không tìm thấy lá bài nào khớp với từ khóa “{libraryQuery}”.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredLibraryCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setStudyCard(card);
                      setStudyReversed(false);
                    }}
                    className="text-left p-3.5 rounded-2xl bg-[#faf7ef] border border-[#dcdad0] hover:border-[#46613e] hover:shadow-sm transition flex items-stretch gap-3.5"
                  >
                    <div className="w-16 shrink-0 self-center">
                      <TarotCardArtwork card={card} lazy />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between gap-1.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] text-[#576c59]">
                          <span className="truncate">{card.suitNameVi} · {card.element}</span>
                          <span className="font-mono tabular-nums font-semibold shrink-0">{card.code}</span>
                        </div>
                        <div className="text-sm font-bold text-[#243627] font-serif-healing truncate">
                          {card.nameVi}
                        </div>
                        <div className="text-[11px] text-[#5e7260] truncate">{card.nameEn}</div>
                        <p className="text-[11px] text-[#455a47] line-clamp-2 leading-relaxed">
                          {card.upright}
                        </p>
                      </div>
                      <div className="text-[11px] font-semibold text-[#46613e]">
                        Xem lá bài & cách luận →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Study Modal */}
      {studyCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] border border-[#dcdad0] shadow-2xl p-6 space-y-5 text-[#273829]">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#e5e2d5]">
              <div>
                <div className="text-xs text-[#546956] flex items-center gap-2">
                  <span>{studyCard.suitNameVi}</span>
                  <span aria-hidden="true">·</span>
                  <span>Nguyên tố {studyCard.element}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{studyCard.code}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-healing text-[#243627] mt-0.5">
                  {studyCard.nameVi} ({studyCard.nameEn})
                </h3>
                <div className="text-xs italic text-[#4e6b4f] mt-0.5">“{studyCard.archetype}”</div>
              </div>
              <button
                type="button"
                onClick={() => setStudyCard(null)}
                className="p-1.5 rounded-lg text-[#5e7260] hover:text-[#273829] hover:bg-[#f1efe5]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-4 flex flex-col items-center gap-3">
                <div className="relative w-48 md:w-full max-w-[220px]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-3 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(216,190,130,0.4)_0%,rgba(216,190,130,0.1)_55%,transparent_78%)] blur-md tarot-aura-breathe"
                  />
                  <TarotCardArtwork
                    card={studyCard}
                    reversed={studyReversed}
                    className="relative shadow-lg border-2 border-[#c8b27d]/85"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStudyReversed((prev) => !prev)}
                  className="w-full max-w-[220px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#273829] hover:bg-[#344b37] text-white text-xs font-semibold transition whitespace-nowrap"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{studyReversed ? 'Chiều Ngược (Bấm lật Xuôi)' : 'Chiều Xuôi (Bấm lật Ngược)'}</span>
                </button>
              </div>

              <div className="md:col-span-8 space-y-3.5 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-[#f1efe5] border border-[#dcd9cc] space-y-1.5">
                  <div className="text-xs font-bold text-[#243627]">
                    {studyReversed ? 'Luận giải khi bài Ngược chiều' : 'Luận giải khi bài Xuôi chiều'}
                  </div>
                  <p className="text-[#2d3f2f] leading-relaxed font-serif-healing">
                    {studyReversed ? studyCard.reversed : studyCard.upright}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf7ef] border border-[#e0ddd0] space-y-1.5">
                  <div className="text-xs font-bold text-[#243627]">
                    Biểu tượng hình ảnh trên lá bài (Nhìn trực tiếp vào tranh)
                  </div>
                  <p className="text-xs text-[#4b604d] leading-relaxed">{studyCard.symbolism}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-[#f4f2ea] border border-[#e2dfd3] space-y-1">
                    <div className="font-bold text-[#243627]">Tình cảm</div>
                    <p className="text-[#4b604d] leading-relaxed">{studyCard.loveMeaning}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f4f2ea] border border-[#e2dfd3] space-y-1">
                    <div className="font-bold text-[#243627]">Công việc & Tài chính</div>
                    <p className="text-[#4b604d] leading-relaxed">{studyCard.workMeaning}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f4f2ea] border border-[#e2dfd3] space-y-1">
                    <div className="font-bold text-[#243627]">Soi chiếu nội tâm</div>
                    <p className="text-[#4b604d] leading-relaxed">{studyCard.healingMeaning}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f4f2ea] border border-[#e2dfd3] space-y-1">
                    <div className="font-bold text-[#243627]">Sức khỏe & Nhịp sống</div>
                    <p className="text-[#4b604d] leading-relaxed">
                      {getHealthAndPaceMeaning(studyCard, studyReversed)}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#e6efe2] dark:bg-[#233226] border border-[#bfd2b8] dark:border-[#39503d] space-y-2 text-xs">
                  <div className="font-bold text-[#254022] dark:text-[#b7d9b0]">
                    Gợi ý thực hành khi lá này xuất hiện
                  </div>
                  <p className="text-[#2f4d2c] dark:text-[#d5e3d1] leading-relaxed">
                    {studyCard.advice}
                  </p>
                  <div className="pt-1.5 border-t border-[#c7d9c1] dark:border-[#3a523e] space-y-1">
                    <div className="font-semibold text-[#2d4a2b] dark:text-[#cde0c9]">
                      Câu hỏi tự vấn gợi mở:
                    </div>
                    <p className="text-[#3e5c3b] dark:text-[#d7e5d4] italic">
                      “{getCardSelfQuestion(studyCard, studyReversed)}”
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e5e2d5]">
              <button
                type="button"
                onClick={() => navigateStudyCard(-1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f1efe5] hover:bg-[#e7e4d7] text-xs font-semibold text-[#273829]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Lá trước</span>
              </button>
              <span className="text-[11px] text-[#5e7260] tabular-nums">
                Lá {studyCard.num + 1} / 78
              </span>
              <button
                type="button"
                onClick={() => navigateStudyCard(1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f1efe5] hover:bg-[#e7e4d7] text-xs font-semibold text-[#273829]"
              >
                <span>Lá tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
