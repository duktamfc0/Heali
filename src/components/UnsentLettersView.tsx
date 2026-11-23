import React, { useState, useEffect } from 'react';
import type { UnsentLetter } from '../services/api';
import { api, PinLockedError } from '../services/api';
import { SupportPromptCard } from './SupportPromptCard';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import { VI_COPY } from '../i18n/vi';
import { saveLetterDraft, loadLetterDraft, clearLetterDraft } from '../utils/offlineDrafts';
import {
  Mail,
  Flame,
  Plus,
  Trash2,
  Lock,
  X,
  Wind,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';

interface UnsentLettersViewProps {
  lowMotion?: boolean;
  prefillContent?: string | null;
  onClearPrefill?: () => void;
}

export const UnsentLettersView: React.FC<UnsentLettersViewProps> = ({
  lowMotion = false,
  prefillContent,
  onClearPrefill,
}) => {
  const [letters, setLetters] = useState<UnsentLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<UnsentLetter | null>(null);
  const [sealLetterTarget, setSealLetterTarget] = useState<UnsentLetter | null>(null);
  const [customSealDate, setCustomSealDate] = useState('');

  // New letter form
  const [isWritingLetter, setIsWritingLetter] = useState(false);
  const [recipient, setRecipient] = useState<UnsentLetter['recipient']>('ex');
  const [recipientName, setRecipientName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Burning & delete confirmations
  const [burnConfirmLetter, setBurnConfirmLetter] = useState<UnsentLetter | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBurning, setIsBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnSuccessMsg, setBurnSuccessMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const recipientOptions = [
    { id: 'ex', label: 'Người yêu cũ / Người từng thương', defaultName: 'Người từng là tất cả' },
    { id: 'self', label: 'Bản thân của những năm tháng vụng dại', defaultName: 'Tôi của ngày hôm qua' },
    { id: 'family', label: 'Bố mẹ / Người thân trong gia đình', defaultName: 'Bố mẹ / Người thân' },
    { id: 'friend', label: 'Người bạn cũ đã xa cách', defaultName: 'Bạn cũ' },
    { id: 'someone', label: 'Một ai đó chưa kịp nói lời chia tay', defaultName: 'Một người đặc biệt' },
  ] as const;

  useEffect(() => {
    void loadLetters();
    const draft = loadLetterDraft();
    if (draft) {
      setRecipient(draft.recipient);
      setRecipientName(draft.recipientName);
      setTitle(draft.title);
      setContent(draft.content);
    }
  }, []);

  useEffect(() => {
    if (prefillContent) {
      setRecipient('ex');
      setRecipientName('Người từng thương');
      setTitle('Những điều định nhắn nhưng giữ lại đây');
      setContent(prefillContent);
      setIsWritingLetter(true);
      onClearPrefill?.();
    }
  }, [prefillContent, onClearPrefill]);

  useEffect(() => {
    if (!isWritingLetter) return;
    saveLetterDraft({
      recipient,
      recipientName,
      title,
      content,
    });
  }, [isWritingLetter, recipient, recipientName, title, content]);

  const loadLetters = async () => {
    setIsLoading(true);
    try {
      const list = await api.getLetters();
      setLetters(list);
      setIsPinLocked(false);
    } catch (err) {
      if (err instanceof PinLockedError) {
        setIsPinLocked(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setPinError(null);
    try {
      await api.verifyPin(pinInput.trim());
      setPinInput('');
      setIsPinLocked(false);
      await loadLetters();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Mã PIN không chính xác.');
    }
  };

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Vui lòng viết nội dung lá thư.');
      return;
    }
    setIsSaving(true);
    try {
      const matched = recipientOptions.find((r) => r.id === recipient);
      const newLetter = await api.saveLetter({
        recipient,
        recipientName: recipientName.trim() || matched?.defaultName || 'Người nhận',
        title: title.trim() || 'Lá thư viết cho ngày hôm qua',
        content,
      });
      setLetters((prev) => [newLetter, ...prev]);
      clearLetterDraft();
      setIsWritingLetter(false);
      setTitle('');
      setContent('');
      setRecipientName('');
      showToast('Đã lưu lá thư vào hòm thư riêng tư của bạn.');
    } catch {
      showToast('Không thể đồng bộ lên máy chủ — bản nháp vẫn đang giữ an toàn trên máy bạn.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSealForDays = async (days: number) => {
    if (!sealLetterTarget) return;
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    try {
      const res = await api.sealLetterUntil(sealLetterTarget.id, target);
      setLetters((prev) => prev.map((l) => (l.id === sealLetterTarget.id ? res.letter : l)));
      if (selectedLetter?.id === sealLetterTarget.id) setSelectedLetter(res.letter);
      setSealLetterTarget(null);
      showToast(`Đã niêm phong lá thư đến ngày ${new Date(target).toLocaleDateString('vi-VN')}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể niêm phong thư.');
    }
  };

  const handleSealUntilCustomDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sealLetterTarget || !customSealDate) return;
    try {
      const targetIso = new Date(`${customSealDate}T09:00:00`).toISOString();
      const res = await api.sealLetterUntil(sealLetterTarget.id, targetIso);
      setLetters((prev) => prev.map((l) => (l.id === sealLetterTarget.id ? res.letter : l)));
      if (selectedLetter?.id === sealLetterTarget.id) setSelectedLetter(res.letter);
      setSealLetterTarget(null);
      setCustomSealDate('');
      showToast(`Đã niêm phong lá thư đến ngày ${new Date(targetIso).toLocaleDateString('vi-VN')}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ngày mở lại phải ở trong tương lai.');
    }
  };

  const handleExecuteBurnRitual = async (letter: UnsentLetter) => {
    setBurnConfirmLetter(null);
    const reduced =
      lowMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    if (reduced) {
      // Static calm burn execution for reduced-motion / low-power mode
      try {
        const res = await api.burnLetter(letter.id);
        setLetters((prev) => prev.filter((l) => l.id !== res.erasedId));
        if (selectedLetter?.id === res.erasedId) {
          setSelectedLetter(null);
        }
        setBurnSuccessMsg(res.message);
      } catch {
        showToast('Thao tác chưa hoàn tất. Vui lòng thử lại.');
      }
      return;
    }

    setIsBurning(true);
    setBurnProgress(0);

    const interval = window.setInterval(() => {
      setBurnProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    window.setTimeout(async () => {
      try {
        const res = await api.burnLetter(letter.id);
        setLetters((prev) => prev.filter((l) => l.id !== res.erasedId));
        if (selectedLetter?.id === res.erasedId) {
          setSelectedLetter(null);
        }
        setBurnSuccessMsg(res.message);
      } catch {
        showToast('Thao tác chưa hoàn tất. Vui lòng thử lại.');
      } finally {
        setIsBurning(false);
        setBurnProgress(0);
      }
    }, 2300);
  };

  const handleConfirmDeleteLetter = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteLetter(deleteConfirmId);
      setLetters((prev) => prev.filter((l) => l.id !== deleteConfirmId));
      if (selectedLetter?.id === deleteConfirmId) setSelectedLetter(null);
      setDeleteConfirmId(null);
      showToast('Đã xóa lá thư hoàn toàn.');
    } catch {
      showToast('Không thể xóa thư lúc này.');
    }
  };

  return (
    <div className="space-y-5 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {feedbackMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#273829] border border-[#46613e] px-4 py-2.5 text-sm text-[#faf7ef] shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#a8e0a1] shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 3D Interactive Candlelit Envelope & Burn Hearth Stage */}
      <SanctuaryScene3D
        variant="letters"
        activeEffect={isBurning}
        lowMotion={lowMotion}
        allowPureViewToggle
        className="min-h-[225px] sm:min-h-[255px]"
      >
        <div className="p-5 sm:p-8 flex flex-col justify-between min-h-[225px] sm:min-h-[255px] text-[#f4f4ed]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#e8b48c]">
            <Mail className="w-4 h-4" />
            <span>Hòm thư bí mật · Hoá tro hoặc niêm phong</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-6">
            <div className="space-y-1 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white">
                Lá thư chưa gửi
              </h1>
              <p className="text-xs sm:text-sm text-[#e7ddd5] font-serif-healing italic">
                Viết để buông nhẹ lòng: niêm phong hẹn ngày mở lại, hoặc hoá tro xóa thật khỏi hệ thống.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsWritingLetter(true)}
              className="min-h-[46px] flex items-center gap-1.5 rounded-2xl bg-[#537949] hover:bg-[#43653a] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition shrink-0 self-start sm:self-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Viết thư mới</span>
            </button>
          </div>
        </div>
      </SanctuaryScene3D>

      {/* Letters List / PIN Gate */}
      {isPinLocked ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#d6d3c6] dark:border-[#324236] flex items-center justify-center mx-auto text-[#46613e] dark:text-[#8eb984]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-serif-healing">Hòm thư đang được khóa bằng PIN</h2>
          <p className="text-sm text-[#576c59] dark:text-[#b0c0b2]">
            Nhập mã PIN để mở khóa không gian riêng tư của bạn.
          </p>
          <form onSubmit={handleUnlockPin} className="space-y-3">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={8}
              placeholder="••••"
              className="w-44 min-h-[44px] text-center tracking-widest text-lg font-bold rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] py-2.5"
            />
            {pinError && <p className="text-sm text-[#9b4b38] font-medium">{pinError}</p>}
            <div>
              <button
                type="submit"
                className="w-44 min-h-[44px] rounded-xl bg-[#46613e] hover:bg-[#384f31] py-2.5 text-sm font-semibold text-white transition"
              >
                Mở khóa
              </button>
            </div>
          </form>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcd9cc] dark:border-[#324236]"
            />
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm">
          <Mail className="w-10 h-10 text-[#91a48e] mx-auto mb-3" />
          <p className="text-base font-semibold">Hòm thư của bạn đang trống.</p>
          <p className="text-sm text-[#5e7260] dark:text-[#b0c0b2] mt-1 mb-5">
            Có điều gì bạn muốn viết ra mà không cần gửi cho ai khác đọc không?
          </p>
          <button
            type="button"
            onClick={() => setIsWritingLetter(true)}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            <Plus className="w-4 h-4" />
            <span>Viết lá thư đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {letters.map((letter) => {
            const isTimeLocked = Boolean(letter.isTimeLocked);
            return (
              <div
                key={letter.id}
                onClick={() => setSelectedLetter(letter)}
                className={`cursor-pointer p-5 rounded-3xl border shadow-sm heali-card-surface ${
                  isTimeLocked
                    ? 'bg-[#f4f1e7] dark:bg-[#232b20] border-[#dfd6be] dark:border-[#4c4632]'
                    : 'bg-[#faf7ef] dark:bg-[#1b241d] border-[#dedcd0] dark:border-[#324236] hover:border-[#9eb198] dark:hover:border-[#4c6451]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 font-semibold ${
                      isTimeLocked ? 'text-[#8c6422] dark:text-[#d8b473]' : 'text-[#46613e] dark:text-[#8eb984]'
                    }`}
                  >
                    {isTimeLocked ? (
                      <>
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>
                          Niêm phong đến{' '}
                          {letter.sealedUntil
                            ? new Date(letter.sealedUntil).toLocaleDateString('vi-VN')
                            : 'tương lai'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Đang lưu riêng tư</span>
                      </>
                    )}
                  </span>
                  <span className="text-[#6d7c6d] dark:text-[#b0c0b2] tabular-nums">
                    {new Date(letter.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="text-xs text-[#5e7260] dark:text-[#b0c0b2] mb-1">
                  Gửi: <strong>{letter.recipientName}</strong>
                </div>

                <h3 className="text-base font-bold font-serif-healing line-clamp-1 mb-1.5">
                  {letter.title}
                </h3>

                <p className="text-sm text-[#4b604d] dark:text-[#cbd6cc] font-serif-healing line-clamp-2 leading-relaxed">
                  {isTimeLocked
                    ? 'Lá thư này đang được tạm niêm phong theo ngày bạn đã chọn và sẽ tự mở lại khi đến hạn.'
                    : letter.content}
                </p>

                <div className="mt-4 pt-3 border-t border-[#e6e4d8] dark:border-[#2e3d31] flex items-center justify-between text-xs">
                  <span className="text-[#5e7260] dark:text-[#b0c0b2]">Nhấn để xem lựa chọn</span>
                  <span className="text-[#9b4b38] font-medium flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Hoá tro hoặc niêm phong
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Letter Detail Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 sm:p-7 shadow-2xl">
            {isBurning && (
              <div className="absolute inset-0 bg-[#1f2e21]/95 z-30 flex flex-col items-center justify-center p-6 text-center text-[#faf7ef] rounded-3xl">
                <Flame className="w-12 h-12 text-[#e7bd6b] mb-3" />
                <h3 className="text-lg font-bold text-[#f5e7c1] font-serif-healing">
                  Đang xóa bức thư khỏi máy chủ...
                </h3>
                <div className="w-52 h-2 rounded-full bg-[#314834] mt-5 overflow-hidden border border-[#d8be82]/50">
                  <div
                    className="h-full bg-gradient-to-r from-[#d8be82] to-[#e08b67] transition-all duration-200"
                    style={{ width: `${burnProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-start justify-between pb-4 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
              <div>
                <span className="text-xs text-[#46613e] dark:text-[#8eb984] block mb-0.5">
                  Lá thư gửi: <strong>{selectedLetter.recipientName}</strong>
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif-healing">
                  {selectedLetter.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e7260] dark:text-[#b0c0b2]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedLetter.isTimeLocked ? (
              <div className="my-5 p-6 rounded-2xl bg-[#f6efe2] dark:bg-[#232b20] border border-[#dfc89e] dark:border-[#4c4632] text-center space-y-2">
                <CalendarClock className="w-8 h-8 text-[#8c6422] dark:text-[#d8b473] mx-auto" />
                <p className="text-base font-semibold">Lá thư đang được niêm phong tạm thời</p>
                <p className="text-sm text-[#61471d] dark:text-[#d8c9a8]">
                  Nội dung sẽ mở lại vào ngày{' '}
                  <strong>
                    {selectedLetter.sealedUntil
                      ? new Date(selectedLetter.sealedUntil).toLocaleDateString('vi-VN')
                      : ''}
                  </strong>
                  . Bạn vẫn có thể chọn Hoá tro (xoá hẳn) nếu muốn xóa vĩnh viễn ngay.
                </p>
              </div>
            ) : (
              <div className="my-5 p-5 sm:p-6 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcd9cc] dark:border-[#324236] font-serif-healing text-base leading-relaxed whitespace-pre-wrap">
                {selectedLetter.content}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e5e2d5] dark:border-[#2e3d31]">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(selectedLetter.id)}
                className="min-h-[44px] flex items-center gap-1.5 text-sm text-[#6a7c6b] dark:text-[#b0c0b2] hover:text-[#9b4b38] transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {!selectedLetter.isTimeLocked && (
                  <button
                    type="button"
                    onClick={() => setSealLetterTarget(selectedLetter)}
                    className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] border border-[#cdd5c6] dark:border-[#324236] px-3.5 py-2 text-sm font-semibold transition"
                  >
                    <CalendarClock className="w-4 h-4" />
                    <span>Niêm phong đến ngày...</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setBurnConfirmLetter(selectedLetter)}
                  className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#8c4b32] hover:bg-[#743d28] px-4 py-2 text-sm font-semibold text-white transition"
                >
                  <Flame className="w-4 h-4 text-[#f5d293]" />
                  <span>Hoá tro (xoá hẳn)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Seal Picker Modal */}
      {sealLetterTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#46613e] dark:text-[#8eb984]">
                <CalendarClock className="w-5 h-5" />
                <h3 className="font-bold text-base font-serif-healing">Niêm phong tạm thời</h3>
              </div>
              <button type="button" onClick={() => setSealLetterTarget(null)} className="min-w-[40px] min-h-[40px] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#4b604d] dark:text-[#b0c0b2] leading-relaxed">
              {VI_COPY.unsentLetters.sealOptionHint}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => void handleSealForDays(days)}
                  className="min-h-[44px] py-2 rounded-xl bg-[#e6efe2] dark:bg-[#2a3b2d] border border-[#bdd0b6] dark:border-[#3b4e3f] text-sm font-semibold transition"
                >
                  {days} ngày nữa
                </button>
              ))}
            </div>
            <form onSubmit={handleSealUntilCustomDate} className="space-y-2.5 pt-2 border-t border-[#e6e4d8] dark:border-[#2e3d31]">
              <label className="block text-xs font-semibold">Hoặc chọn một ngày cụ thể:</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customSealDate}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setCustomSealDate(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!customSealDate}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] disabled:opacity-50 text-white text-sm font-semibold"
                >
                  Đặt lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Burn Confirmation Modal */}
      {burnConfirmLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#8c4b32]">
              <Flame className="w-5 h-5" />
              <h3 className="font-bold text-base font-serif-healing">Hoá tro bức thư này?</h3>
            </div>
            <p className="text-sm text-[#4b604d] dark:text-[#b0c0b2] leading-relaxed">
              {VI_COPY.unsentLetters.burnWarning}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBurnConfirmLetter(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-sm font-semibold"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={() => void handleExecuteBurnRitual(burnConfirmLetter)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#8c4b32] hover:bg-[#743d28] text-white text-sm font-semibold"
              >
                Hoá tro (xoá hẳn)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Letter Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base font-serif-healing">Xóa vĩnh viễn lá thư này?</h3>
            <p className="text-sm text-[#4b604d] dark:text-[#b0c0b2] leading-relaxed">
              Lá thư sau khi xóa sẽ biến mất hoàn toàn khỏi hòm thư của bạn.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-sm font-semibold"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteLetter()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#9b4b38] hover:bg-[#823c2b] text-white text-sm font-semibold"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Burn Success Modal */}
      {burnSuccessMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/65 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#d8be82] dark:border-[#4c4632] p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] flex items-center justify-center mx-auto text-[#46613e] dark:text-[#8eb984] mb-3.5">
              <Wind className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base font-serif-healing">
              {VI_COPY.unsentLetters.burnCompleteTitle}
            </h4>
            <p className="text-base text-[#4b604d] dark:text-[#b0c0b2] font-serif-healing leading-relaxed mt-2 mb-5">
              {burnSuccessMsg}
            </p>
            <button
              type="button"
              onClick={() => setBurnSuccessMsg(null)}
              className="w-full min-h-[44px] rounded-xl bg-[#46613e] hover:bg-[#384f31] py-2.5 text-sm font-semibold text-white transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Write New Letter Modal */}
      {isWritingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-[#46613e] dark:text-[#8eb984]" />
                <h3 className="font-bold text-base font-serif-healing">Viết Lá Thư Chưa Gửi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWritingLetter(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLetter} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Bạn muốn viết thư cho ai?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recipientOptions.map((opt) => {
                    const isSelected = recipient === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setRecipient(opt.id);
                          if (!recipientName) setRecipientName(opt.defaultName);
                        }}
                        className={`min-h-[44px] p-2.5 rounded-xl border text-left text-sm transition ${
                          isSelected
                            ? 'border-[#46613e] bg-[#e6efe2] dark:bg-[#2a3b2d] font-semibold'
                            : 'border-[#dcdad0] dark:border-[#324236] bg-[#f1efe5] dark:bg-[#232f26]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Cách bạn gọi người nhận</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  maxLength={50}
                  placeholder="Ví dụ: Anh của những ngày mưa, Tôi tuổi 20..."
                  className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tiêu đề bức thư</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Ví dụ: Những điều chưa kịp nói..."
                  className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Nội dung lá thư <span className="text-[#9b4b38]">*</span>
                </label>
                <textarea
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder="Hãy viết những điều bạn đang muốn nói... Bản nháp được tự lưu trên thiết bị nếu mất mạng."
                  className="w-full rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3.5 text-base resize-none font-serif-healing leading-relaxed"
                />
              </div>

              <SupportPromptCard text={`${title} ${content}`} compact />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWritingLetter(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-sm font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition"
                >
                  <Lock className="w-4 h-4 text-[#f5e7c1]" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu lá thư riêng tư'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
