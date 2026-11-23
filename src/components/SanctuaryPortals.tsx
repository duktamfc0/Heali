import React from 'react';
import {
  Waves,
  MessageSquareHeart,
  BookOpen,
  Mail,
  TreeDeciduous,
  ArrowRight,
  Sparkles,
  Flame,
  Lock,
  Wind,
  Heart,
} from 'lucide-react';

interface SanctuaryPortalsProps {
  onSelectPortal: (tab: 'lake' | 'community' | 'journal' | 'letters' | 'wishes') => void;
  onOpenFloatModal: () => void;
}

export const SanctuaryPortals: React.FC<SanctuaryPortalsProps> = ({
  onSelectPortal,
  onOpenFloatModal,
}) => {
  const portals = [
    {
      id: 'lake' as const,
      title: 'Hồ Hoa Đăng',
      subtitle: 'Thả trôi ưu phiền & Cầu chúc an lành',
      story: 'Thắp sáng một ngọn hoa đăng, gửi nỗi lòng theo dòng nước trăng. Khi ánh đèn khuất xa sau làn sương, những đớn đau cũng dần nhẹ bớt theo từng nhịp sóng.',
      actionText: 'Thả hoa đăng ngay',
      colorTheme: 'from-amber-500/20 via-purple-600/10 to-transparent border-amber-400/30 hover:border-amber-400',
      accentGlow: 'bg-amber-400/20 text-amber-300',
      icon: Waves,
      tag: 'Nghi thức chữa lành',
      customAction: onOpenFloatModal,
      sceneIllustration: (
        <svg viewBox="0 0 200 120" className="w-full h-full opacity-60">
          <ellipse cx="100" cy="95" rx="80" ry="18" fill="url(#waterGradP)" />
          <path d="M100,60 C85,75 75,90 100,95 C125,90 115,75 100,60 Z" fill="#fbbf24" opacity="0.8" />
          <circle cx="100" cy="55" r="8" fill="#fff" filter="drop-shadow(0 0 8px #f59e0b)" />
          <circle cx="45" cy="40" r="1.5" fill="#fff" opacity="0.6" />
          <circle cx="160" cy="30" r="2" fill="#fde047" opacity="0.8" />
          <defs>
            <linearGradient id="waterGradP" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      id: 'community' as const,
      title: 'Tâm Tình Ẩn Danh',
      subtitle: 'Nơi nỗi buồn được lắng nghe không phán xét',
      story: 'Không cần danh tính, không sợ ai chê trách. Trút bỏ những lời nghẹn ứ nơi cổ họng và cảm nhận hàng ngàn trái tim xa lạ đang khẽ gửi cái ôm ấm áp.',
      actionText: 'Đọc & Sẻ chia nỗi niềm',
      colorTheme: 'from-rose-500/20 via-purple-600/10 to-transparent border-rose-400/30 hover:border-rose-400',
      accentGlow: 'bg-rose-500/20 text-rose-300',
      icon: MessageSquareHeart,
      tag: 'Cộng đồng thấu cảm',
      sceneIllustration: (
        <svg viewBox="0 0 200 120" className="w-full h-full opacity-60">
          <path d="M60,40 C60,25 90,25 100,45 C110,25 140,25 140,40 C140,65 100,90 100,90 C100,90 60,65 60,40 Z" fill="url(#heartGradP)" opacity="0.75" />
          <circle cx="150" cy="35" r="4" fill="#f43f5e" opacity="0.4" />
          <circle cx="50" cy="70" r="3" fill="#ec4899" opacity="0.5" />
          <defs>
            <linearGradient id="heartGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      id: 'journal' as const,
      title: 'Nhật Ký Cảm Xúc',
      subtitle: 'Góc lưu giữ hành trình tự vỗ về bản thân',
      story: 'Đo lường năng lượng nội tâm mỗi ngày. Có khóa mã PIN bảo mật tuyệt đối. Từng cảm xúc dù là yếu đuối nhất của bạn đều xứng đáng được bao bọc.',
      actionText: 'Mở trang nhật ký riêng',
      colorTheme: 'from-amber-400/20 via-indigo-600/10 to-transparent border-amber-300/30 hover:border-amber-300',
      accentGlow: 'bg-amber-400/20 text-amber-300',
      icon: BookOpen,
      tag: 'Góc riêng tư bảo mật',
      sceneIllustration: (
        <svg viewBox="0 0 200 120" className="w-full h-full opacity-60">
          <rect x="55" y="30" width="90" height="65" rx="8" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M100,30 L100,95" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M65,45 L90,45 M65,55 L85,55 M110,45 L135,45 M110,55 L130,55" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="100" cy="62" r="7" fill="#fbbf24" opacity="0.85" />
        </svg>
      ),
    },
    {
      id: 'letters' as const,
      title: 'Lá Thư Chưa Gửi',
      subtitle: 'Nghi thức hóa vàng & Giải phóng tâm can',
      story: 'Viết cho người cũ, cho gia đình hay chính mình ngày xưa. Sau đó hóa thành tro tàn bay theo mây trời. Trả tự do cho họ, và trả lại bình yên cho chính mình.',
      actionText: 'Viết thư & Hóa tro tàn',
      colorTheme: 'from-purple-500/20 via-rose-600/10 to-transparent border-purple-400/30 hover:border-purple-400',
      accentGlow: 'bg-purple-500/20 text-purple-300',
      icon: Mail,
      tag: 'Nghi thức buông bỏ',
      sceneIllustration: (
        <svg viewBox="0 0 200 120" className="w-full h-full opacity-60">
          <rect x="50" y="35" width="100" height="60" rx="6" fill="#181935" stroke="#a855f7" strokeWidth="1.5" />
          <path d="M50,35 L100,70 L150,35" stroke="#ec4899" strokeWidth="1.5" />
          {/* Flame particles rising */}
          <circle cx="115" cy="25" r="2.5" fill="#f59e0b" filter="drop-shadow(0 0 4px #ef4444)" />
          <circle cx="125" cy="18" r="1.8" fill="#fde047" />
          <circle cx="90" cy="20" r="2" fill="#f97316" />
        </svg>
      ),
    },
    {
      id: 'wishes' as const,
      title: 'Cây Nguyện Ước',
      subtitle: 'Gieo mầm hy vọng & Cam kết dịu lành',
      story: 'Treo lên một ước mơ và hứa với bản thân một hành động chăm sóc nhỏ hôm nay. Từng bước nhỏ thôi cũng đủ để bạn kiên cường bước qua giông bão.',
      actionText: 'Treo thẻ ước nguyện',
      colorTheme: 'from-emerald-500/20 via-purple-600/10 to-transparent border-emerald-400/30 hover:border-emerald-400',
      accentGlow: 'bg-emerald-500/20 text-emerald-300',
      icon: TreeDeciduous,
      tag: 'Hành động lành mạnh',
      sceneIllustration: (
        <svg viewBox="0 0 200 120" className="w-full h-full opacity-60">
          <path d="M100,100 C100,80 85,60 100,30 C115,60 100,80 100,100" stroke="#10b981" strokeWidth="4" />
          <circle cx="85" cy="40" r="18" fill="#10b981" opacity="0.3" />
          <circle cx="115" cy="40" r="18" fill="#10b981" opacity="0.3" />
          <circle cx="100" cy="25" r="22" fill="#34d399" opacity="0.4" />
          {/* Wooden plaque dangling */}
          <rect x="94" y="55" width="12" height="20" rx="2" fill="#f59e0b" opacity="0.9" />
          <line x1="100" y1="45" x2="100" y2="55" stroke="#fde047" strokeWidth="1" />
        </svg>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Cổng Bước Vào Không Gian Chữa Lành
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-healing">
            Chọn nơi dừng chân cho tâm hồn
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-purple-200/70 max-w-md font-serif-healing italic">
          Mỗi không gian là một phương thuốc dịu êm, giúp bạn đối thoại với chính mình và tìm lại sự cân bằng.
        </p>
      </div>

      {/* Visual Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {portals.map((portal, idx) => {
          const Icon = portal.icon;
          const isFullWidthSpan = idx === 0 ? 'lg:col-span-2' : '';

          return (
            <div
              key={portal.id}
              onClick={() => {
                if (portal.customAction) {
                  portal.customAction();
                } else {
                  onSelectPortal(portal.id);
                }
              }}
              className={`group relative cursor-pointer rounded-3xl p-6 sm:p-7 bg-[#13142a] border transition-all duration-300 overflow-hidden shadow-xl hover:shadow-[0_15px_40px_rgba(20,21,48,0.8)] hover:-translate-y-1.5 flex flex-col justify-between ${portal.colorTheme} ${isFullWidthSpan}`}
            >
              {/* Mini-Scene Backdrop Illustration */}
              <div className="absolute right-0 bottom-0 w-48 sm:w-60 h-36 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-80">
                {portal.sceneIllustration}
              </div>

              {/* Top Row: Icon badge & tag */}
              <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${portal.accentGlow}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-medium text-purple-300/80 px-3 py-1 rounded-full bg-[#181938]/80 border border-purple-500/20 backdrop-blur-sm">
                  {portal.tag}
                </span>
              </div>

              {/* Title & Narrative */}
              <div className="relative z-10 space-y-2 mb-6 max-w-md">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-serif-healing group-hover:text-amber-200 transition">
                    {portal.title}
                  </h3>
                  <div className="text-xs text-amber-200/90 font-medium mt-0.5">
                    {portal.subtitle}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-purple-100/75 font-serif-healing leading-relaxed">
                  {portal.story}
                </p>
              </div>

              {/* Action Button Link */}
              <div className="relative z-10 flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-200 group-hover:text-amber-300 transition">
                <span>{portal.actionText}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
