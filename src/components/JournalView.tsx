import React, { useState, useEffect, useRef } from 'react';
import type { JournalEntry, MoodCheckin, User } from '../services/api';
import { api, PinLockedError } from '../services/api';
import { SupportPromptCard } from './SupportPromptCard';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import { VI_COPY } from '../i18n/vi';
import { saveJournalDraft, loadJournalDraft, clearJournalDraft } from '../utils/offlineDrafts';
import {
  BookOpen,
  Lock,
  KeyRound,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Smile,
  Frown,
  Meh,
  Sun,
  X,
  TrendingUp,
  Save,
  CheckCircle2,
  Clock,
  Wind,
  RotateCcw,
} from 'lucide-react';

interface JournalViewProps {
  lowMotion?: boolean;
  onOpenBreathing?: () => void;
  onOpenCalmGrounding?: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  lowMotion = false,
  onOpenBreathing,
  onOpenCalmGrounding,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [chartRange, setChartRange] = useState<7 | 30>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // PIN lock protection state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [currentPinForChange, setCurrentPinForChange] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // New Entry Modal & Guided Mode
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isGuidedMode, setIsGuidedMode] = useState(true);
  const [guidedFields, setGuidedFields] = useState({
    happened: '',
    body: '',
    need: '',
    kindness: '',
  });
  const [writingSeconds, setWritingSeconds] = useState(0);

  // Post-write cool-down prompt & 10-second Undo delete
  const [showPostWriteWindDown, setShowPostWriteWindDown] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    entry: JournalEntry;
    timeoutId: number;
  } | null>(null);
  const pendingDeleteRef = useRef<{ entry: JournalEntry; timeoutId: number } | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodScore, setMoodScore] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [gratitude, setGratitude] = useState('');
  const [selfCareAction, setSelfCareAction] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const currentHour = new Date().getHours();
  const isLateNight = currentHour >= 0 && currentHour < 5;

  const moodLevels = [
    { score: 1, label: 'Đang rất nặng', icon: Frown, color: 'text-[#9b4b38]', bg: 'bg-[#f7e7e3]' },
    { score: 2, label: 'Chùng xuống', icon: Meh, color: 'text-[#5b667a]', bg: 'bg-[#ebeef2]' },
    { score: 3, label: 'Tĩnh lặng', icon: Sparkles, color: 'text-[#46613e]', bg: 'bg-[#e6efe2]' },
    { score: 4, label: 'Đỡ hơn chút', icon: Smile, color: 'text-[#8c6422]', bg: 'bg-[#f6efe2]' },
    { score: 5, label: 'Dịu êm', icon: Sun, color: 'text-[#2e5f3d]', bg: 'bg-[#e2f0e4]' },
  ];

  const emotionTags = VI_COPY.emotionWheel.map((e) => e.name);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    setUser(currentUser);
    const unlocked = !currentUser?.hasPin || Boolean(currentUser.pinUnlocked);
    setIsUnlocked(unlocked);

    // Restore offline draft if present
    const draft = loadJournalDraft();
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
      setMoodScore(draft.moodScore);
      setSelectedEmotions(draft.emotions);
      setGratitude(draft.gratitude);
      setSelfCareAction(draft.selfCareAction);
    }

    if (unlocked) {
      void loadEntries();
    } else {
      setIsLoading(false);
    }

    return () => {
      // Flush pending deletion if leaving view before 10s
      if (pendingDeleteRef.current) {
        window.clearTimeout(pendingDeleteRef.current.timeoutId);
        void api.deleteJournalEntry(pendingDeleteRef.current.entry.id).catch(() => {});
      }
    };
  }, []);

  // Auto-save offline draft cleanly
  useEffect(() => {
    if (!isNewEntryOpen) return;
    saveJournalDraft({
      title,
      content,
      moodScore,
      emotions: selectedEmotions,
      gratitude,
      selfCareAction,
    });
  }, [isNewEntryOpen, title, content, moodScore, selectedEmotions, gratitude, selfCareAction]);

  // 15-20 min writing reflection timer
  useEffect(() => {
    if (!isNewEntryOpen) {
      setWritingSeconds(0);
      return;
    }
    const id = window.setInterval(() => {
      setWritingSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isNewEntryOpen]);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => setFeedbackMsg(null), 3200);
  };

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const [list, checkinRes] = await Promise.all([
        api.getJournalEntries(),
        api.getMoodCheckins().catch(() => ({ checkins: [], weeklySelfCareCount: 0 })),
      ]);
      setEntries(list);
      setCheckins(checkinRes.checkins || []);
      setIsUnlocked(true);
    } catch (err) {
      if (err instanceof PinLockedError) {
        setIsUnlocked(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setIsVerifyingPin(true);
    setPinError(null);
    try {
      const updatedUser = await api.verifyPin(pinInput.trim());
      setUser(updatedUser);
      setIsUnlocked(true);
      setPinInput('');
      await loadEntries();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Mã PIN không chính xác. Hãy thử lại.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleLock = async () => {
    await api.lockPrivateSpace();
    const currentUser = api.getCurrentUser();
    setUser(currentUser);
    if (currentUser?.hasPin) {
      setIsUnlocked(false);
      setEntries([]);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinCode && newPinCode.length < 4) {
      setPinError('Mã PIN cần có ít nhất 4 ký tự');
      return;
    }
    try {
      const updated = await api.updateProfile({
        pinCode: newPinCode || null,
        currentPin: currentPinForChange.trim() || undefined,
      });
      setUser(updated);
      setIsSettingPin(false);
      setIsUnlocked(!updated.hasPin || updated.pinUnlocked);
      setNewPinCode('');
      setCurrentPinForChange('');
      setPinError(null);
      showToast(
        newPinCode
          ? 'Đã cài đặt mã PIN bảo vệ không gian riêng tư!'
          : 'Đã xóa mã PIN bảo vệ.'
      );
      await loadEntries();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Không thể lưu mã PIN');
    }
  };

  const toggleEmotionTag = (tag: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const assembledGuided = isGuidedMode
      ? [
          guidedFields.happened.trim() ? `Chuyện vừa xảy ra:\n${guidedFields.happened.trim()}` : '',
          guidedFields.body.trim() ? `Cơ thể & cảm xúc lúc này:\n${guidedFields.body.trim()}` : '',
          guidedFields.need.trim() ? `Mình đang cần gì:\n${guidedFields.need.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n\n')
      : '';

    const finalContent = [assembledGuided, content.trim()].filter(Boolean).join('\n\n');
    if (!finalContent) {
      showToast('Hãy viết vài dòng cảm xúc của bạn.');
      return;
    }

    setIsSaving(true);
    try {
      const newEntry = await api.saveJournalEntry({
        date: new Date().toISOString().split('T')[0],
        moodScore,
        emotions: selectedEmotions,
        title: title.trim() || 'Ghi chép tâm trạng',
        content: finalContent,
        gratitude: gratitude.trim(),
        selfCareAction: (selfCareAction || guidedFields.kindness).trim(),
      });
      setEntries((prev) => [newEntry, ...prev]);
      clearJournalDraft();
      setIsNewEntryOpen(false);
      setTitle('');
      setContent('');
      setGuidedFields({ happened: '', body: '', need: '', kindness: '' });
      setSelectedEmotions([]);
      setGratitude('');
      setSelfCareAction('');
      setShowPostWriteWindDown(true);
    } catch {
      showToast('Chưa thể đồng bộ lên máy chủ — bản nháp đã được giữ an toàn trên máy bạn.');
    } finally {
      setIsSaving(false);
    }
  };

  // 10-second Undo Delete flow (§6.2)
  const requestDeleteWithUndo = (entry: JournalEntry) => {
    if (pendingDeleteRef.current) {
      window.clearTimeout(pendingDeleteRef.current.timeoutId);
      void api.deleteJournalEntry(pendingDeleteRef.current.entry.id).catch(() => {});
    }

    setEntries((prev) => prev.filter((item) => item.id !== entry.id));

    const timeoutId = window.setTimeout(async () => {
      pendingDeleteRef.current = null;
      setPendingDelete(null);
      try {
        await api.deleteJournalEntry(entry.id);
      } catch {
        // restore if server deletion fails
        setEntries((prev) => [entry, ...prev]);
        showToast('Không thể xóa nhật ký lúc này.');
      }
    }, 10000);

    const record = { entry, timeoutId };
    pendingDeleteRef.current = record;
    setPendingDelete(record);
  };

  const handleUndoDelete = () => {
    if (!pendingDeleteRef.current) return;
    window.clearTimeout(pendingDeleteRef.current.timeoutId);
    const restored = pendingDeleteRef.current.entry;
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    setEntries((prev) => [restored, ...prev]);
  };

  // Real trend data builder (from real mood checkins + journal entries, zero fake points)
  const trendPoints = React.useMemo(() => {
    const cutoff = Date.now() - chartRange * 24 * 60 * 60 * 1000;
    const byDate = new Map<string, number[]>();

    for (const c of checkins) {
      if (new Date(c.createdAt).getTime() >= cutoff) {
        const arr = byDate.get(c.date) || [];
        arr.push(c.moodScore);
        byDate.set(c.date, arr);
      }
    }
    for (const j of entries) {
      if (new Date(j.createdAt).getTime() >= cutoff) {
        const arr = byDate.get(j.date) || [];
        arr.push(j.moodScore);
        byDate.set(j.date, arr);
      }
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        avg: Number((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)),
        count: scores.length,
      }));
  }, [entries, checkins, chartRange]);

  const combinedTextForSafety = `${title} ${guidedFields.happened} ${guidedFields.body} ${guidedFields.need} ${content}`;
  const writingMins = Math.floor(writingSeconds / 60);
  const writingSecs = writingSeconds % 60;

  return (
    <div className="space-y-5 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#273829] border border-[#46613e] px-4 py-2.5 text-sm text-[#faf7ef] shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#a8e0a1] shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 10-second Undo Delete Banner */}
      {pendingDelete && (
        <div className="rounded-2xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#c7d3c1] dark:border-[#3b4e3f] p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">
            {VI_COPY.journal.undoDeleteBanner}
          </span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold inline-flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{VI_COPY.journal.undoButton}</span>
          </button>
        </div>
      )}

      {/* 3D Interactive Candlelit Journal Desk Stage */}
      <SanctuaryScene3D
        variant="journal"
        lowMotion={lowMotion}
        allowPureViewToggle
        className="min-h-[225px] sm:min-h-[255px]"
      >
        <div className="p-5 sm:p-8 flex flex-col justify-between min-h-[225px] sm:min-h-[255px] text-[#f4f4ed]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#e6c37b]">
            <BookOpen className="w-4 h-4" />
            <span>Không gian riêng tư · Mã hóa đầu cuối</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6">
            <div className="space-y-1 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white">
                Nhật ký cảm xúc
              </h1>
              <p className="text-xs sm:text-sm text-[#e1dfd4] font-serif-healing italic">
                Ánh nến nhỏ và trang giấy mở cho những dòng viết chỉ riêng mình bạn đọc lại.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
              {user?.hasPin && isUnlocked && (
                <button
                  type="button"
                  onClick={() => void handleLock()}
                  className="min-h-[44px] flex items-center gap-1.5 rounded-2xl bg-[#18231a]/85 hover:bg-[#223125] border border-[#4c6351]/60 px-3.5 py-2 text-sm font-semibold text-[#e6ece4] transition whitespace-nowrap"
                >
                  <Lock className="w-4 h-4 text-[#a7cfa1]" />
                  <span>Khóa lại</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setPinError(null);
                  setCurrentPinForChange('');
                  setIsSettingPin(true);
                }}
                className="min-h-[44px] flex items-center gap-1.5 rounded-2xl bg-[#18231a]/85 hover:bg-[#223125] border border-[#4c6351]/60 px-3.5 py-2 text-sm font-semibold text-[#e6ece4] transition whitespace-nowrap"
              >
                <KeyRound className="w-4 h-4 text-[#e6c37b]" />
                <span>{user?.hasPin ? 'Đổi mã PIN' : 'Bật khóa PIN'}</span>
              </button>

              {isUnlocked && (
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(true)}
                  className="min-h-[46px] flex items-center gap-1.5 rounded-2xl bg-[#537949] hover:bg-[#43653a] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Viết nhật ký</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </SanctuaryScene3D>

      {/* PIN Lock Screen */}
      {!isUnlocked && user?.hasPin ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] text-center max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#d6d3c6] dark:border-[#324236] flex items-center justify-center mx-auto text-[#46613e] dark:text-[#8eb984] mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-serif-healing">Nhật ký đang được khóa</h2>
          <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] mt-1 mb-5">
            Nhập mã PIN cá nhân của bạn để mở khóa góc ký ức riêng tư.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={8}
              placeholder="••••"
              className="w-44 min-h-[44px] text-center tracking-widest text-lg font-bold rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] py-2.5 focus:outline-none focus:border-[#46613e]"
              autoFocus
            />
            {pinError && <p className="text-sm text-[#9b4b38] font-medium">{pinError}</p>}
            <div>
              <button
                type="submit"
                disabled={isVerifyingPin}
                className="w-44 min-h-[44px] rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-60 py-2.5 text-sm font-semibold text-white transition"
              >
                {isVerifyingPin ? 'Đang kiểm tra...' : 'Mở khóa'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Real Weekly / Monthly Non-Judgmental Trend Chart */}
          {(trendPoints.length > 0 || entries.length > 0) && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-[#46613e] dark:text-[#8eb984]" />
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-serif-healing">
                      Xu hướng cảm xúc thật của bạn
                    </h2>
                    <p className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
                      Tổng hợp từ check-in &amp; nhật ký bạn đã lưu — chỉ để quan sát nhịp lên xuống, không chấm điểm tốt/xấu.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236]">
                  <button
                    type="button"
                    onClick={() => setChartRange(7)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      chartRange === 7
                        ? 'bg-[#46613e] text-white'
                        : 'text-[#576c59] dark:text-[#b0c0b2]'
                    }`}
                  >
                    7 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartRange(30)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      chartRange === 30
                        ? 'bg-[#46613e] text-white'
                        : 'text-[#576c59] dark:text-[#b0c0b2]'
                    }`}
                  >
                    30 ngày
                  </button>
                </div>
              </div>

              {trendPoints.length === 0 ? (
                <p className="text-sm text-[#576c59] dark:text-[#b0c0b2]">
                  Chưa có ghi nhận trong {chartRange} ngày gần đây.
                </p>
              ) : (
                <div className="flex items-end gap-2 sm:gap-3 h-28 pt-3 overflow-x-auto pb-1">
                  {trendPoints.map((pt) => {
                    const heightPct = Math.max(18, Math.round((pt.avg / 5) * 100));
                    return (
                      <div
                        key={pt.date}
                        className="flex flex-col items-center gap-1.5 min-w-[44px]"
                        title={`${pt.date}: mức ${pt.avg}/5 (${pt.count} lần ghi nhận)`}
                      >
                        <span className="text-[11px] font-mono tabular-nums text-[#576c59] dark:text-[#b0c0b2]">
                          {pt.avg}
                        </span>
                        <div className="w-6 h-16 rounded-lg bg-[#ebe9dd] dark:bg-[#232f26] flex items-end overflow-hidden">
                          <div
                            className="w-full rounded-t-md bg-[#46613e] dark:bg-[#7aa370]"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono tabular-nums text-[#576c59] dark:text-[#b0c0b2]">
                          {pt.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Entries List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-3xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcd9cc] dark:border-[#324236]"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm">
              <BookOpen className="w-10 h-10 text-[#91a48e] mx-auto mb-3" />
              <p className="text-base font-semibold">Bạn chưa có trang nhật ký nào.</p>
              <p className="text-sm text-[#5e7260] dark:text-[#b0c0b2] mt-1 mb-5">
                Có thể viết theo 4 bước ngắn gọn hoặc viết tự do tùy nhịp của bạn.
              </p>
              <button
                type="button"
                onClick={() => setIsNewEntryOpen(true)}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] px-4 py-2.5 text-sm font-semibold text-white transition"
              >
                <Plus className="w-4 h-4" />
                <span>Viết trang đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => {
                const moodMeta =
                  moodLevels.find((m) => m.score === entry.moodScore) || moodLevels[2];
                const MoodIcon = moodMeta.icon;

                return (
                  <div
                    key={entry.id}
                    className="p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm space-y-3 heali-card-surface"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl ${moodMeta.bg} border border-[#e3dfd2] flex items-center justify-center ${moodMeta.color} shrink-0`}
                        >
                          <MoodIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-serif-healing">
                            {entry.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#5e7260] dark:text-[#b0c0b2] mt-0.5 tabular-nums">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{entry.date}</span>
                            <span aria-hidden="true">·</span>
                            <span>{moodMeta.label}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => requestDeleteWithUndo(entry)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6a7c6b] dark:text-[#b0c0b2] hover:text-[#9b4b38] hover:bg-[#f7e7e3] dark:hover:bg-[#2c1f1c] transition"
                        aria-label="Xóa trang nhật ký (có thể hoàn tác trong 10 giây)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {entry.emotions && entry.emotions.length > 0 && (
                      <div className="text-xs text-[#46613e] dark:text-[#8eb984] font-medium flex flex-wrap items-center gap-1.5">
                        {entry.emotions.map((em, idx) => (
                          <React.Fragment key={`${em}-${idx}`}>
                            {idx > 0 && <span aria-hidden="true">·</span>}
                            <span>{em}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    <div className="text-base text-[#2d3f2f] dark:text-[#edf2e8] font-serif-healing leading-relaxed whitespace-pre-wrap pt-1">
                      {entry.content}
                    </div>

                    {(entry.gratitude || entry.selfCareAction) && (
                      <div className="mt-3 pt-3.5 border-t border-[#e6e4d8] dark:border-[#2e3d31] grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {entry.gratitude && (
                          <div className="p-3 rounded-2xl bg-[#f6efe2] dark:bg-[#232f26] border border-[#e3d2b1] dark:border-[#324236]">
                            <span className="font-bold block text-xs text-[#7a5d2e] dark:text-[#d8b473] mb-0.5">
                              Điều nhỏ bé ghi nhận
                            </span>
                            {entry.gratitude}
                          </div>
                        )}
                        {entry.selfCareAction && (
                          <div className="p-3 rounded-2xl bg-[#e6efe2] dark:bg-[#2a3b2d] border border-[#c3d3bd] dark:border-[#3b4e3f]">
                            <span className="font-bold block text-xs text-[#3c5c39] dark:text-[#8eb984] mb-0.5">
                              Dịu dàng với chính mình
                            </span>
                            {entry.selfCareAction}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* New Journal Entry Modal with Guided Anti-Rumination Flow */}
      {isNewEntryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-journal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl text-[#273829] dark:text-[#edf2e8]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#46613e] dark:text-[#8eb984]" />
                <h2 id="new-journal-title" className="font-bold text-lg font-serif-healing">
                  Viết Nhật Ký Cảm Xúc
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEntryOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e7260] dark:text-[#b0c0b2]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-4 space-y-4">
              {/* Late Night Gentle Check */}
              {isLateNight && (
                <div className="p-3.5 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-sm">
                  {VI_COPY.journal.midnightHint}
                </div>
              )}

              {/* Writing Session Duration Hint (15-20 min anti-rumination) */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs">
                <div className="flex items-center gap-2 text-[#4b604d] dark:text-[#b0c0b2]">
                  <Clock className="w-4 h-4 text-[#46613e] dark:text-[#8eb984] shrink-0" />
                  <span>{VI_COPY.journal.recommendedDurationHint}</span>
                </div>
                <span className="font-mono font-semibold tabular-nums">
                  {String(writingMins).padStart(2, '0')}:{String(writingSecs).padStart(2, '0')}
                </span>
              </div>

              {/* Mood scale */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Tâm trạng của bạn lúc này
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {moodLevels.map((ml) => {
                    const isSelected = moodScore === ml.score;
                    const Icon = ml.icon;
                    return (
                      <button
                        key={ml.score}
                        type="button"
                        onClick={() => setMoodScore(ml.score)}
                        className={`min-h-[60px] p-2 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition ${
                          isSelected
                            ? 'border-[#46613e] bg-[#e6efe2] dark:bg-[#2a3b2d]'
                            : 'border-[#dcdad0] dark:border-[#324236] bg-[#f1efe5] dark:bg-[#232f26]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${ml.color}`} />
                        <span className="text-xs font-medium leading-tight">{ml.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emotion tags */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Chọn những cảm xúc đang hiện hữu (nếu muốn)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {emotionTags.map((tag) => {
                    const isSelected = selectedEmotions.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleEmotionTag(tag)}
                        className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-medium transition ${
                          isSelected
                            ? 'bg-[#46613e] text-white'
                            : 'bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Writing mode toggle */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-sm font-semibold">Cách viết</span>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236]">
                  <button
                    type="button"
                    onClick={() => setIsGuidedMode(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      isGuidedMode ? 'bg-[#46613e] text-white' : ''
                    }`}
                  >
                    Có hướng dẫn 4 bước
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGuidedMode(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      !isGuidedMode ? 'bg-[#46613e] text-white' : ''
                    }`}
                  >
                    Viết tự do
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-1">Tiêu đề trang viết</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Ví dụ: Một buổi tối hơi nặng lòng..."
                  className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-base"
                />
              </div>

              {isGuidedMode ? (
                <div className="space-y-3">
                  {VI_COPY.journal.guidedSteps.map((step) => (
                    <div key={step.key}>
                      <label className="block text-sm font-semibold mb-1">{step.label}</label>
                      <textarea
                        rows={2}
                        value={guidedFields[step.key as keyof typeof guidedFields]}
                        onChange={(e) =>
                          setGuidedFields((prev) => ({ ...prev, [step.key]: e.target.value }))
                        }
                        placeholder={step.placeholder}
                        className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-base resize-none font-serif-healing leading-relaxed"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Ghi thêm nếu bạn muốn (không bắt buộc)
                    </label>
                    <textarea
                      rows={3}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Những điều còn muốn viết thêm..."
                      className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-base resize-none font-serif-healing leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Ghi chép cảm xúc <span className="text-[#9b4b38]">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Cứ viết ra hết những điều đang giữ trong lòng..."
                    className="w-full rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3.5 text-base resize-none font-serif-healing leading-relaxed"
                  />
                </div>
              )}

              <SupportPromptCard text={combinedTextForSafety} compact />

              {/* Optional Gratitude & Self Care */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#7a5d2e] dark:text-[#d8b473] mb-1">
                    Điều nhỏ bé ghi nhận (có thể bỏ qua)
                  </label>
                  <input
                    type="text"
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="Bỏ trống cũng hoàn toàn ổn..."
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3c5c39] dark:text-[#8eb984] mb-1">
                    Việc nhỏ tự chăm sóc (có thể bỏ qua)
                  </label>
                  <input
                    type="text"
                    value={selfCareAction}
                    onChange={(e) => setSelfCareAction(e.target.value)}
                    placeholder="Ví dụ: Uống một ly nước ấm..."
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-2">
                <span className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
                  Bản nháp tự lưu cục bộ khi bạn gõ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewEntryOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-sm font-semibold"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu nhật ký'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Write Wind-Down Modal */}
      {showPostWriteWindDown && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="winddown-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e6efe2] dark:bg-[#2a3b2d] flex items-center justify-center mx-auto text-[#46613e] dark:text-[#8eb984]">
              <Wind className="w-6 h-6" />
            </div>
            <h3 id="winddown-title" className="text-lg font-bold font-serif-healing">
              {VI_COPY.journal.postWriteTitle}
            </h3>
            <p className="text-base text-[#4b604d] dark:text-[#b0c0b2] leading-relaxed">
              {VI_COPY.journal.postWriteBody}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPostWriteWindDown(false);
                  if (onOpenBreathing) {
                    onOpenBreathing();
                  } else {
                    window.dispatchEvent(new CustomEvent('heali:open-breathing'));
                  }
                }}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] text-white text-sm font-semibold"
              >
                Thở 1 phút
              </button>
              {onOpenCalmGrounding && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPostWriteWindDown(false);
                    onOpenCalmGrounding();
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-sm font-semibold"
                >
                  Chạm đất 5 vật
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPostWriteWindDown(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-sm font-medium"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set PIN Modal */}
      {isSettingPin && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#46613e] dark:text-[#8eb984]" />
                <h3 className="font-bold text-base font-serif-healing">Cài đặt mã PIN bảo vệ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingPin(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="mt-4 space-y-3.5 text-sm">
              <p className="text-[#4b604d] dark:text-[#b0c0b2] leading-relaxed">
                Mã PIN giúp bảo vệ nhật ký và thư chưa gửi khi bạn dùng chung thiết bị với người khác.
              </p>
              {user?.hasPin && !user?.pinUnlocked && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Mã PIN hiện tại</label>
                  <input
                    type="password"
                    value={currentPinForChange}
                    onChange={(e) => setCurrentPinForChange(e.target.value)}
                    maxLength={8}
                    placeholder="Nhập mã PIN cũ"
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-center font-bold tracking-widest"
                  />
                </div>
              )}
              <input
                type="password"
                value={newPinCode}
                onChange={(e) => setNewPinCode(e.target.value)}
                maxLength={8}
                placeholder="PIN mới 4-8 ký tự (trống = bỏ khóa)"
                className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-center font-bold tracking-widest"
              />

              {pinError && <p className="text-[#9b4b38] font-medium text-xs">{pinError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingPin(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white font-semibold"
                >
                  Lưu thiết lập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
