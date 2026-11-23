import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  type AdminAuthStatus,
  type HealthyMetricsResponse,
  type ModerationAuditLog,
  type ModerationOverview,
  type ModerationQueueItem,
  type ModerationActionType,
} from '../services/api';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Power,
  RefreshCw,
  Ban,
  Clock,
  ArrowLeft,
  Coffee,
  History,
  BarChart2,
} from 'lucide-react';

interface ModerationAdminPortalProps {
  onExitAdmin: () => void;
}

const ACTION_LABEL: Record<string, string> = {
  approve_public: 'Duyệt công khai',
  approve_with_tw: 'Duyệt kèm làm mờ TW',
  hide_post: 'Giữ ẩn / Gỡ khỏi công khai',
  mark_safety_outreach: 'Đã đánh dấu hỗ trợ an toàn',
  ban_author: 'Khóa tài khoản vi phạm',
  dismiss_report: 'Bỏ qua báo cáo',
};

const SOURCE_LABEL: Record<string, string> = {
  confession: 'Tâm tình (Tự động giữ)',
  confession_report: 'Báo cáo Tâm tình',
  stranger_chat: 'Báo cáo Chat 1:1',
  lounge_message: 'Báo cáo Phòng trà',
  lantern: 'Hoa đăng (Rủi ro)',
  wish: 'Cây ước (Rủi ro)',
};

