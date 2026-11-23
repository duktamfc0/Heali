import React, { useState, useEffect } from 'react';
import { X, BarChart3, Lock, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api, type QuarterlyReportResponse } from '../services/api';
import type { SupportedLanguage } from '../i18n';

interface QuarterlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  initialTab?: 'report' | 'partner';
}

export const QuarterlyReportModal: React.FC<QuarterlyReportModalProps> = ({
  isOpen,
  onClose,
  language,
  initialTab = 'report',
}) => {
  const [tab, setTab] = useState<'report' | 'partner'>(initialTab);
  const [report, setReport] = useState<QuarterlyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Partner Inquiry state
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'university' | 'company' | 'ngo' | 'community'>('university');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEn = language === 'en';

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api
      .getQuarterlyReport()
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);
    try {
      const res = await api.submitPartnerInquiry({
        orgName: orgName.trim(),
        orgType,
        contactEmail: contactEmail.trim(),
        contactPerson: contactPerson.trim(),
        note: note.trim(),
      });
      setSubmitSuccess(res.privacyGuarantee);
      setOrgName('');
      setContactEmail('');
      setContactPerson('');
      setNote('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể gửi đề xuất hợp tác.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Community Transparency & Organizational Partnerships' : 'Minh bạch cộng đồng & Hợp tác tổ chức'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 sm:p-7 shadow-2xl text-[#273829] dark:text-[#edf2e8] space-y-5">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif-healing">
              {isEn ? 'Community Report & Ethical Partnerships' : 'Báo cáo quý & Hợp tác tổ chức'}
            </h3>
            <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
              {isEn
                ? 'Aggregate transparency without tracking individuals, and sponsorships with zero access to personal journals.'
                : 'Minh bạch số liệu ẩn danh có ngưỡng gộp tối thiểu (>= 5) và tài trợ không đụng chạm dữ liệu riêng tư.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e7260] dark:text-[#b0c0b2] hover:text-[#273829] dark:hover:text-white"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#ecebe0] dark:bg-[#232f26]">
          <button
            type="button"
            onClick={() => setTab('report')}
            className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition ${
              tab === 'report'
                ? 'bg-[#faf7ef] dark:bg-[#2d3d31] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                : 'text-[#576c59] dark:text-[#a6b7a8]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isEn ? 'Quarterly Report' : 'Báo cáo cộng đồng theo quý'}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('partner')}
            className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition ${
              tab === 'partner'
                ? 'bg-[#faf7ef] dark:bg-[#2d3d31] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                : 'text-[#576c59] dark:text-[#a6b7a8]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isEn ? 'Partner Sponsorship' : 'Hợp tác trường học & tổ chức'}</span>
          </button>
        </div>

        {tab === 'report' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#576c59] dark:text-[#b0c0b2]">
                {isEn ? 'Loading aggregate report...' : 'Đang tổng hợp số liệu ẩn danh của quý...'}
              </div>
            ) : report ? (
              <>
                <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#222d25] border border-[#c5d6bf] dark:border-[#374a3a] flex items-start gap-2.5 text-xs sm:text-sm">
                  <Lock className="w-4 h-4 text-[#46613e] dark:text-[#8eb984] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">
                      {isEn ? `Period: ${report.quarter} (${report.periodStart} to ${report.periodEnd})` : `Kỳ báo cáo: ${report.quarter} (${report.periodStart} – ${report.periodEnd})`}
                    </div>
                    <p className="text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">{report.privacyGuarantee}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: isEn ? 'Calm tools completed' : 'Lượt hoàn thành công cụ Dịu lại',
                      metric: report.metrics.calmToolsCompleted,
                    },
                    {
                      label: isEn ? 'Public lake lanterns floated' : 'Ngọn đèn thả lên hồ chung',
                      metric: report.metrics.lanternsFloated,
                    },
                    {
                      label: isEn ? 'Anonymous lantern gifts sent' : 'Liên kết "Gửi ngọn đèn" đã tạo',
                      metric: report.metrics.sharedGiftsCreated,
                    },
                    {
                      label: isEn ? 'Approved community posts' : 'Chia sẻ cộng đồng đã duyệt an toàn',
                      metric: report.metrics.approvedConfessions,
                    },
                    {
                      label: isEn ? 'Intentions on Wish Tree' : 'Lời nhắn trên Cây ước',
                      metric: report.metrics.wishesHung,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-between gap-3"
                    >
                      <span className="text-xs sm:text-sm font-medium text-[#3c4f3e] dark:text-[#cbd6cc]">
                        {item.label}
                      </span>
                      <span className="text-lg font-bold font-serif-healing tabular-nums text-[#243627] dark:text-[#edf2e8]">
                        {item.metric.display}
                      </span>
                    </div>
                  ))}

                  <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-medium text-[#3c4f3e] dark:text-[#cbd6cc]">
                      {isEn ? '"Slightly lighter today" feedback' : 'Phản hồi "nhẹ hơn một chút"'}
                    </span>
                    <span className="text-sm font-bold text-[#46613e] dark:text-[#8eb984]">
                      {report.metrics.feelingLighterSampleMet && report.metrics.feelingLighterPct !== null
                        ? `${report.metrics.feelingLighterPct}%`
                        : isEn
                        ? `< ${report.anonymityThreshold} responses`
                        : `< ${report.anonymityThreshold} mẫu (đang ẩn)`}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#576c59]">
                {isEn ? 'Quarterly report temporarily unavailable.' : 'Hiện chưa thể tải báo cáo quý.'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#222d25] border border-[#c5d6bf] dark:border-[#374a3a] flex items-start gap-2.5 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-[#46613e] dark:text-[#8eb984] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">
                  {isEn
                    ? 'Strict Firewall Between Sponsors and User Data'
                    : 'Ranh giới tuyệt đối: Tổ chức tài trợ không thấy dữ liệu cá nhân'}
                </div>
                <p className="text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">
                  {isEn
                    ? 'Universities, workplaces, or NGOs can sponsor moderation shifts or wellness spaces — without ever receiving access to individual student/employee journals, moods, or identities.'
                    : 'Trường đại học, tổ chức xã hội hoặc doanh nghiệp có thể tài trợ chi phí trực kiểm duyệt hoặc góc tĩnh tại cho thành viên — nhưng tuyệt đối không được cấp quyền xem nhật ký, tâm trạng hay danh tính bất kỳ cá nhân nào.'}
                </p>
              </div>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-[#e6efe2] dark:bg-[#2a3b2d] border border-[#bfd2b9] dark:border-[#46613e] text-xs sm:text-sm space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#274224] dark:text-[#cfe3c9]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEn ? 'Inquiry received' : 'Đã ghi nhận thông tin hợp tác'}</span>
                </div>
                <p className="text-[#354c38] dark:text-[#dce5da]">{submitSuccess}</p>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-xl bg-[#f7e7e3] dark:bg-[#3a221d] border border-[#dfc0b4] text-xs text-[#8f4431] dark:text-[#f2c3b7]">
                {submitError}
              </div>
            )}

            <form onSubmit={handlePartnerSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {isEn ? 'Organization / School name' : 'Tên trường / tổ chức *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={isEn ? 'e.g. Student Counseling Center' : 'Ví dụ: CLB Tâm lý Sinh viên'}
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {isEn ? 'Organization type' : 'Loại hình đơn vị'}
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as typeof orgType)}
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 py-2"
                  >
                    <option value="university">{isEn ? 'University / School' : 'Trường học / Phòng tham vấn'}</option>
                    <option value="ngo">{isEn ? 'NGO / Social Work' : 'Tổ chức phi lợi nhuận / Xã hội'}</option>
                    <option value="company">{isEn ? 'Workplace / Employer' : 'Doanh nghiệp / Nơi làm việc'}</option>
                    <option value="community">{isEn ? 'Community group' : 'Nhóm / Cộng đồng'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {isEn ? 'Work email *' : 'Email liên hệ *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@organization.org"
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {isEn ? 'Contact person (optional)' : 'Người đại diện (tùy chọn)'}
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isEn ? 'How would you like to collaborate? *' : 'Nội dung đề xuất hợp tác *'}
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={10}
                  maxLength={800}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    isEn
                      ? 'Describe your proposed sponsorship or community workshop without requesting personal user data...'
                      : 'Mô tả ngắn hướng hợp tác phi lợi nhuận, tài trợ ca trực kiểm duyệt hoặc góc nghỉ cho sinh viên/nhân sự...'
                  }
                  className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-50 text-white font-semibold transition"
              >
                {submitting
                  ? isEn
                    ? 'Submitting...'
                    : 'Đang gửi...'
                  : isEn
                  ? 'Submit inquiry'
                  : 'Gửi đề xuất hợp tác minh bạch'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
