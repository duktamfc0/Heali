import React, { useState } from 'react';
import { api, type SharedLanternGift } from '../services/api';
import { X, Sparkles, Copy, Check, Eye, Flame, ExternalLink } from 'lucide-react';

interface SendLanternGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAlias?: string;
  onOpenPreviewLink?: (token: string) => void;
}

const COLOR_OPTIONS: Array<{
  id: 'gold' | 'pink' | 'lavender' | 'moon';
  label: string;
  swatch: string;
}> = [
  { id: 'gold', label: 'Vàng ấm', swatch: 'bg-[#d8a74a]' },
  { id: 'pink', label: 'Hồng dịu', swatch: 'bg-[#cf7b80]' },
  { id: 'lavender', label: 'Tím sương', swatch: 'bg-[#8f7fb3]' },
  { id: 'moon', label: 'Trắng trăng', swatch: 'bg-[#cfd7c9]' },
];

export const SendLanternGiftModal: React.FC<SendLanternGiftModalProps> = ({
  isOpen,
  onClose,
  defaultAlias = '',
  onOpenPreviewLink,
}) => {
  const [message, setMessage] = useState('');
  const [color, setColor] = useState<'gold' | 'pink' | 'lavender' | 'moon'>('gold');
  const [showSenderName, setShowSenderName] = useState(false);
  const [senderAlias, setSenderAlias] = useState(defaultAlias);
  const [expiryDays, setExpiryDays] = useState(14);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdGift, setCreatedGift] = useState<SharedLanternGift | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullShareUrl = createdGift
    ? `${window.location.origin}/den/${createdGift.id}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Hãy viết một lời nhắn ngắn dịu dàng gửi bạn ấy nhé.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const gift = await api.createLanternGift({
        message: message.trim(),
        color,
        showSenderName,
        senderAlias: senderAlias.trim(),
        expiryDays,
      });
      setCreatedGift(gift);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tạo liên kết ngọn đèn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!fullShareUrl) return;
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback ignored; URL stays visible for manual copy
    }
  };

  const handleResetAndClose = () => {
    setCreatedGift(null);
    setMessage('');
    setErrorMsg(null);
    setCopied(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-lantern-title"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 text-[#273829] dark:text-[#edf2e8] shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#46613e] dark:text-[#98c18e]">
              <Flame className="w-4 h-4" />
              <span>Chia sẻ lành mạnh · Không lộ dữ liệu riêng</span>
            </div>
            <h2 id="send-lantern-title" className="text-xl font-bold font-serif-healing">
              Gửi một ngọn đèn cho người bạn đang buồn
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e7260] dark:text-[#a6b7a8] hover:bg-[#ecebe0] dark:hover:bg-[#243227]"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdGift ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#233126] border border-[#c7d6c0] dark:border-[#3c5240] space-y-2">
              <div className="text-sm font-bold text-[#243627] dark:text-[#edf2e8] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
                <span>Đã thắp sẵn một liên kết ngọn đèn riêng</span>
              </div>
              <p className="text-xs text-[#4b604d] dark:text-[#b4c4b6] leading-relaxed">
                Người nhận mở link sẽ thấy ngọn đèn và lời nhắn bên dưới mà <strong>không cần đăng ký tài khoản</strong>. Họ cũng có nút tắt ngay nếu không muốn xem.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] space-y-2">
              <div className="text-xs font-semibold text-[#576c59] dark:text-[#a6b7a8]">
                Liên kết ngọn đèn (hết hạn sau {expiryDays} ngày):
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullShareUrl}
                  aria-label="Liên kết ngọn đèn"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] text-xs font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {onOpenPreviewLink && (
                <button
                  type="button"
                  onClick={() => {
                    const token = createdGift.id;
                    handleResetAndClose();
                    onOpenPreviewLink(token);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem thử trang người nhận</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleResetAndClose}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#46613e] text-white text-xs font-semibold ml-auto"
              >
                Xong
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="gift-message" className="block text-xs font-semibold">
                Lời nhắn ngắn gửi bạn ấy (tối đa 240 ký tự)
              </label>
              <textarea
                id="gift-message"
                rows={3}
                maxLength={240}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ví dụ: Hôm nay biết bạn vừa trải qua ngày dài. Nếu mệt quá cứ nghỉ một nhịp, mình vẫn ở đây."
                className="w-full rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-sm leading-relaxed focus:outline-none focus:border-[#46613e] resize-none"
              />
              <div className="text-[11px] text-[#5e7260] dark:text-[#a6b7a8] text-right tabular-nums">
                {message.length}/240
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-semibold mb-1.5">Ánh sáng ngọn đèn</span>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setColor(opt.id)}
                      className={`min-h-[36px] px-2.5 py-1 rounded-xl border text-xs inline-flex items-center gap-1.5 transition ${
                        color === opt.id
                          ? 'bg-[#e6efe2] dark:bg-[#2a3b2d] border-[#46613e] font-semibold'
                          : 'bg-[#f1efe5] dark:bg-[#232f26] border-[#dcdad0] dark:border-[#324236]'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${opt.swatch}`} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="gift-expiry" className="block text-xs font-semibold mb-1.5">
                  Liên kết tự hết hạn sau
                </label>
                <select
                  id="gift-expiry"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full min-h-[38px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 text-xs"
                >
                  <option value={7}>7 ngày</option>
                  <option value={14}>14 ngày (khuyên dùng)</option>
                  <option value={30}>30 ngày</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSenderName}
                  onChange={(e) => setShowSenderName(e.target.checked)}
                  className="rounded border-[#9eb198] text-[#46613e] focus:ring-0"
                />
                <span>Hiện tên bạn muốn để lại (mặc định là ẩn danh)</span>
              </label>

              {showSenderName && (
                <input
                  type="text"
                  maxLength={32}
                  value={senderAlias}
                  onChange={(e) => setSenderAlias(e.target.value)}
                  placeholder="Tên hoặc biệt danh ngắn (không điền SĐT)..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] text-xs"
                />
              )}
            </div>

            {/* Preview Box before sharing (Section 8.3 mandatory privacy safeguard) */}
            <div className="p-4 rounded-2xl bg-[#edf3e9] dark:bg-[#1e2a20] border border-[#c5d6bf] dark:border-[#374a3a] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d452a] dark:text-[#cfe3c9]">
                <Eye className="w-3.5 h-3.5" />
                <span>Bạn muốn chia sẻ gì? (Xem trước nội dung chính xác sẽ hiện)</span>
              </div>
              <p className="text-xs text-[#4b604d] dark:text-[#b4c4b6]">
                Người mở link chỉ thấy câu: “{message.trim() || '...'}”
                {showSenderName && senderAlias.trim() ? ` — từ ${senderAlias.trim()}` : ' (ẩn danh)'}. Hoàn toàn <strong>không chứa nhật ký, tâm trạng hay tài khoản</strong> của bạn.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#f7e7e3] dark:bg-[#38231e] border border-[#dfbeb6] dark:border-[#5e382f] text-xs text-[#8f4431] dark:text-[#f0b4a5]">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-xs font-semibold"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                {isSubmitting ? 'Đang tạo liên kết...' : 'Tạo link ngọn đèn (tối đa 5/24h)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
