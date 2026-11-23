import React, { useState, useEffect } from 'react';
import { api, type SharedLanternGift } from '../services/api';
import { Leaf, Flame, HeartHandshake, ShieldCheck, ArrowRight, EyeOff, CheckCircle2 } from 'lucide-react';

interface SharedLanternGiftViewProps {
  token: string;
  lowMotion?: boolean;
  onEnterApp: () => void;
  onOpenLanding: () => void;
  onOpenHelpline: () => void;
}

const COLOR_STYLES: Record<string, { orb: string; ring: string; glow: string }> = {
  gold: {
    orb: 'bg-[#f4d58d] text-[#6d4e15]',
    ring: 'border-[#d6ab4f]/60',
    glow: 'shadow-[0_0_50px_rgba(214,171,79,0.35)]',
  },
  pink: {
    orb: 'bg-[#f2c6c8] text-[#6d2931]',
    ring: 'border-[#cf7b80]/60',
    glow: 'shadow-[0_0_50px_rgba(207,123,128,0.35)]',
  },
  lavender: {
    orb: 'bg-[#d8cff0] text-[#3d2f66]',
    ring: 'border-[#8f7fb3]/60',
    glow: 'shadow-[0_0_50px_rgba(143,127,179,0.35)]',
  },
  moon: {
    orb: 'bg-[#edf2ea] text-[#273829]',
    ring: 'border-[#9fb499]/60',
    glow: 'shadow-[0_0_50px_rgba(159,180,153,0.35)]',
  },
};

