import React from 'react';
import {
  X,
  Compass,
  BookOpen,
  Heart,
  Mail,
  TreeDeciduous,
  Sparkles,
  CalendarHeart,
  Moon,
  Clock,
  Wind,
  Hand,
  Volume2,
  RefreshCw,
  MessageSquareHeart,
  MessageCircle,
  Star,
  Users,
  Waves,
  Gift,
  ShieldCheck,
  BarChart2,
  Info,
  Sliders,
} from 'lucide-react';
import type { RoomActionId, VietnameseRegionId } from './world/r3f/roomTypes';

interface AllFeaturesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRegion?: (regionId: VietnameseRegionId) => void;
  onSelectAction: (action: RoomActionId) => void;
  onNavigateRoute: (path: '/dem-hoa-dang' | '/gioi-thieu' | '/admin') => void;
  onOpenOnboarding: () => void;
}

interface HubActionCard {
  action: RoomActionId;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SELF_CARE_ACTIONS: HubActionCard[] = [
  { action: 'open_journal', title: 'Sổ Nhật Ký Mã Hóa', desc: 'Viết ra cảm xúc riêng tư an toàn', icon: BookOpen },
  { action: 'open_mood_checkin', title: 'Check-in Cảm Xúc', desc: 'Theo dõi hành trình hồi phục mỗi ngày', icon: Heart },
  { action: 'open_letters', title: 'Thư Chưa Gửi & Hóa Thư', desc: 'Gửi gắm điều chưa nói hoặc buông bỏ', icon: Mail },
  { action: 'open_wishes', title: 'Cây Ước Nguyện', desc: 'Treo dải lụa ước lành dưới cội cổ thụ', icon: TreeDeciduous },
  { action: 'open_daily_card', title: 'Thẻ Dịu Dàng Hôm Nay', desc: 'Thông điệp đồng cảm nhẹ nhàng mỗi ngày', icon: Sparkles },
  { action: 'open_seven_nights', title: '7 Đêm Tử Tế', desc: 'Lộ trình 7 đêm chăm sóc tâm trí êm dịu', icon: Moon },
  { action: 'open_difficult_dates', title: 'Ngày Dễ Chùng Lòng', desc: 'Đánh dấu những ngày nhạy cảm cần dịu lại', icon: CalendarHeart },
];

const CALM_HEAL_ACTIONS: HubActionCard[] = [
  { action: 'open_calm_breathe', title: 'Thở 4-7-8 & Quả Cầu', desc: 'Điều hòa nhịp tim trong 1–3 phút', icon: Wind },
  { action: 'open_calm_grounding', title: 'Neo Cảm Giác 5-4-3-2-1', desc: 'Trở về hiện tại khi tâm trí xao động', icon: Hand },
  { action: 'open_calm_audio', title: 'Âm Thanh Chữa Lành', desc: 'Mưa rơi, gió đồng lúa, suối chảy tự nhiên', icon: Volume2 },
  { action: 'open_calm_compassion', title: '3 Câu Tự Thương', desc: 'Nhắc bản thân dịu dàng với chính mình', icon: Heart },
  { action: 'open_calm_reframe', title: 'Đổi Góc Nhìn Suy Nghĩ', desc: 'Nhẹ nhàng gỡ nút thắt suy nghĩ tiêu cực', icon: RefreshCw },
  { action: 'open_ex_urge', title: 'Tạm Dừng 10 Phút', desc: 'Vượt qua thôi thúc nhắn cho người cũ', icon: Clock },
  { action: 'open_ai_mirror', title: 'Gương AI Đồng Cảm', desc: 'Phản chiếu tâm tình an toàn tùy chọn', icon: Sparkles },
];

const COMMUNITY_SPIRITUAL_ACTIONS: HubActionCard[] = [
  { action: 'open_confessions', title: 'Vườn Tâm Tình Ẩn Danh', desc: 'Chia sẻ và lắng nghe cộng đồng Heali', icon: MessageSquareHeart },
  { action: 'open_stranger_chat', title: 'Bàn Trà Gặp Gỡ 1:1', desc: 'Trò chuyện ẩn danh qua từ khóa bảo vệ', icon: MessageCircle },
  { action: 'open_spiritual_tarot', title: 'Trải Bài Tarot', desc: 'Chiêm nghiệm thông điệp chữa lành', icon: Sparkles },
  { action: 'open_spiritual_tuvi', title: 'Tử Vi & Thần Số Học', desc: 'Luận giải bản đồ tâm linh Việt', icon: Star },
  { action: 'open_spiritual_chairs', title: 'Phòng Cố Vấn Tâm Linh', desc: 'Đầy đủ 4 chuyên môn sẵn sàng kết nối', icon: Users },
];

const LAKE_SYSTEM_ACTIONS: HubActionCard[] = [
  { action: 'open_float_lantern', title: 'Thả Đèn Hoa Đăng', desc: 'Gửi gắm nỗi niềm trôi theo mặt hồ', icon: Waves },
  { action: 'open_send_gift', title: 'Tặng Đèn Người Thương', desc: 'Gửi thiệp đèn hoa đăng kèm liên kết riêng', icon: Gift },
  { action: 'open_lake_2d', title: 'Ngắm Hồ Hoa Đăng 2D', desc: 'Phiên bản mặt hồ phẳng tiết kiệm pin', icon: Compass },
  { action: 'open_quarterly_report', title: 'Báo Cáo Tác Động Quý', desc: 'Số liệu cộng đồng & đối tác đồng hành', icon: BarChart2 },
  { action: 'open_privacy', title: 'Quyền Riêng Tư & An Toàn', desc: 'Giao diện tối, PIN & kiểm soát dữ liệu', icon: ShieldCheck },
];

export const AllFeaturesHubModal: React.FC<AllFeaturesHubModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  onNavigateRoute,
  onOpenOnboarding,
}) => {
  if (!isOpen) return null;

  const handleAction = (action: RoomActionId) => {
    onClose();
    onSelectAction(action);
  };

  const renderSection = (title: string, items: HubActionCard[]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#46613e] dark:text-[#98c18e]">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.action}
              type="button"
              onClick={() => handleAction(item.action)}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f1efe5] dark:bg-[#222d25] hover:bg-[#e7ece1] dark:hover:bg-[#2a382d] border border-[#dcdad0] dark:border-[#324236] hover:border-[#46613e] text-left transition group"
            >
              <div className="p-2 rounded-xl bg-white dark:bg-[#19211b] border border-[#dce0d4] dark:border-[#324236] text-[#46613e] dark:text-[#98c18e] shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#273829] dark:text-[#edf2e8] leading-snug">
                  {item.title}
                </div>
                <p className="text-[11px] text-[#576c59] dark:text-[#a6b7a8] leading-snug mt-0.5">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#121c14]/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-[#faf7ef] dark:bg-[#19211b] border border-[#dcdad0] dark:border-[#324236] shadow-2xl overflow-hidden text-[#273829] dark:text-[#edf2e8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b border-[#e4e2d6] dark:border-[#2c3a2f] bg-[#f4f2ea] dark:bg-[#1f2921]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif-healing">
              Toàn Bộ Chức Năng Chữa Lành Heali
            </h2>
            <p className="text-xs text-[#576c59] dark:text-[#a6b7a8] mt-0.5">
              Tất cả 24 không gian chữa lành và 4 chuyên môn cố vấn tâm linh đều đã mở khóa sẵn sàng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#e7e5da] dark:bg-[#2a372d] hover:bg-[#dad8cb] text-xs font-semibold inline-flex items-center gap-1.5 transition shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Đóng</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">

          {renderSection('Cho riêng mình & Chăm sóc cảm xúc', SELF_CARE_ACTIONS)}
          {renderSection('Dịu lại, Hơi thở & Phục hồi', CALM_HEAL_ACTIONS)}
          {renderSection('Tâm linh & Cộng đồng', COMMUNITY_SPIRITUAL_ACTIONS)}
          {renderSection('Hồ Hoa Đăng, Quyền riêng tư & Dữ liệu', LAKE_SYSTEM_ACTIONS)}

          {/* Direct Portal Links */}
          <div className="pt-2 border-t border-[#e4e2d6] dark:border-[#2c3a2f] flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateRoute('/dem-hoa-dang');
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition"
            >
              <Waves className="w-4 h-4" />
              <span>Trang Đêm Hoa Đăng Toàn Cảnh</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateRoute('/gioi-thieu');
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#46613e] transition"
            >
              <Info className="w-4 h-4 text-[#46613e]" />
              <span>Trang Giới Thiệu Heali</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#46613e] transition"
            >
              <Compass className="w-4 h-4 text-[#46613e]" />
              <span>Mở lại hướng dẫn ban đầu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateRoute('/admin');
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#46613e] transition"
            >
              <Sliders className="w-4 h-4 text-[#46613e]" />
              <span>Cổng Điều Phối (/admin)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
