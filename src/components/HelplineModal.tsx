import React, { useState, useEffect } from 'react';
import type { Helpline } from '../services/api';
import { api } from '../services/api';
import {
  PhoneCall,
  HeartHandshake,
  X,
  Clock,
  MessageSquareHeart,
  Share2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { VI_COPY } from '../i18n/vi';

interface HelplineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelplineModal: React.FC<HelplineModalProps> = ({ isOpen, onClose }) => {
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [lastReviewedAt, setLastReviewedAt] = useState<string>('2025-05-01');
  const [trustedSmsText, setTrustedSmsText] = useState<string>(VI_COPY.supportPrompts.trustedSmsTemplate);
  const [copiedSms, setCopiedSms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getHelplines().then((res) => {
        setHelplines(res.helplines || []);
        if (res.lastReviewedAt) setLastReviewedAt(res.lastReviewedAt);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySms = async () => {
    try {
      await navigator.clipboard.writeText(trustedSmsText);
      setCopiedSms(true);
      window.setTimeout(() => setCopiedSms(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleShareTrusted = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: trustedSmsText });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    window.location.href = `sms:?body=${encodeURIComponent(trustedSmsText)}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="helpline-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/65 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 sm:p-7 shadow-2xl text-[#273829] dark:text-[#edf2e8] space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#f7e7e3] dark:bg-[#3a221d] border border-[#debab0] dark:border-[#784237] flex items-center justify-center text-[#9b3d2b] dark:text-[#e69280] shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3
                id="helpline-modal-title"
                className="font-bold text-lg text-[#243627] dark:text-[#edf2e8] font-serif-healing"
              >
                Nơi nhận hỗ trợ ngay
              </h3>
              <p className="text-xs sm:text-sm text-[#4e624f] dark:text-[#b0c0b2]">
                Bạn không phải giữ những lúc nặng nề này một mình.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e7260] dark:text-[#b0c0b2] hover:text-[#273829] dark:hover:text-[#edf2e8] hover:bg-[#eef1e8] dark:hover:bg-[#243127] transition"
            aria-label="Đóng cửa sổ hỗ trợ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Immediate Honest Guidance */}
        <div className="p-4 rounded-2xl bg-[#fdf3ef] dark:bg-[#341f1b] border border-[#dfc1b8] dark:border-[#784237] text-sm text-[#3d2a25] dark:text-[#f2dcd6] leading-relaxed space-y-1.5">
          <p className="font-semibold text-[#6e2417] dark:text-[#fbd2c9]">
            Nếu bạn đang có nguy cơ tự làm hại bản thân ngay lúc này:
          </p>
          <p>
            Hãy gọi <strong>115</strong> hoặc nhờ một người đang ở gần đưa đến phòng cấp cứu/cơ sở y tế gần nhất. Nếu có thể, hãy mở cửa phòng hoặc ngồi cạnh một người bạn tin tưởng.
          </p>
        </div>

        {/* Option 1: Send message to a trusted person */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcd9cc] dark:border-[#324236] space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#243627] dark:text-[#edf2e8]">
            <MessageSquareHeart className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
            <span>Gửi tin cho người mình tin</span>
          </div>
          <p className="text-xs sm:text-sm text-[#4b604d] dark:text-[#b0c0b2]">
            Khi khó mở lời, bạn có thể dùng mẫu tin nhắn ngắn bên dưới để gửi cho bạn bè hoặc người thân:
          </p>
          <textarea
            rows={2}
            value={trustedSmsText}
            onChange={(e) => setTrustedSmsText(e.target.value)}
            aria-label="Mẫu tin nhắn gửi người thân"
            className="w-full rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] p-3 text-sm text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e] resize-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`sms:?body=${encodeURIComponent(trustedSmsText)}`}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs sm:text-sm font-semibold transition"
            >
              <MessageSquareHeart className="w-4 h-4" />
              <span>Mở ứng dụng Tin nhắn</span>
            </a>

            <button
              type="button"
              onClick={() => void handleShareTrusted()}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#172019] hover:bg-white dark:hover:bg-[#233227] border border-[#cad5c5] dark:border-[#394b3d] text-[#273829] dark:text-[#edf2e8] text-xs sm:text-sm font-medium transition"
            >
              <Share2 className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
              <span>Chia sẻ</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopySms()}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#172019] hover:bg-white dark:hover:bg-[#233227] border border-[#cad5c5] dark:border-[#394b3d] text-[#273829] dark:text-[#edf2e8] text-xs sm:text-sm font-medium transition"
            >
              {copiedSms ? (
                <>
                  <Check className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
                  <span>Sao chép chữ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Helpline List with Honest Verification Metadata */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#243627] dark:text-[#edf2e8]">Các đầu số hỗ trợ tại Việt Nam</h4>
            <span className="text-xs text-[#5e7260] dark:text-[#b0c0b2] tabular-nums">
              Rà soát danh sách: {lastReviewedAt}
            </span>
          </div>

          {helplines.map((hl, i) => {
            const isVerified = hl.verificationStatus === 'verified_official';
            return (
              <div
                key={hl.id || i}
                className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcd9cc] dark:border-[#324236] space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h5 className="text-sm sm:text-base font-bold text-[#243627] dark:text-[#edf2e8]">
                      {hl.name}
                    </h5>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4b604d] dark:text-[#b0c0b2]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{hl.hours}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{hl.free ? 'Miễn cước theo thông tin công bố' : 'Có thể tính cước / viện phí'}</span>
                    </div>
                  </div>

                  <a
                    href={`tel:${hl.phone.replace(/\s+/g, '')}`}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#9b3d2b] hover:bg-[#823020] text-white font-bold text-sm sm:text-base shadow-sm transition shrink-0 tabular-nums"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{hl.phone}</span>
                  </a>
                </div>

                {hl.scope && (
                  <p className="text-xs sm:text-sm text-[#2f4531] dark:text-[#cfe3c9] font-medium">
                    Đối tượng / phạm vi: {hl.scope}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-[#4b604d] dark:text-[#b0c0b2] leading-relaxed">
                  {hl.note}
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5e7260] dark:text-[#b0c0b2] border-t border-[#e2dfd3] dark:border-[#2e3d31]">
                  <span className="inline-flex items-center gap-1">
                    {isVerified ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#46613e] dark:text-[#98c18e]" />
                        <span>Đầu số chính thức đã kiểm tra</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-[#8c6422] dark:text-[#dcb369]" />
                        <span>Chưa xác minh lại giờ trực gần đây — xin kiểm tra khi gọi</span>
                      </>
                    )}
                  </span>
                  {hl.lastUpdated && (
                    <span className="tabular-nums">Cập nhật lần cuối: {hl.lastUpdated}</span>
                  )}
                </div>
              </div>
            );
          })}

          <p className="text-xs text-[#5e7260] dark:text-[#b0c0b2] leading-relaxed">
            Lưu ý trung thực: Heali không vận hành các tổng đài bên thứ ba trên và không thể đảm bảo thời gian chờ nghe máy hoặc chính sách lưu cuộc gọi của từng đơn vị.
          </p>
        </div>

        <div className="pt-3 border-t border-[#e5e2d5] dark:border-[#2e3d31] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#243127] hover:bg-[#e3e7dc] dark:hover:bg-[#2e3d31] text-[#273829] dark:text-[#edf2e8] text-sm font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