export const ModerationAdminPortal: React.FC<ModerationAdminPortalProps> = ({ onExitAdmin }) => {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => api.hasAdminToken());
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [moderatorAlias, setModeratorAlias] = useState('Điều phối viên trực');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [overview, setOverview] = useState<ModerationOverview | null>(null);
  const [queueTab, setQueueTab] = useState<'pending' | 'resolved' | 'metrics'>('pending');
  const [queueItems, setQueueItems] = useState<ModerationQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([]);
  const [metricsData, setMetricsData] = useState<HealthyMetricsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Content reveal + moderator fatigue safeguard
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [notesByItem, setNotesByItem] = useState<Record<string, string>>({});
  const [confirmBanId, setConfirmBanId] = useState<string | null>(null);
  const [reviewedHeavyCount, setReviewedHeavyCount] = useState(0);

  // Shift form controls
  const [shiftNoteInput, setShiftNoteInput] = useState('');
  const [slaMinutesInput, setSlaMinutesInput] = useState('15');
  const [togglingShift, setTogglingShift] = useState(false);

  useEffect(() => {
    api
      .getAdminStatus()
      .then(setAuthStatus)
      .catch(() => setAuthStatus({ envConfigured: false, needsBootstrap: false }));
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!api.hasAdminToken()) {
      setIsAuthenticated(false);
      return;
    }
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const targetQueueStatus = queueTab === 'resolved' ? 'resolved' : 'pending';
      const [ov, items, logs, metrics] = await Promise.all([
        api.getAdminOverview(),
        api.getModerationQueue(targetQueueStatus),
        api.getModerationAuditLogs(),
        api.getAdminMetrics(),
      ]);
      setOverview(ov);
      setQueueItems(items);
      setAuditLogs(logs);
      setMetricsData(metrics);
      setSlaMinutesInput(String(ov.gate.slaTargetMinutes || 15));
    } catch (err) {
      if (err instanceof Error && err.message === 'ADMIN_UNAUTHORIZED') {
        setIsAuthenticated(false);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Không thể tải dữ liệu hàng đợi.');
      }
    } finally {
      setLoadingData(false);
    }
  }, [queueTab]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadDashboard();
    }
  }, [isAuthenticated, loadDashboard]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authStatus?.needsBootstrap) {
        if (passcode.trim().length < 8) {
          setAuthError('Mã khóa lần đầu cần tối thiểu 8 ký tự.');
          setAuthLoading(false);
          return;
        }
        if (passcode !== confirmPasscode) {
          setAuthError('Hai lần nhập mã khóa chưa khớp nhau.');
          setAuthLoading(false);
          return;
        }
        await api.bootstrapAdmin(passcode.trim(), moderatorAlias.trim() || 'Điều phối viên chính');
        setAuthStatus({ envConfigured: false, needsBootstrap: false });
      } else {
        await api.loginAdmin(passcode.trim(), moderatorAlias.trim() || 'Điều phối viên trực');
      }
      setPasscode('');
      setConfirmPasscode('');
      setIsAuthenticated(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Xác thực thất bại.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logoutAdmin();
    setIsAuthenticated(false);
    setOverview(null);
    setQueueItems([]);
  };

  const handleResolve = async (item: ModerationQueueItem, action: ModerationActionType) => {
    setErrorMsg(null);
    setActionMsg(null);
    try {
      await api.resolveModerationItem(item.id, action, notesByItem[item.id] || '');
      if (item.riskLevel >= 2) {
        setReviewedHeavyCount((c) => c + 1);
      }
      setConfirmBanId(null);
      setActionMsg(`Đã xử lý mục #${item.id.slice(0, 8)} bằng thao tác "${ACTION_LABEL[action] || action}".`);
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể xử lý mục này.');
    }
  };

  const handleToggleShift = async (nextStatus: 'active' | 'paused') => {
    setTogglingShift(true);
    setErrorMsg(null);
    setActionMsg(null);
    try {
      const gate = await api.toggleModerationShift({
        status: nextStatus,
        moderatorAlias: overview?.moderatorAlias || moderatorAlias,
        slaTargetMinutes: Math.max(5, Math.min(120, Number(slaMinutesInput) || 15)),
        note: shiftNoteInput.trim(),
      });
      setShiftNoteInput('');
      setActionMsg(
        gate.communityOpen
          ? 'Đã mở ca trực kiểm duyệt — các tính năng cộng đồng đang hoạt động.'
          : 'Đã tạm đóng cộng đồng ngoài ca trực để đảm bảo an toàn.'
      );
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể cập nhật ca trực.');
    } finally {
      setTogglingShift(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5ee] dark:bg-[#131914] text-[#273829] dark:text-[#edf2e8] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Bar */}
        <header className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#46613e] dark:text-[#98c18e]">
              <ShieldCheck className="w-4 h-4" />
              <span>Heali Internal Operations · Cổng Kiểm Duyệt</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif-healing text-[#243627] dark:text-[#f2f6ee]">
              Điều phối An toàn Cộng đồng
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExitAdmin}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#243027] hover:bg-[#e3e8da] dark:hover:bg-[#2c3b30] text-xs font-semibold inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về ứng dụng người dùng</span>
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#f7e7e3] dark:bg-[#38231e] text-[#9b4b38] dark:text-[#e9a392] text-xs font-semibold inline-flex items-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất ca trực</span>
              </button>
            )}
          </div>
        </header>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#e6efe2] dark:bg-[#263629] flex items-center justify-center text-[#46613e] dark:text-[#98c18e]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-serif-healing">
                  {authStatus?.needsBootstrap
                    ? 'Thiết lập mã khóa điều phối lần đầu'
                    : 'Đăng nhập Điều phối viên'}
                </h2>
                <p className="text-xs text-[#576c59] dark:text-[#a6b7a8]">
                  {authStatus?.needsBootstrap
                    ? 'Biến môi trường HEALI_ADMIN_PASSCODE chưa đặt; hãy tạo mã khóa riêng để kích hoạt cổng trực.'
                    : 'Phiên đăng nhập lưu hoàn toàn trong bộ nhớ, tự hết hạn khi đóng tab.'}
                </p>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-[#f7e7e3] dark:bg-[#38231e] border border-[#dfbeb6] dark:border-[#5e382f] text-xs text-[#8f4431] dark:text-[#f0b4a5]">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tên hiển thị trong nhật ký trực</label>
                <input
                  type="text"
                  value={moderatorAlias}
                  onChange={(e) => setModeratorAlias(e.target.value)}
                  required
                  maxLength={40}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] text-sm focus:outline-none focus:border-[#46613e]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  {authStatus?.needsBootstrap ? 'Tạo mã khóa mới (tối thiểu 8 ký tự)' : 'Mã truy cập điều phối viên'}
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Nhập mã khóa bảo mật..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] text-sm focus:outline-none focus:border-[#46613e]"
                />
              </div>

              {authStatus?.needsBootstrap && (
                <div>
                  <label className="block font-semibold mb-1">Xác nhận lại mã khóa</label>
                  <input
                    type="password"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    required
                    placeholder="Nhập lại mã khóa..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] text-sm focus:outline-none focus:border-[#46613e]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full min-h-[48px] rounded-2xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-50 text-white text-sm font-semibold transition"
              >
                {authLoading
                  ? 'Đang xác thực...'
                  : authStatus?.needsBootstrap
                  ? 'Lưu mã khóa & Mở cổng trực'
                  : 'Mở bảng điều phối'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Moderator Fatigue Care Reminder */}
            {reviewedHeavyCount >= 5 && (
              <div className="rounded-2xl bg-[#eef3ea] dark:bg-[#223024] border border-[#bfd2b8] dark:border-[#3e5642] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Coffee className="w-5 h-5 text-[#46613e] dark:text-[#98c18e] shrink-0" />
                  <span>
                    Bạn đã xử lý liên tiếp <strong>{reviewedHeavyCount}</strong> nội dung nặng về tinh thần trong ca này. Hãy uống ngụm nước hoặc nghỉ 5 phút trước khi tiếp tục nhé.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewedHeavyCount(0)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#18211a] border border-[#c3d3bd] dark:border-[#3e5642] font-semibold"
                >
                  Mình đã nghỉ một nhịp
                </button>
              </div>
            )}

            {/* Queue Overload Safeguard Notice */}
            {overview?.gate.queueOverloaded && (
              <div className="rounded-2xl bg-[#f9ece8] dark:bg-[#32201d] border border-[#e3b9af] dark:border-[#603932] p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#7a3121] dark:text-[#f2c6bc]">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>
                    <strong>Cảnh báo quá tải hàng đợi ({overview.gate.pendingModerationCount} mục chờ):</strong> Cộng đồng đã tự bật thông báo chế độ chậm. Có thể cân nhắc “Đóng ca &amp; Tạm nghỉ” cho cộng đồng đến khi giải tỏa xong Mức 3 &amp; Mức 2.
                  </span>
                </div>
              </div>
            )}

            {actionMsg && (
              <div className="rounded-2xl bg-[#e6efe2] dark:bg-[#223224] border border-[#bfd2b8] dark:border-[#3a523e] p-3.5 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#46613e] dark:text-[#98c18e] shrink-0" />
                <span>{actionMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-2xl bg-[#f7e7e3] dark:bg-[#38231e] border border-[#dfbeb6] dark:border-[#5e382f] p-3.5 text-xs font-medium text-[#8f4431] dark:text-[#f0b4a5]">
                {errorMsg}
              </div>
            )}

            {/* Overview Metrics + Shift Gate Controller */}
            {overview && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-[#f9ece8] dark:bg-[#32201d] border border-[#e3b9af] dark:border-[#603932] p-4">
                    <div className="text-[11px] font-semibold text-[#8f4431] dark:text-[#e8a496]">Mức 3 · Khẩn</div>
                    <div className="text-2xl font-bold tabular-nums mt-1 text-[#7a3121] dark:text-[#f8d0c8]">
                      {overview.counts.level3Pending}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#f8f1e2] dark:bg-[#2e291d] border border-[#e2cfab] dark:border-[#5a4f36] p-4">
                    <div className="text-[11px] font-semibold text-[#7a5d2e] dark:text-[#e1c68f]">Mức 2 · Rủi ro</div>
                    <div className="text-2xl font-bold tabular-nums mt-1 text-[#5e461f] dark:text-[#f6e3ba]">
                      {overview.counts.level2Pending}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-4">
                    <div className="text-[11px] font-semibold text-[#576c59] dark:text-[#a6b7a8]">Báo cáo user</div>
                    <div className="text-2xl font-bold tabular-nums mt-1">
                      {overview.counts.reportsPending}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-4">
                    <div className="text-[11px] font-semibold text-[#576c59] dark:text-[#a6b7a8]">Xử lý hôm nay</div>
                    <div className="text-2xl font-bold tabular-nums mt-1 text-[#46613e] dark:text-[#98c18e]">
                      {overview.counts.resolvedTodayCount}
                    </div>
                  </div>
                </div>

                {/* Real Shift Gate Toggle */}
                <div className="lg:col-span-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Power className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
                      <span>Cổng trực Cộng đồng</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        overview.gate.communityOpen
                          ? 'bg-[#e6efe2] dark:bg-[#223526] text-[#2c5029] dark:text-[#a7d69d]'
                          : 'bg-[#f7e7e3] dark:bg-[#38231e] text-[#8f4431] dark:text-[#e9a392]'
                      }`}
                    >
                      {overview.gate.communityOpen ? 'Đang mở ca trực' : 'Đang tạm đóng'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#576c59] dark:text-[#a6b7a8] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Người trực: <strong>{overview.gate.moderatorAlias || overview.moderatorAlias}</strong> · SLA mục tiêu {overview.gate.slaTargetMinutes} phút
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={shiftNoteInput}
                      onChange={(e) => setShiftNoteInput(e.target.value)}
                      placeholder="Ghi chú ca trực (tùy chọn)..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] text-xs"
                    />
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={slaMinutesInput}
                      onChange={(e) => setSlaMinutesInput(e.target.value)}
                      title="SLA mục tiêu (phút)"
                      className="w-16 px-2.5 py-2 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] text-xs tabular-nums text-center"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={togglingShift || overview.gate.communityOpen}
                      onClick={() => void handleToggleShift('active')}
                      className="flex-1 min-h-[42px] rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-45 text-white text-xs font-semibold transition"
                    >
                      Mở ca &amp; Cộng đồng
                    </button>
                    <button
                      type="button"
                      disabled={togglingShift || !overview.gate.communityOpen}
                      onClick={() => void handleToggleShift('paused')}
                      className="flex-1 min-h-[42px] rounded-xl bg-[#9b4b38] hover:bg-[#823c2b] disabled:opacity-45 text-white text-xs font-semibold transition"
                    >
                      Đóng ca &amp; Tạm nghỉ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Queue Controls */}
            <section className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-[#f1efe5] dark:bg-[#232e25] p-1 rounded-xl border border-[#dcd9cc] dark:border-[#324236]">
                  <button
                    type="button"
                    onClick={() => setQueueTab('pending')}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      queueTab === 'pending'
                        ? 'bg-[#46613e] text-white'
                        : 'text-[#576c59] dark:text-[#a6b7a8]'
                    }`}
                  >
                    Chờ xử lý ({overview?.counts.totalPending ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('resolved')}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      queueTab === 'resolved'
                        ? 'bg-[#46613e] text-white'
                        : 'text-[#576c59] dark:text-[#a6b7a8]'
                    }`}
                  >
                    Đã xử lý gần đây
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('metrics')}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                      queueTab === 'metrics'
                        ? 'bg-[#46613e] text-white'
                        : 'text-[#576c59] dark:text-[#a6b7a8]'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Chỉ số lành mạnh (8.4)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  disabled={loadingData}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#eef1e8] dark:bg-[#243027] text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {queueTab === 'metrics' ? (
                <div className="space-y-5">
                  <p className="text-xs text-[#576c59] dark:text-[#a6b7a8] leading-relaxed">
                    Thống kê tổng hợp ẩn danh 30 ngày gần nhất (không lưu nội dung người viết, không đếm thời gian ở lại hay chuỗi ngày).
                  </p>
                  {metricsData ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-2xl bg-[#f1efe5] dark:bg-[#222c24] border border-[#dcd9cc] dark:border-[#324236] p-4">
                          <div className="text-[11px] text-[#576c59] dark:text-[#a6b7a8]">Hoàn thành Dịu lại</div>
                          <div className="text-xl font-bold tabular-nums mt-1">
                            {metricsData.aggregates.calm_tool_completed || 0}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#f1efe5] dark:bg-[#222c24] border border-[#dcd9cc] dark:border-[#324236] p-4">
                          <div className="text-[11px] text-[#576c59] dark:text-[#a6b7a8]">Trung vị tới việc có ích</div>
                          <div className="text-xl font-bold tabular-nums mt-1">
                            {metricsData.medianFirstUsefulMs !== null
                              ? `${Math.round(metricsData.medianFirstUsefulMs / 1000)}s`
                              : 'Chưa đủ mẫu'}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#f1efe5] dark:bg-[#222c24] border border-[#dcd9cc] dark:border-[#324236] p-4">
                          <div className="text-[11px] text-[#576c59] dark:text-[#a6b7a8]">Đạt SLA kiểm duyệt</div>
                          <div className="text-xl font-bold tabular-nums mt-1 text-[#46613e] dark:text-[#98c18e]">
                            {metricsData.slaCompliancePct !== null ? `${metricsData.slaCompliancePct}%` : 'Chưa có mẫu'}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#f1efe5] dark:bg-[#222c24] border border-[#dcd9cc] dark:border-[#324236] p-4">
                          <div className="text-[11px] text-[#576c59] dark:text-[#a6b7a8]">Thấy nhẹ hơn một chút</div>
                          <div className="text-xl font-bold tabular-nums mt-1">
                            {metricsData.feelingLighterRatePct !== null
                              ? `${metricsData.feelingLighterRatePct}%`
                              : 'Chưa đủ mẫu'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-[#f4f2ea] dark:bg-[#222c24] border border-[#dcd9cc] dark:border-[#324236] space-y-1">
                          <div className="font-semibold">Thẻ hỗ trợ khủng hoảng</div>
                          <div className="text-[#576c59] dark:text-[#a6b7a8] tabular-nums">
                            Hiện: {metricsData.aggregates.support_card_shown || 0} · Bấm xem:{' '}
                            {metricsData.aggregates.support_card_opened || 0}
                            {metricsData.supportOpenRatePct !== null ? ` (${metricsData.supportOpenRatePct}%)` : ''}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#f4f2ea] dark:bg-[#222c24] border border-[#dcd9cc] dark:border-[#324236] space-y-1">
                          <div className="font-semibold">Ngọn đèn chia sẻ (Giai đoạn 3)</div>
                          <div className="text-[#576c59] dark:text-[#a6b7a8] tabular-nums">
                            Tạo link: {metricsData.aggregates.lantern_gift_created || 0} · Người nhận mở:{' '}
                            {metricsData.aggregates.lantern_gift_opened || 0}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#f4f2ea] dark:bg-[#222c24] border border-[#dcd9cc] dark:border-[#324236] space-y-1">
                          <div className="font-semibold">7 đêm tử tế với mình</div>
                          <div className="text-[#576c59] dark:text-[#a6b7a8] tabular-nums">
                            Số bước tự đánh dấu: {metricsData.aggregates.challenge_step_done || 0}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold">Góp ý ẩn danh từ người dùng ({metricsData.feedbackNotes.length})</div>
                        {metricsData.feedbackNotes.length === 0 ? (
                          <p className="text-xs text-[#576c59] dark:text-[#a6b7a8]">Chưa có góp ý mới gửi về server.</p>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {metricsData.feedbackNotes.map((fb) => (
                              <div
                                key={fb.id}
                                className="p-3 rounded-xl bg-[#f1efe5] dark:bg-[#222c24] text-xs flex flex-wrap justify-between gap-2"
                              >
                                <span>{fb.note}</span>
                                <span className="text-[11px] text-[#6d7c6d] tabular-nums">
                                  {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#576c59]">Đang tải số liệu tổng hợp...</div>
                  )}
                </div>
              ) : queueItems.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#f1efe5] dark:bg-[#232e25] text-center text-xs text-[#576c59] dark:text-[#a6b7a8]">
                  {queueTab === 'pending'
                    ? 'Hàng đợi kiểm duyệt hiện đang trống. Mọi thứ đều ổn định.'
                    : 'Chưa có bản ghi đã xử lý nào.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {queueItems.map((item) => {
                    const needsBlurProtection = item.riskLevel >= 2;
                    const isRevealed = !needsBlurProtection || Boolean(revealedIds[item.id]);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                          item.riskLevel >= 3
                            ? 'bg-[#fbf1ee] dark:bg-[#2d1e1c] border-[#dfaba0] dark:border-[#633830]'
                            : item.riskLevel === 2
                            ? 'bg-[#faf4e8] dark:bg-[#2b261c] border-[#e0c89d] dark:border-[#594b31]'
                            : 'bg-[#f4f2ea] dark:bg-[#222c24] border-[#dcd9cc] dark:border-[#324236]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg font-bold ${
                                item.riskLevel >= 3
                                  ? 'bg-[#9b4b38] text-white'
                                  : item.riskLevel === 2
                                  ? 'bg-[#a07628] text-white'
                                  : 'bg-[#46613e] text-white'
                              }`}
                            >
                              {item.riskLevel >= 3
                                ? 'Mức 3 · Khẩn cấp'
                                : item.riskLevel === 2
                                ? 'Mức 2 · Rủi ro'
                                : 'Báo cáo cộng đồng'}
                            </span>
                            <span className="font-semibold">
                              {SOURCE_LABEL[item.sourceType] || item.sourceType}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#5e7260] dark:text-[#a6b7a8] tabular-nums">
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="text-xs text-[#4b604d] dark:text-[#c0cfc2]">
                          <strong>Lý do ghi nhận:</strong> {item.reason}
                          {item.targetAuthorAlias && (
                            <span> · Tác giả: {item.targetAuthorAlias}</span>
                          )}
                        </div>

                        {item.targetTitle && (
                          <div className="text-sm font-bold font-serif-healing">{item.targetTitle}</div>
                        )}

                        <div className="rounded-xl bg-white/80 dark:bg-[#161e17] border border-[#e0ddd0] dark:border-[#324236] p-3.5 space-y-2">
                          {needsBlurProtection && (
                            <div className="flex items-center justify-between gap-2 text-[11px] text-[#8f4431] dark:text-[#e9a392]">
                              <span className="flex items-center gap-1.5 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Nội dung nhạy cảm — được che mặc định để bảo vệ tâm lý điều phối viên
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                                }
                                className="inline-flex items-center gap-1 font-bold underline"
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{isRevealed ? 'Che lại' : 'Mở đọc để rà soát'}</span>
                              </button>
                            </div>
                          )}

                          <p
                            className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                              !isRevealed ? 'blur-sm select-none pointer-events-none' : ''
                            }`}
                          >
                            {item.targetExcerpt || '(Không có trích đoạn đính kèm)'}
                          </p>
                        </div>

                        {queueTab === 'pending' ? (
                          <div className="space-y-3 pt-1">
                            <input
                              type="text"
                              value={notesByItem[item.id] || ''}
                              onChange={(e) =>
                                setNotesByItem((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              placeholder="Ghi chú nội bộ khi xử lý (tùy chọn)..."
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141b15] border border-[#d6d3c6] dark:border-[#324236] text-xs"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                              {item.riskLevel < 3 && (
                                <button
                                  type="button"
                                  onClick={() => void handleResolve(item, 'approve_public')}
                                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition"
                                >
                                  Duyệt công khai
                                </button>
                              )}

                              {(item.sourceType === 'confession' || item.sourceType === 'confession_report') && (
                                <button
                                  type="button"
                                  onClick={() => void handleResolve(item, 'approve_with_tw')}
                                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#5f6f3b] hover:bg-[#4c5a2e] text-white text-xs font-semibold transition"
                                >
                                  Duyệt + Gắn làm mờ TW
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => void handleResolve(item, 'hide_post')}
                                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#e6e3d7] dark:bg-[#2a362c] hover:bg-[#dbd7c9] text-xs font-semibold transition"
                              >
                                Giữ ẩn / Gỡ bỏ
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleResolve(item, 'mark_safety_outreach')}
                                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#e6efe2] dark:bg-[#233627] text-[#284725] dark:text-[#b4deb0] text-xs font-semibold transition"
                              >
                                Đánh dấu đã hỗ trợ an toàn
                              </button>

                              {item.sourceType.includes('report') || item.sourceType === 'stranger_chat' || item.sourceType === 'lounge_message' ? (
                                <button
                                  type="button"
                                  onClick={() => void handleResolve(item, 'dismiss_report')}
                                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#cfd3c6] dark:border-[#3e4e41] text-xs font-semibold transition"
                                >
                                  Bỏ qua báo cáo
                                </button>
                              ) : null}

                              {confirmBanId === item.id ? (
                                <div className="flex items-center gap-1.5 bg-[#f7e7e3] dark:bg-[#38231e] px-2.5 py-1 rounded-xl border border-[#dfbeb6] dark:border-[#5e382f]">
                                  <span className="text-[11px] font-semibold text-[#8f4431] dark:text-[#f0b4a5]">
                                    Khóa quyền công khai của tác giả?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void handleResolve(item, 'ban_author')}
                                    className="px-2.5 py-1 rounded-lg bg-[#9b4b38] text-white text-[11px] font-bold"
                                  >
                                    Xác nhận khóa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmBanId(null)}
                                    className="px-2 py-1 text-[11px] underline"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmBanId(item.id)}
                                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#f7e7e3] dark:bg-[#38231e] text-[#9b4b38] dark:text-[#e9a392] text-xs font-semibold inline-flex items-center gap-1 transition"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Khóa tài khoản</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#576c59] dark:text-[#a6b7a8] pt-1">
                            <strong>Kết quả:</strong> {item.reviewerNote || 'Đã xử lý'} ·{' '}
                            {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString('vi-VN') : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Audit Logs */}
            <section className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <History className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
                <span>Nhật ký kiểm duyệt nội bộ (Audit Log)</span>
              </div>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-[#576c59] dark:text-[#a6b7a8]">Chưa có thao tác kiểm duyệt nào được ghi nhận.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#f1efe5] dark:bg-[#222c24] text-xs"
                    >
                      <div className="space-y-0.5">
                        <div>
                          <strong>{ACTION_LABEL[log.action] || log.action}</strong> ·{' '}
                          <span className="text-[#46613e] dark:text-[#98c18e]">{log.moderatorAlias}</span>
                        </div>
                        {log.note && (
                          <div className="text-[11px] text-[#576c59] dark:text-[#a6b7a8]">Ghi chú: {log.note}</div>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6d7c6d] dark:text-[#9ab09c] tabular-nums">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};
