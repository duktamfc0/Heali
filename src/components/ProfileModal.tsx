import React, { useState, useEffect } from 'react';
import type { User } from '../services/api';
import { api, PinLockedError } from '../services/api';
import {
  User as UserIcon,
  X,
  Sparkles,
  Lock,
  Download,
  Heart,
  Moon,
  Sun,
  Leaf,
  Cloud,
  Save,
  Check,
  KeyRound,
  Trash2,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (u: User) => void;
  theme?: 'light' | 'dark';
  lowMotion?: boolean;
  language?: 'vi' | 'en';
  onToggleTheme?: () => void;
  onToggleLowMotion?: () => void;
  onChangeLanguage?: (lang: 'vi' | 'en') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  theme = 'light',
  lowMotion = false,
  language = 'vi',
  onToggleTheme,
  onToggleLowMotion,
  onChangeLanguage,
}) => {
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'heart');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [currentPin, setCurrentPin] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [removePinMode, setRemovePinMode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Recovery code state
  const [recoveryInfo, setRecoveryInfo] = useState<{ recoveryCode: string; accountId: string; note: string } | null>(null);
  const [showRestorePanel, setShowRestorePanel] = useState(false);
  const [restoreAccountId, setRestoreAccountId] = useState('');
  const [restoreCode, setRestoreCode] = useState('');

  // Delete account two-step inline confirmation (no window.confirm)
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAvatar(user.avatar || 'heart');
      setStatusMessage(user.statusMessage || '');
    }
    setFeedback(null);
    setConfirmDeleteStep(false);
    setRemovePinMode(false);
    setNewPinCode('');
    setCurrentPin('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const avatarChoices = [
    { id: 'heart', icon: Heart, label: 'Trái Tim Ấm' },
    { id: 'moon', icon: Moon, label: 'Trăng Đêm' },
    { id: 'sun', icon: Sun, label: 'Nắng Ban Mai' },
    { id: 'leaf', icon: Leaf, label: 'Chiếc Lá Nhỏ' },
    { id: 'cloud', icon: Cloud, label: 'Mây Trôi' },
    { id: 'sparkles', icon: Sparkles, label: 'Đom Đóm' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPinCode && newPinCode.trim().length < 4) {
      setFeedback({ type: 'err', text: 'Mã PIN mới cần từ 4 đến 8 ký tự.' });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Parameters<typeof api.updateProfile>[0] = {
        nickname: nickname.trim(),
        avatar,
        statusMessage: statusMessage.trim(),
      };
      if (removePinMode) {
        payload.pinCode = null;
        if (currentPin.trim()) payload.currentPin = currentPin.trim();
      } else if (newPinCode.trim()) {
        payload.pinCode = newPinCode.trim();
        if (currentPin.trim()) payload.currentPin = currentPin.trim();
      }

      const updated = await api.updateProfile(payload);
      onUserUpdated(updated);
      setNewPinCode('');
      setCurrentPin('');
      setRemovePinMode(false);
      setFeedback({ type: 'ok', text: 'Đã cập nhật hồ sơ và bảo mật!' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Không thể lưu hồ sơ. Hãy thử lại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setFeedback(null);
    try {
      const exportObject = await api.exportAllData();
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `heali-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      setFeedback({ type: 'ok', text: 'Đã tải xuống toàn bộ dữ liệu riêng tư của bạn.' });
    } catch (err) {
      if (err instanceof PinLockedError) {
        setFeedback({ type: 'err', text: 'Hãy mở khóa mã PIN ở tab Nhật ký trước khi xuất dữ liệu.' });
      } else {
        setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Không thể xuất dữ liệu.' });
      }
    }
  };

  const handleGenerateRecovery = async () => {
    setFeedback(null);
    try {
      const info = await api.generateRecoveryCode();
      setRecoveryInfo(info);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Cần mở khóa PIN trước khi tạo mã khôi phục.',
      });
    }
  };

  const handleRestoreAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const restored = await api.restoreWithRecovery(restoreAccountId.trim(), restoreCode.trim());
      onUserUpdated(restored);
      setShowRestorePanel(false);
      setRestoreAccountId('');
      setRestoreCode('');
      setFeedback({ type: 'ok', text: 'Đã khôi phục tài khoản ẩn danh trên thiết bị này!' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Mã tài khoản hoặc mã khôi phục không hợp lệ.',
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setFeedback(null);
    try {
      await api.deleteAccount();
      const freshGuest = await api.initSession();
      onUserUpdated(freshGuest);
      setConfirmDeleteStep(false);
      onClose();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Vui lòng mở khóa PIN trước khi xóa tài khoản.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hồ sơ và Quyền riêng tư"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 sm:p-7 shadow-2xl text-[#273829] dark:text-[#edf2e8]">
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e6efe2] dark:bg-[#233227] border border-[#c3d3bd] dark:border-[#3d5442] flex items-center justify-center text-[#46613e] dark:text-[#98c18e]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#243627] dark:text-[#edf2e8] font-serif-healing">
                Hồ sơ &amp; Quyền riêng tư
              </h3>
              <p className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
                Tài khoản ẩn danh · Mã định danh: <span className="font-mono text-[11px]">{user?.id || '—'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e7260] dark:text-[#b0c0b2] hover:text-[#273829] dark:hover:text-[#edf2e8]"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(onToggleTheme || onToggleLowMotion || onChangeLanguage) && (
          <div className="mt-4 p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] space-y-2.5">
            <div className="text-xs font-bold text-[#243627] dark:text-[#edf2e8]">
              {language === 'en'
                ? 'Display comfort, reduced motion & language'
                : 'Hiển thị dịu mắt, giảm chuyển động & ngôn ngữ'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] text-xs font-semibold flex items-center justify-between gap-2 text-[#273829] dark:text-[#edf2e8]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
                    <span>{language === 'en' ? 'Dark theme' : 'Giao diện tối'}</span>
                  </span>
                  <span className="text-[11px] text-[#576c59] dark:text-[#b0c0b2]">
                    {theme === 'dark' ? (language === 'en' ? 'On' : 'Đang bật') : (language === 'en' ? 'Off' : 'Đang tắt')}
                  </span>
                </button>
              )}
              {onToggleLowMotion && (
                <button
                  type="button"
                  onClick={onToggleLowMotion}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] text-xs font-semibold flex items-center justify-between gap-2 text-[#273829] dark:text-[#edf2e8]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#46613e] dark:text-[#98c18e]" />
                    <span>{language === 'en' ? 'Low motion' : 'Ít chuyển động'}</span>
                  </span>
                  <span className="text-[11px] text-[#576c59] dark:text-[#b0c0b2]">
                    {lowMotion ? (language === 'en' ? 'On' : 'Đang bật') : (language === 'en' ? 'Off' : 'Đang tắt')}
                  </span>
                </button>
              )}
            </div>
            {onChangeLanguage && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-[#4b604d] dark:text-[#b0c0b2]">
                  {language === 'en' ? 'Language / Ngôn ngữ' : 'Ngôn ngữ giao diện'}
                </span>
                <div className="inline-flex rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] p-0.5">
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('vi')}
                    className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition ${
                      language === 'vi'
                        ? 'bg-[#46613e] text-white'
                        : 'text-[#576c59] dark:text-[#b0c0b2]'
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('en')}
                    className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition ${
                      language === 'en'
                        ? 'bg-[#46613e] text-white'
                        : 'text-[#576c59] dark:text-[#b0c0b2]'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-2xl border text-xs flex items-center gap-2 ${
              feedback.type === 'ok'
                ? 'bg-[#e6efe2] dark:bg-[#233327] border-[#b9cfb2] dark:border-[#3c5742] text-[#274224] dark:text-[#cfe3c9]'
                : 'bg-[#f7e7e3] dark:bg-[#3a221d] border-[#dfc0b4] dark:border-[#784237] text-[#8f4431] dark:text-[#f2c3b7]'
            }`}
          >
            {feedback.type === 'ok' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-semibold text-[#243627] dark:text-[#edf2e8] mb-2">
              Biểu tượng đại diện
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {avatarChoices.map((av) => {
                const Icon = av.icon;
                const isSelected = avatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatar(av.id)}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition ${
                      isSelected
                        ? 'border-[#46613e] dark:border-[#8bb482] bg-[#e6efe2] dark:bg-[#273b2c] shadow-sm'
                        : 'border-[#dcdad0] dark:border-[#324236] bg-[#f1efe5] dark:bg-[#222d25] text-[#4b604d] dark:text-[#b0c0b2] hover:border-[#9eb198]'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-[#46613e] dark:text-[#98c18e]" />
                    <span className="text-[10px] text-[#273829] dark:text-[#edf2e8]">{av.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-[#243627] dark:text-[#edf2e8] mb-1">
              Tên gọi ẩn danh
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              placeholder="Ví dụ: Đom Đóm Nhỏ, Gió Đêm..."
              className="w-full rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] p-2.5 text-sm text-[#273829] dark:text-[#edf2e8] placeholder:text-[#788778] focus:outline-none focus:border-[#46613e]"
            />
          </div>

          {/* Status message */}
          <div>
            <label className="block text-xs font-semibold text-[#243627] dark:text-[#edf2e8] mb-1">
              Lời nhắn ngắn trên hồ sơ
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              maxLength={120}
              placeholder="Ví dụ: Đang nghỉ một chút..."
              className="w-full rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] p-2.5 text-sm text-[#273829] dark:text-[#edf2e8] placeholder:text-[#788778] focus:outline-none focus:border-[#46613e]"
            />
          </div>

          {/* PIN Lock Protection (Never reveals existing PIN) */}
          <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#243627] dark:text-[#edf2e8] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#46613e] dark:text-[#98c18e]" />
                <span>Khóa PIN không gian riêng tư: {user?.hasPin ? 'Đang bật' : 'Chưa bật'}</span>
              </span>
              {user?.hasPin && (
                <button
                  type="button"
                  onClick={() => setRemovePinMode((v) => !v)}
                  className="text-[11px] font-semibold text-[#9b4b38] dark:text-[#e39b89] hover:underline"
                >
                  {removePinMode ? 'Giữ khóa PIN' : 'Tắt khóa PIN'}
                </button>
              )}
            </div>

            {user?.hasPin && !user?.pinUnlocked && (
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                maxLength={8}
                placeholder="Nhập PIN hiện tại (nếu đổi hoặc tắt PIN)"
                className="w-full rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] p-2 text-xs text-[#273829] dark:text-[#edf2e8] text-center tracking-widest"
              />
            )}

            {!removePinMode && (
              <input
                type="password"
                value={newPinCode}
                onChange={(e) => setNewPinCode(e.target.value)}
                maxLength={8}
                placeholder={user?.hasPin ? 'Nhập PIN mới (4-8 ký tự nếu muốn đổi)' : 'Đặt PIN mới (4-8 ký tự)'}
                className="w-full rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] p-2.5 text-xs text-[#273829] dark:text-[#edf2e8] placeholder:text-[#788778] focus:outline-none focus:border-[#46613e] text-center tracking-widest font-bold"
              />
            )}

            <p className="text-[11px] text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
              Mã PIN được băm bảo mật ở máy chủ. Nhật ký và thư chưa gửi cũng được mã hóa khi lưu trữ.
            </p>
          </div>

          {/* Save Profile CTA */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] px-4 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>

        {/* Recovery Code, Data Export & Account Deletion */}
        <div className="mt-5 pt-4 border-t border-[#e5e2d5] dark:border-[#2e3d31] space-y-3">
          <div className="text-xs font-bold text-[#243627] dark:text-[#edf2e8]">Quyền kiểm soát dữ liệu của bạn</div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExportData()}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold text-[#273829] dark:text-[#edf2e8] hover:border-[#9eb198] transition"
            >
              <Download className="w-3.5 h-3.5 text-[#46613e] dark:text-[#98c18e]" />
              <span>Xuất toàn bộ dữ liệu (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => void handleGenerateRecovery()}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold text-[#273829] dark:text-[#edf2e8] hover:border-[#9eb198] transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#46613e] dark:text-[#98c18e]" />
              <span>{user?.hasRecoveryCode ? 'Tạo mã khôi phục mới' : 'Tạo mã khôi phục thiết bị'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRestorePanel((v) => !v)}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold text-[#4b604d] dark:text-[#b0c0b2] hover:text-[#273829] dark:hover:text-[#edf2e8] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục từ máy cũ</span>
            </button>

            <PWAInstallButton compact />
          </div>

          {recoveryInfo && (
            <div className="p-3.5 rounded-2xl bg-[#f6efe2] dark:bg-[#2b271c] border border-[#dfc89e] dark:border-[#635132] text-xs space-y-1.5">
              <div className="font-bold text-[#4e3813] dark:text-[#ecd8ae]">Lưu lại hai mã này ở nơi an toàn:</div>
              <div>
                Mã tài khoản: <code className="font-mono font-bold select-all">{recoveryInfo.accountId}</code>
              </div>
              <div>
                Mã khôi phục: <code className="font-mono font-bold select-all">{recoveryInfo.recoveryCode}</code>
              </div>
              <p className="text-[11px] text-[#61471d] dark:text-[#d6c096]">{recoveryInfo.note}</p>
            </div>
          )}

          {showRestorePanel && (
            <form onSubmit={handleRestoreAccount} className="p-3.5 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] space-y-2 text-xs">
              <div className="font-semibold text-[#243627] dark:text-[#edf2e8]">Nhập thông tin từ thiết bị cũ</div>
              <input
                type="text"
                value={restoreAccountId}
                onChange={(e) => setRestoreAccountId(e.target.value)}
                placeholder="Mã tài khoản (u-...)"
                required
                className="w-full rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] px-3 py-2 text-xs text-[#273829] dark:text-[#edf2e8]"
              />
              <input
                type="text"
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value)}
                placeholder="Mã khôi phục (HL-XXXX-...)"
                required
                className="w-full rounded-xl bg-white dark:bg-[#172019] border border-[#d6d3c6] dark:border-[#394b3d] px-3 py-2 text-xs text-[#273829] dark:text-[#edf2e8]"
              />
              <button
                type="submit"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#46613e] text-white font-semibold text-xs"
              >
                Khôi phục dữ liệu
              </button>
            </form>
          )}

          {/* Account deletion */}
          <div className="pt-2 border-t border-[#e5e2d5] dark:border-[#2e3d31]">
            {!confirmDeleteStep ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteStep(true)}
                className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-[#9b4b38] dark:text-[#e39b89] hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa vĩnh viễn toàn bộ tài khoản và dữ liệu</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#fdf3ef] dark:bg-[#351f1b] border border-[#d9afa4] dark:border-[#784237] space-y-2.5 text-xs">
                <p className="text-[#6e2417] dark:text-[#f2c3b7] font-semibold">
                  Thao tác này sẽ xóa ngay lập tức và vĩnh viễn toàn bộ nhật ký, thư chưa gửi, tâm trạng và bài viết gắn với tài khoản này.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteStep(false)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#1b241d] border border-[#d6d3c6] dark:border-[#394b3d] text-[#273829] dark:text-[#edf2e8] font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDeleteAccount()}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9b3d2b] hover:bg-[#802e1f] text-white font-semibold"
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
