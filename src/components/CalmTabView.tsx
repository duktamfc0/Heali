import React, { useState, useEffect, useRef } from 'react';
import { Wind, Hand, Heart, RefreshCw, Clock, Volume2, Play, Pause, Check } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { api } from '../services/api';
import { SupportPromptCard } from './SupportPromptCard';
import { HealingAudioSection } from './HealingAudioSection';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import { VI_COPY } from '../i18n/vi';

interface CalmTabViewProps {
  initialTool?: 'breathe' | 'grounding' | 'compassion' | 'reframe' | 'audio';
  lowMotion?: boolean;
  embeddedIn3DRoom?: boolean;
  onOpenExUrgeModal: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale';

export const CalmTabView: React.FC<CalmTabViewProps> = ({
  initialTool = 'breathe',
  lowMotion = false,
  embeddedIn3DRoom = false,
  onOpenExUrgeModal,
}) => {
  const [activeTool, setActiveTool] = useState<'breathe' | 'grounding' | 'compassion' | 'reframe' | 'audio'>(initialTool);

  useEffect(() => {
    setActiveTool(initialTool);
  }, [initialTool]);

  // 1. 4-7-8 Breathing (max 3 mins, audio-only option)
  const [breathRunning, setBreathRunning] = useState(false);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [phaseSecs, setPhaseSecs] = useState(4);
  const [totalElapsedSecs, setTotalElapsedSecs] = useState(0);
  const completedTrackedRef = useRef(false);

  useEffect(() => {
    if (!breathRunning) return;
    const timer = window.setInterval(() => {
      setTotalElapsedSecs((t) => {
        if (t >= 180) {
          setBreathRunning(false);
          if (!completedTrackedRef.current) {
            completedTrackedRef.current = true;
            void api.trackHealthyMetric('calm_tool_completed');
          }
          return 180;
        }
        return t + 1;
      });
      setPhaseSecs((prev) => {
        if (prev > 1) return prev - 1;
        setBreathPhase((curr) => {
          if (curr === 'inhale') {
            setPhaseSecs(7);
            return 'hold';
          }
          if (curr === 'hold') {
            setPhaseSecs(8);
            return 'exhale';
          }
          setPhaseSecs(4);
          return 'inhale';
        });
        return 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breathRunning]);

  const toggleBreathWithSound = () => {
    const next = !breathRunning;
    setBreathRunning(next);
    if (next && !soundEngine.getIsPlaying()) {
      soundEngine.applyPreset('rain_lake');
      soundEngine.start();
    }
  };

  // 2. 5-4-3-2-1 Grounding steps
  const groundingSteps = [
    { count: 5, sense: '5 thứ bạn nhìn thấy quanh mình', hint: 'Chạm mắt vào một góc tường, chiếc ly, ánh đèn hoặc khung cửa.' },
    { count: 4, sense: '4 bề mặt bạn chạm vào được lúc này', hint: 'Mặt bàn, vải áo, mặt sàn dưới bàn chân, hơi ấm bàn tay.' },
    { count: 3, sense: '3 âm thanh bạn nghe thấy', hint: 'Tiếng quạt, tiếng xe xa xa, tiếng mưa nhẹ hoặc nhịp thở.' },
    { count: 2, sense: '2 mùi hương bạn nhận ra được', hint: 'Mùi xà phòng, trà ấm, sách cũ hoặc không khí trong phòng.' },
    { count: 1, sense: '1 điều nhỏ dễ chịu ngay tại đây', hint: 'Một ngụm nước mát hoặc chiếc chăn mỏng trên vai.' },
  ];
  const [checkedGrounding, setCheckedGrounding] = useState<Record<number, boolean>>({});

  // 3. 3-Sentence Self-Compassion
  const [compassionKindLine, setCompassionKindLine] = useState('');
  const compassionSamples = [
    'Mình có quyền nghỉ ngơi ngay cả khi mọi thứ chưa ổn.',
    'Hôm nay chỉ cần qua được đoạn này đã là đủ.',
    'Mình không cần tự trách bản thân vì đã cảm thấy đau.',
  ];

  // 4. Gentle Thought Reframe (check risk live, no deletion)
  const [reframeThought, setReframeThought] = useState('');
  const [reframeSupport, setReframeSupport] = useState('');
  const [reframeCounter, setReframeCounter] = useState('');

  const phaseLabels: Record<BreathPhase, { label: string; guide: string }> = {
    inhale: { label: 'Hít vào chậm', guide: 'Đếm nhẹ 4 giây qua mũi' },
    hold: { label: 'Giữ nhẹ', guide: 'Thả lỏng vai trong 7 giây' },
    exhale: { label: 'Thở ra hết', guide: 'Thở êm qua miệng trong 8 giây' },
  };

  return (
    <div className="space-y-5 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {/* Immersive 3D Calm Sanctuary Hero — Synced live to 4-7-8 breathPhase */}
      {embeddedIn3DRoom ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222c24] border border-[#dcdad0] dark:border-[#324236]">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#46613e] dark:text-[#98c18e]">
              {activeTool === 'breathe'
                ? breathRunning
                  ? `${phaseLabels[breathPhase].label} · ${phaseSecs}s`
                  : 'Nhịp thở 4-7-8 cùng quả cầu lưu ly'
                : VI_COPY.calmTools.heading}
            </div>
            <p className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
              {activeTool === 'breathe'
                ? phaseLabels[breathPhase].guide
                : VI_COPY.calmTools.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTool === 'breathe' && (
              <button
                type="button"
                onClick={toggleBreathWithSound}
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition"
              >
                {breathRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{breathRunning ? 'Tạm dừng' : 'Bắt đầu thở'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenExUrgeModal}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#faf7ef] dark:bg-[#19211b] border border-[#cfd5c6] dark:border-[#37473a] text-xs font-semibold text-[#5b412c] dark:text-[#e6c9ad] inline-flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{VI_COPY.exUrge.buttonLabel}</span>
            </button>
          </div>
        </div>
      ) : (
        <SanctuaryScene3D
          variant="calm"
          breathPhase={breathPhase}
          breathRunning={breathRunning}
          lowMotion={lowMotion}
          dimmed={audioOnlyMode && activeTool === 'breathe'}
          allowPureViewToggle
          className="min-h-[250px] sm:min-h-[290px]"
        >
          <div className="p-5 sm:p-7 flex flex-col justify-between min-h-[250px] sm:min-h-[290px] text-[#f4f4ed]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9ce2c6]">
                Góc Dịu Lại · Điều hoà nhịp thở 4-7-8
              </span>
              <button
                type="button"
                onClick={onOpenExUrgeModal}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#16231b]/85 hover:bg-[#1f3327] border border-[#567460]/60 text-xs sm:text-sm font-semibold text-[#f3ead6] inline-flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <Clock className="w-4 h-4 text-[#f4cb77]" />
                <span>{VI_COPY.exUrge.buttonLabel}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-6">
              <div className="space-y-1.5 max-w-xl">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white">
                  {activeTool === 'breathe'
                    ? breathRunning
                      ? `${phaseLabels[breathPhase].label} · ${phaseSecs}s`
                      : 'Thả lỏng cơ thể cùng quả cầu lưu ly'
                    : VI_COPY.calmTools.heading}
                </h1>
                <p className="text-xs sm:text-sm text-[#d4e2dc]">
                  {activeTool === 'breathe'
                    ? breathRunning
                      ? phaseLabels[breathPhase].guide
                      : 'Quả cầu ánh sáng 3D sẽ phồng mở và xẹp xuống nhịp nhàng cùng hơi thở của bạn.'
                    : VI_COPY.calmTools.subtitle}
                </p>
              </div>

              {activeTool === 'breathe' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={toggleBreathWithSound}
                    className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#4f7c5c] hover:bg-[#3f674a] text-white text-sm font-semibold inline-flex items-center gap-2 transition shadow-md"
                  >
                    {breathRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{breathRunning ? 'Tạm dừng' : 'Bắt đầu thở'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBreathRunning(false);
                      setBreathPhase('inhale');
                      setPhaseSecs(4);
                      setTotalElapsedSecs(0);
                    }}
                    className="min-h-[46px] px-3.5 py-2 rounded-xl bg-[#16231b]/85 border border-[#4e6d57]/60 text-xs sm:text-sm font-medium text-[#e4ece7]"
                  >
                    Đặt lại
                  </button>
                </div>
              )}
            </div>
          </div>
        </SanctuaryScene3D>
      )}

      {/* Segmented Tool Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#ebe9dd] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236]">
        {[
          { id: 'breathe' as const, label: 'Thở chậm (≤ 3p)', icon: Wind },
          { id: 'grounding' as const, label: 'Chạm đất 5-4-3-2-1', icon: Hand },
          { id: 'compassion' as const, label: 'Tự bi (3 câu)', icon: Heart },
          { id: 'reframe' as const, label: 'Tái khung nhẹ', icon: RefreshCw },
          { id: 'audio' as const, label: 'Nhạc & Thanh âm', icon: Volume2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTool(tab.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition whitespace-nowrap ${
                active
                  ? 'bg-[#faf7ef] dark:bg-[#2a3b2d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                  : 'text-[#576c59] dark:text-[#b0c0b2] hover:text-[#243627] dark:hover:text-[#edf2e8]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool 1: 4-7-8 Breathing compact control & Audio-Only toggle */}
      {activeTool === 'breathe' && (
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#243627] dark:text-[#edf2e8] tabular-nums">
              Nhịp thở 4 – 7 – 8 · Đã thở {Math.floor(totalElapsedSecs / 60)}:
              {String(totalElapsedSecs % 60).padStart(2, '0')} / 3:00
            </div>
            <p className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
              {audioOnlyMode
                ? 'Chế độ chỉ âm thanh đang bật — khung cảnh được làm dịu tối để bạn nhắm mắt nghỉ ngơi.'
                : 'Hít 4s, giữ 7s, thở ra êm 8s để hạ nhịp tim.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAudioOnlyMode((v) => !v)}
            className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition ${
              audioOnlyMode
                ? 'bg-[#46613e] text-white border-[#46613e]'
                : 'bg-[#f1efe5] dark:bg-[#232f26] border-[#dcdad0] dark:border-[#324236]'
            }`}
          >
            {audioOnlyMode ? 'Đang bật: Chỉ âm thanh (Nhắm mắt)' : 'Chế độ chỉ âm thanh'}
          </button>
        </div>
      )}

      {/* Tool 2: 5-4-3-2-1 Grounding */}
      {activeTool === 'grounding' && (
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold font-serif-healing">Chạm đất qua 5 giác quan</h2>
            <p className="text-base text-[#576c59] dark:text-[#b0c0b2] mt-1">
              Kéo sự chú ý từ những suy nghĩ dồn dập quay về căn phòng bạn đang ngồi ngay lúc này.
            </p>
          </div>

          <div className="space-y-2.5">
            {groundingSteps.map((step) => {
              const done = Boolean(checkedGrounding[step.count]);
              return (
                <button
                  key={step.count}
                  type="button"
                  onClick={() =>
                    setCheckedGrounding((prev) => {
                      const next = { ...prev, [step.count]: !prev[step.count] };
                      const doneCount = Object.values(next).filter(Boolean).length;
                      if (doneCount === 5 && !completedTrackedRef.current) {
                        completedTrackedRef.current = true;
                        void api.trackHealthyMetric('calm_tool_completed');
                      }
                      return next;
                    })
                  }
                  className={`w-full min-h-[64px] p-4 rounded-2xl border text-left flex items-start gap-3.5 transition ${
                    done
                      ? 'bg-[#e6efe2] dark:bg-[#2a3b2d] border-[#46613e] dark:border-[#7aa370]'
                      : 'bg-[#f1efe5] dark:bg-[#232f26] border-[#dcdad0] dark:border-[#324236] hover:border-[#9eb198]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 tabular-nums ${
                      done
                        ? 'bg-[#46613e] text-white'
                        : 'bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236]'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : step.count}
                  </div>
                  <div>
                    <div className="text-base font-bold">{step.sense}</div>
                    <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] mt-0.5">{step.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tool 3: 3-Sentence Self-Compassion */}
      {activeTool === 'compassion' && (
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold font-serif-healing">Tự bi với bản thân trong 3 câu</h2>
            <p className="text-base text-[#576c59] dark:text-[#b0c0b2] mt-1">
              Không ép mình phải vui lên, chỉ đặt xuống sự tự phán xét.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236]">
              <div className="text-xs font-semibold text-[#46613e] dark:text-[#8eb984]">
                Câu 1 · Ghi nhận thực tế
              </div>
              <p className="text-base font-serif-healing mt-1">
                “Khoảnh khắc này thật sự đang rất khó khăn với mình.”
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236]">
              <div className="text-xs font-semibold text-[#46613e] dark:text-[#8eb984]">
                Câu 2 · Cảm nhận phần người chung
              </div>
              <p className="text-base font-serif-healing mt-1">
                “Đau buồn khi mất đi một kết nối quan trọng là phản ứng rất tự nhiên của con người.”
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] space-y-2.5">
              <div className="text-xs font-semibold text-[#46613e] dark:text-[#8eb984]">
                Câu 3 · Một lời dịu dàng bạn tự chọn cho mình
              </div>
              <div className="flex flex-wrap gap-2">
                {compassionSamples.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setCompassionKindLine(sample)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#d6d3c6] dark:border-[#324236] text-sm text-left hover:border-[#46613e] transition"
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={compassionKindLine}
                onChange={(e) => setCompassionKindLine(e.target.value)}
                placeholder="Hoặc tự viết một câu nhẹ nhàng như nói với một người bạn đang mệt..."
                className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-base text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e] resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tool 4: Gentle Thought Reframe */}
      {activeTool === 'reframe' && (
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold font-serif-healing">Tái khung suy nghĩ rất nhẹ</h2>
            <p className="text-base text-[#576c59] dark:text-[#b0c0b2] mt-1">
              Khi một suy nghĩ tự trách lặp đi lặp lại, thử đặt hai câu hỏi cân bằng bên dưới (chỉ giữ trên thiết bị của bạn).
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="reframe-thought" className="block text-sm font-semibold mb-1">
                Suy nghĩ đang làm bạn nặng lòng lúc này
              </label>
              <textarea
                id="reframe-thought"
                rows={2}
                value={reframeThought}
                onChange={(e) => setReframeThought(e.target.value)}
                placeholder="Ví dụ: Mình đã làm hỏng tất cả và sẽ chẳng bao giờ..."
                className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-base text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e] resize-none"
              />
            </div>

            <SupportPromptCard text={reframeThought} compact />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reframe-for" className="block text-sm font-semibold mb-1">
                  Điều gì khiến mình tin suy nghĩ đó?
                </label>
                <textarea
                  id="reframe-for"
                  rows={3}
                  value={reframeSupport}
                  onChange={(e) => setReframeSupport(e.target.value)}
                  placeholder="Ghi ra sự việc cụ thể..."
                  className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-base text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e] resize-none"
                />
              </div>

              <div>
                <label htmlFor="reframe-against" className="block text-sm font-semibold mb-1">
                  Có bằng chứng hay góc nhìn ngược lại nào không?
                </label>
                <textarea
                  id="reframe-against"
                  rows={3}
                  value={reframeCounter}
                  onChange={(e) => setReframeCounter(e.target.value)}
                  placeholder="Nếu một người bạn nói câu đó với chính họ, bạn sẽ nhắc họ điều gì?"
                  className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-base text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e] resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool 5: Healing Audio & SoundCloud */}
      {activeTool === 'audio' && <HealingAudioSection />}
    </div>
  );
};
