import React, { useState } from 'react';
import { ShieldCheck, Lock, Download, Trash2, CheckCircle2, Moon, Zap, BarChart2, Globe, Sparkles, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { getCopy, type SupportedLanguage } from '../i18n';

interface PrivacyAndSafetyViewProps {
  theme: 'light' | 'dark';
  lowMotion: boolean;
  analyticsOptOut: boolean;
  language?: SupportedLanguage;
  aiCompanionEnabled?: boolean;
  onToggleTheme: () => void;
  onToggleLowMotion: () => void;
  onToggleAnalyticsOptOut: () => void;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  onToggleAiCompanion?: () => void;
  onOpenQuarterlyReport?: () => void;
  onOpenPartnerInquiry?: () => void;
  onOpenProfileModal: () => void;
  onOpenHelplineModal: () => void;
  onReopenOnboarding: () => void;
}

export const PrivacyAndSafetyView: React.FC<PrivacyAndSafetyViewProps> = ({
  theme,
  lowMotion,
  analyticsOptOut,
  language = 'vi',
  aiCompanionEnabled = false,
  onToggleTheme,
  onToggleLowMotion,
  onToggleAnalyticsOptOut,
  onChangeLanguage,
  onToggleAiCompanion,
  onOpenQuarterlyReport,
  onOpenPartnerInquiry,
  onOpenProfileModal,
  onOpenHelplineModal,
  onReopenOnboarding,
}) => {
  const copy = getCopy(language);
  const isEn = language === 'en';
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = feedbackNote.trim();
    if (!cleaned) return;
    setFeedbackSubmitting(true);
    try {
      await api.submitBetaFeedback(cleaned, 'general');
    } catch {
      try {
        const existing = JSON.parse(localStorage.getItem('heali_beta_feedback_local') || '[]');
        existing.unshift({ note: cleaned, createdAt: new Date().toISOString() });
        localStorage.setItem('heali_beta_feedback_local', JSON.stringify(existing.slice(0, 20)));
      } catch {
        // ignore storage errors
      }
    } finally {
      setFeedbackSubmitting(false);
    }
    setFeedbackNote('');
    setFeedbackSubmitted(true);
    window.setTimeout(() => setFeedbackSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6 text-[#273829] dark:text-[#edf2e8]">
      {/* Header */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-8 shadow-sm space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-healing text-[#243627] dark:text-[#edf2e8]">
          Quyền riêng tư &amp; An toàn trên Heali
        </h1>
        <p className="text-base text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed max-w-2xl">
          Viết bằng ngôn ngữ dễ hiểu — không điều khoản pháp lý đánh đố. Dữ liệu cảm xúc là vùng nhạy cảm, nên quyền kiểm soát luôn nằm trong tay bạn.
        </p>
      </div>

      {/* Accessibility, Reading Comfort & Metrics Opt-Out Switches */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-serif-healing">Tùy chỉnh giao diện, tiết kiệm pin &amp; quyền đo lường</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="min-h-[56px] p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-between gap-3 text-left transition"
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-[#46613e] dark:text-[#7aa370] shrink-0" />
              <div>
                <div className="text-sm sm:text-base font-semibold">Chế độ nền dịu ban đêm</div>
                <div className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
                  {theme === 'dark' ? 'Đang bật nền tối dịu mắt' : 'Đang dùng nền kem ấm mặc định'}
                </div>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[#46613e] dark:text-[#8eb984] shrink-0">
              {theme === 'dark' ? 'Bật' : 'Tắt'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleLowMotion}
            className="min-h-[56px] p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-between gap-3 text-left transition"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#46613e] dark:text-[#7aa370] shrink-0" />
              <div>
                <div className="text-sm sm:text-base font-semibold">Chế độ nhẹ (giảm chuyển động)</div>
                <div className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
                  Đóng băng hiệu ứng thời tiết, hợp máy yếu hoặc 3G/4G
                </div>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[#46613e] dark:text-[#8eb984] shrink-0">
              {lowMotion ? 'Bật' : 'Tắt'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleAnalyticsOptOut}
            className="min-h-[56px] p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-between gap-3 text-left transition"
          >
            <div className="flex items-center gap-3">
              <BarChart2 className="w-5 h-5 text-[#46613e] dark:text-[#7aa370] shrink-0" />
              <div>
                <div className="text-sm sm:text-base font-semibold">Từ chối thống kê tổng hợp</div>
                <div className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
                  {analyticsOptOut
                    ? 'Đang tắt hoàn toàn — không gửi số đếm ẩn danh'
                    : 'Chỉ đếm tổng hợp công cụ hữu ích (không lưu chữ hay tên)'}
                </div>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[#46613e] dark:text-[#8eb984] shrink-0">
              {analyticsOptOut ? (isEn ? 'Off' : 'Đã tắt') : (isEn ? 'Allowed' : 'Cho phép')}
            </span>
          </button>
        </div>

        {(onChangeLanguage || onToggleAiCompanion || onOpenQuarterlyReport || onOpenPartnerInquiry) && (
          <div className="pt-2 border-t border-[#e5e2d5] dark:border-[#2e3d31] flex flex-wrap items-center gap-2.5">
            {onChangeLanguage && (
              <button
                type="button"
                onClick={() => onChangeLanguage(language === 'vi' ? 'en' : 'vi')}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
                <span>{isEn ? 'Language: English (Switch to Tiếng Việt)' : 'Ngôn ngữ: Tiếng Việt (Chuyển sang English)'}</span>
              </button>
            )}

            {onToggleAiCompanion && (
              <button
                type="button"
                onClick={onToggleAiCompanion}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
                <span>
                  {aiCompanionEnabled
                    ? isEn
                      ? 'AI Reflective Mirror: ON (Click to turn off)'
                      : 'Gương phản chiếu AI: Đang mở (Bấm để tắt ngay)'
                    : isEn
                    ? 'AI Reflective Mirror: OFF'
                    : 'Gương phản chiếu AI: Đang tắt mặc định'}
                </span>
              </button>
            )}

            {onOpenQuarterlyReport && (
              <button
                type="button"
                onClick={onOpenQuarterlyReport}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#eef3ea] dark:bg-[#223125] border border-[#c5d6bf] dark:border-[#374a3a] text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
                <span>{isEn ? 'Quarterly Community Report' : 'Báo cáo cộng đồng theo quý'}</span>
              </button>
            )}

            {onOpenPartnerInquiry && (
              <button
                type="button"
                onClick={onOpenPartnerInquiry}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#eef3ea] dark:bg-[#223125] border border-[#c5d6bf] dark:border-[#374a3a] text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
                <span>{isEn ? 'Organizational Partnerships' : 'Hợp tác tổ chức & Trường học'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Plain Language Data Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
            <Lock className="w-5 h-5 text-[#46613e] dark:text-[#7aa370]" />
            <span>Dữ liệu được lưu ở đâu &amp; ai thấy?</span>
          </div>
          <ul className="space-y-2.5 text-base text-[#3c4f3e] dark:text-[#cbd6cc] leading-relaxed">
            <li>• <strong>Nhật ký, Thư chưa gửi &amp; Check-in tâm trạng:</strong> riêng tư của bạn, được mã hóa AES-256-GCM trước khi lưu vào cơ sở dữ liệu. Không ai khác xem được.</li>
            <li>• <strong>Tâm tình &amp; Hoa đăng:</strong> hiển thị công khai dưới biệt danh ẩn danh do bạn tự đặt. Bài viết có dấu hiệu tự hại sẽ được giữ lại rà soát an toàn thay vì công khai ngay.</li>
            <li>• <strong>Không quảng cáo &amp; không bán dữ liệu:</strong> Heali không nhúng tracker quảng cáo và không dùng bài viết của bạn để huấn luyện mô hình AI.</li>
            <li>• <strong>Đo lường lành mạnh (Opt-out):</strong> chỉ đếm tỷ lệ hoàn thành bài thở hay thẻ hỗ trợ (không gắn tên người dùng hay câu chữ). Bạn có thể tắt hoàn toàn ngay phía trên.</li>
          </ul>
        </div>

        <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
            <ShieldCheck className="w-5 h-5 text-[#9b3d2b]" />
            <span>Quyền tự chủ &amp; An toàn khủng hoảng</span>
          </div>
          <p className="text-base text-[#3c4f3e] dark:text-[#cbd6cc] leading-relaxed">
            Bạn có thể bật mã khóa PIN, tạo mã khôi phục sang máy mới, xuất toàn bộ dữ liệu thành tệp JSON, hoặc xóa vĩnh viễn tài khoản ngay lập tức.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>PIN, Xuất dữ liệu &amp; Xóa tài khoản</span>
            </button>
            <button
              type="button"
              onClick={onOpenHelplineModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#9b3d2b] hover:bg-[#823020] text-white text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Xem đường dây hỗ trợ</span>
            </button>
            <button
              type="button"
              onClick={onReopenOnboarding}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-sm font-medium inline-flex items-center gap-2 transition"
            >
              <span>Xem lại hướng dẫn đầu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Closed Beta / Public Feedback */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <Trash2 className="w-4 h-4 text-[#46613e] dark:text-[#7aa370] hidden" />
          <span>Góp ý ẩn danh cho nhóm phát triển</span>
        </div>
        <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
          {copy.betaNotice}
        </p>

        {feedbackSubmitted && (
          <div className="p-3 rounded-xl bg-[#e6efe2] dark:bg-[#2a3b2d] border border-[#bfd2b9] dark:border-[#46613e] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#46613e] dark:text-[#7aa370]" />
            <span>Đã ghi nhận góp ý ẩn danh (không gắn tài khoản). Cảm ơn bạn đã chia sẻ thẳng thắn.</span>
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={feedbackNote}
            onChange={(e) => setFeedbackNote(e.target.value)}
            maxLength={500}
            placeholder="Ví dụ: chữ ở mục nào khó đọc, câu từ nào làm bạn thấy nặng hơn..."
            className="flex-1 min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3.5 py-2 text-base text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e]"
          />
          <button
            type="submit"
            disabled={feedbackSubmitting}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-50 text-white text-sm font-semibold transition shrink-0"
          >
            {feedbackSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}
          </button>
        </form>
      </div>
    </div>
  );
};