export const SharedLanternGiftView: React.FC<SharedLanternGiftViewProps> = ({
  token,
  lowMotion = false,
  onEnterApp,
  onOpenLanding,
  onOpenHelpline,
}) => {
  const [gift, setGift] = useState<SharedLanternGift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOptedOut, setIsOptedOut] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replySaved, setReplySaved] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [confirmOptOut, setConfirmOptOut] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setErrorMsg(null);
    api
      .getLanternGift(token)
      .then((g) => {
        setGift(g);
        if (g.replyMessage) setReplySaved(g.replyMessage);
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Ngọn đèn này không còn khả dụng.');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsReplying(true);
    setReplyError(null);
    try {
      const res = await api.replyLanternGift(token, replyText.trim(), gift?.color || 'gold');
      setReplySaved(res.replyMessage);
      setReplyText('');
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Không thể gửi ngọn đèn đáp lại.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleOptOut = async () => {
    try {
      await api.optOutLanternGift(token);
      setIsOptedOut(true);
      setGift(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tắt liên kết.');
    }
  };

  const style = COLOR_STYLES[gift?.color || 'gold'] || COLOR_STYLES.gold;

  return (
    <div className="min-h-screen bg-[#f4f4ed] dark:bg-[#141a15] text-[#273829] dark:text-[#edf2e8] flex flex-col">
      {/* Calm Guest Header */}
      <header className="sticky top-0 z-30 bg-[#fafaf4]/95 dark:bg-[#182019]/95 backdrop-blur-sm border-b border-[#e2e6da] dark:border-[#2c3a2e] px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
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
            <button
              type="button"
              onClick={onOpenHelpline}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#9b3d2b] hover:bg-[#823020] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Cần giúp ngay</span>
            </button>
            <button
              type="button"
              onClick={onEnterApp}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition"
            >
              <span>Vào Heali</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 sm:py-14 flex flex-col justify-center">
        {isLoading ? (
          <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-10 text-center text-sm text-[#576c59] dark:text-[#a6b7a8]">
            Đang thắp ánh đèn nhỏ...
          </div>
        ) : isOptedOut ? (
          <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-8 text-center space-y-4 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-[#46613e] dark:text-[#8eb984] mx-auto" />
            <h1 className="text-xl font-bold font-serif-healing">Đã tắt ngọn đèn này</h1>
            <p className="text-sm text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">
              Lời nhắn đã được xóa khỏi liên kết này theo lựa chọn của bạn. Không có thông tin nào bị lưu lại về bạn.
            </p>
            <button
              type="button"
              onClick={onOpenLanding}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#46613e] text-white text-sm font-semibold"
            >
              Tìm hiểu về Heali
            </button>
          </div>
        ) : errorMsg || !gift ? (
          <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-8 text-center space-y-4 shadow-sm">
            <h1 className="text-xl font-bold font-serif-healing">Liên kết ngọn đèn không còn mở</h1>
            <p className="text-sm text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">
              {errorMsg || 'Ngọn đèn này có thể đã hết hạn hoặc đã được tắt.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onEnterApp}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#46613e] text-white text-sm font-semibold"
              >
                Ghé góc nhỏ yên tĩnh Heali
              </button>
              <button
                type="button"
                onClick={onOpenLanding}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-sm font-semibold"
              >
                Trang giới thiệu
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Glowing Lantern Card — zero account/registration required */}
            <div className="rounded-[28px] bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-7 sm:p-10 shadow-sm text-center space-y-6">
              <div className="flex flex-col items-center space-y-3">
                <div
                  className={`w-24 h-24 rounded-full border-2 ${style.orb} ${style.ring} ${
                    lowMotion ? '' : `${style.glow} animate-pulse`
                  } flex items-center justify-center`}
                >
                  <Flame className="w-10 h-10" strokeWidth={1.7} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#46613e] dark:text-[#98c18e]">
                  Một ngọn đèn gửi riêng cho bạn · Không cần đăng nhập
                </span>
              </div>

              <blockquote className="text-xl sm:text-2xl font-serif-healing leading-relaxed text-[#243627] dark:text-[#f2f6ee]">
                “{gift.message}”
              </blockquote>

              <div className="text-xs text-[#576c59] dark:text-[#a6b7a8] space-y-1">
                <div>
                  {gift.senderDisplayName
                    ? `Người gửi muốn nhắn tên: ${gift.senderDisplayName}`
                    : 'Một người bạn gửi ẩn danh'}
                </div>
                <div>
                  Liên kết tự động hết hạn vào {new Date(gift.expiresAt).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Light a lantern back */}
              <div className="pt-4 border-t border-[#e5e2d5] dark:border-[#2e3d31] text-left space-y-3">
                {replySaved ? (
                  <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#223225] border border-[#c7d6c0] dark:border-[#3b523e] space-y-1">
                    <div className="text-xs font-bold text-[#2d452a] dark:text-[#cfe3c9] flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4" />
                      <span>Bạn đã thả một ngọn đèn đáp lại lên mặt hồ chung:</span>
                    </div>
                    <p className="text-sm font-serif-healing italic">“{replySaved}”</p>
                  </div>
                ) : (
                  <form onSubmit={handleReplySubmit} className="space-y-2.5">
                    <label htmlFor="lantern-reply" className="block text-xs font-semibold text-[#4b604d] dark:text-[#b4c4b6]">
                      Nếu muốn, bạn có thể thả một ngọn đèn nhỏ đáp lại (hoàn toàn ẩn danh):
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="lantern-reply"
                        type="text"
                        maxLength={220}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Ví dụ: Cảm ơn bạn đã nhớ tới mình hôm nay..."
                        className="flex-1 min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3.5 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !replyText.trim()}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold whitespace-nowrap transition"
                      >
                        {isReplying ? 'Đang thả...' : 'Thả ngọn đèn đáp lại'}
                      </button>
                    </div>
                    {replyError && (
                      <p className="text-xs text-[#9b4b38] dark:text-[#e9a392]">{replyError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Opt-out control (always prominent & non-guilting) */}
              <div className="pt-3 border-t border-[#e5e2d5] dark:border-[#2e3d31] flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#eef3ea] dark:bg-[#233126] text-[#243627] dark:text-[#edf2e8] font-semibold inline-flex items-center gap-1.5 hover:border-[#46613e] border border-transparent transition"
                >
                  <span>Thử góc thở 3 phút hoặc viết ẩn danh</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {confirmOptOut ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[#8f4431] dark:text-[#e9a392] font-medium">Xóa lời nhắn này?</span>
                    <button
                      type="button"
                      onClick={() => void handleOptOut()}
                      className="px-3 py-1.5 rounded-lg bg-[#9b4b38] text-white font-semibold"
                    >
                      Đúng, tắt ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmOptOut(false)}
                      className="px-2 py-1 underline"
                    >
                      Thôi
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmOptOut(true)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl text-[#637464] dark:text-[#a6b7a8] hover:text-[#9b4b38] inline-flex items-center gap-1.5 transition"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Không muốn nhận</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
