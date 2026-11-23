import React from 'react';
import {
  Waves,
  MessageSquareHeart,
  BookOpen,
  Mail,
  TreeDeciduous,
  CloudRain,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SanctuaryDestinationsProps {
  onSelectZone: (zone: 'lake' | 'community' | 'journal' | 'letters' | 'wishes' | 'rain_room' | 'spiritual_room') => void;
  onOpenFloatModal: () => void;
}

export const SanctuaryDestinations: React.FC<SanctuaryDestinationsProps> = ({
  onSelectZone,
  onOpenFloatModal,
}) => {
  const destinations = [
    {
      id: 'lake' as const,
      zoneName: 'Hồ hoa đăng',
      title: 'Bến gỗ ven hồ & Thả hoa đăng',
      story: 'Bến gỗ tĩnh mịch vươn ra mặt nước xanh dịu. Nơi bạn gửi gắm những nỗi niềm chưa thể gọi tên và nhìn chúng nhẹ nhàng trôi đi.',
      actionText: 'Thả hoa đăng xuống hồ',
      iconBg: 'bg-[#e7efe2] text-[#46613e] border-[#c8d6c1]',
      icon: Waves,
      soulsPresent: '342 bạn đang ngồi bên bến',
      customAction: onOpenFloatModal,
      sceneArt: (
        <svg viewBox="0 0 240 140" className="w-full h-full opacity-55">
          <path d="M0,100 Q120,86 240,104 L240,140 L0,140 Z" fill="#466e5e" opacity="0.24" />
          <path d="M84,86 L138,86 L150,140 L72,140 Z" fill="#b98a64" opacity="0.4" />
          <ellipse cx="64" cy="114" rx="12" ry="4" fill="#d9b47b" opacity="0.35" />
          <circle cx="64" cy="109" r="5.5" fill="#f7eed2" stroke="#c89b5d" strokeWidth="1" />
          <ellipse cx="176" cy="110" rx="10" ry="3.5" fill="#d9b47b" opacity="0.35" />
          <circle cx="176" cy="106" r="4.5" fill="#f7eed2" stroke="#c89b5d" strokeWidth="1" />
        </svg>
      ),
    },
    {
      id: 'community' as const,
      zoneName: 'Vườn tâm tình',
      title: 'Không gian thổ lộ & Đồng cảm',
      story: 'Góc vườn êm đềm dưới tán cây xanh. Nơi bạn cởi bỏ chiếc mặt nạ mạnh mẽ, chia sẻ nỗi lòng ẩn danh và đón nhận cái ôm dịu dàng.',
      actionText: 'Bước vào Vườn tâm tình',
      iconBg: 'bg-[#f4e7e2] text-[#a95843] border-[#e2c6bc]',
      icon: MessageSquareHeart,
      soulsPresent: '816 tâm tình vừa sẻ chia',
      sceneArt: (
        <svg viewBox="0 0 240 140" className="w-full h-full opacity-55">
          <path d="M72,84 L168,84 L176,96 L64,96 Z" fill="#a95843" opacity="0.22" />
          <path d="M120,34 L66,84 L174,84 Z" fill="#46613e" opacity="0.24" />
          <circle cx="120" cy="92" r="6" fill="#e9bd6b" opacity="0.7" />
          <line x1="120" y1="84" x2="120" y2="88" stroke="#a95843" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'journal' as const,
      zoneName: 'Nhà nhật ký',
      title: 'Gian phòng riêng tư & Ghi chép nội tâm',
      story: 'Ngôi nhà nhỏ được bảo vệ bằng mã PIN riêng biệt. Từng trang viết là một bước chậm lại để lắng nghe và ôm lấy cảm xúc của chính mình.',
      actionText: 'Mở cửa Nhà nhật ký',
      iconBg: 'bg-[#ebeede] text-[#46613e] border-[#cdd6be]',
      icon: BookOpen,
      soulsPresent: 'Bảo mật riêng tư tuyệt đối',
      sceneArt: (
        <svg viewBox="0 0 240 140" className="w-full h-full opacity-55">
          <rect x="78" y="48" width="84" height="56" rx="8" fill="#f3efe2" stroke="#46613e" strokeWidth="1.3" />
          <line x1="120" y1="48" x2="120" y2="104" stroke="#46613e" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M88,64 L110,64 M88,78 L106,78 M130,64 L152,64 M134,78 L152,78" stroke="#859781" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      id: 'letters' as const,
      zoneName: 'Bưu điện ký ức',
      title: 'Hòm thư bí mật & Nghi thức buông bỏ',
      story: 'Nơi cất giữ những bức thư chưa từng gửi. Viết hết điều còn dang dở, rồi nhẹ nhàng buông xuống để tâm hồn được thảnh thơi.',
      actionText: 'Soạn thư & Buông bỏ',
      iconBg: 'bg-[#f4ece0] text-[#9b6a3c] border-[#dfd0bc]',
      icon: Mail,
      soulsPresent: '512 bức thư đã hóa nhẹ mây',
      sceneArt: (
        <svg viewBox="0 0 240 140" className="w-full h-full opacity-55">
          <rect x="72" y="56" width="96" height="52" rx="6" fill="#f5efe2" stroke="#b57a4c" strokeWidth="1.3" />
          <path d="M72,56 L120,86 L168,56" stroke="#b57a4c" strokeWidth="1.3" fill="none" />
          <circle cx="132" cy="34" r="3" fill="#d99a4e" opacity="0.7" />
          <circle cx="146" cy="24" r="2.2" fill="#d99a4e" opacity="0.5" />
        </svg>
      ),
    },
    {
      id: 'wishes' as const,
      zoneName: 'Cây ước nguyện',
      title: 'Cội cây ý niệm & Cam kết dịu dàng',
      story: 'Cội cây xanh rủ bóng mát bên thảm cỏ. Treo lên một mong ước bình an và một lời hứa tự chăm sóc bản thân mỗi ngày.',
      actionText: 'Treo thẻ lên Cây ước',
      iconBg: 'bg-[#e6efe2] text-[#3f6443] border-[#c4d5be]',
      icon: TreeDeciduous,
      soulsPresent: '1.240 ước nguyện đã đâm chồi',
      sceneArt: (
        <svg viewBox="0 0 240 140" className="w-full h-full opacity-55">
          <path d="M120,130 Q120,92 104,54 Q120,82 120,130" stroke="#755a44" strokeWidth="4" fill="none" />
          <circle cx="102" cy="52" r="24" fill="#46613e" opacity="0.22" />
          <circle cx="138" cy="54" r="22" fill="#5e7f52" opacity="0.25" />
          <circle cx="120" cy="38" r="26" fill="#46613e" opacity="0.28" />
          <rect x="116" y="72" width="9" height="16" rx="2" fill="#e6bd6c" opacity="0.85" />
        </svg>
      ),
    },
    {
      id: 'rain_room' as const,
      zoneName: 'Căn phòng mưa',
      title: 'Góc trà tĩnh lặng & Phím đàn Piano',
      story: 'Gian phòng gỗ ấm cúng nhìn ra mặt hồ. Lắng nghe tiếng gió dịu, mưa rơi tí tách và tiếng piano nhẹ nhàng giúp dễ đi vào giấc ngủ.',
      actionText: 'Lắng nghe thanh âm',
      iconBg: 'bg-[#e5eef0] text-[#436874] border-[#c3d5d8]',
      icon: CloudRain,
      soulsPresent: 'Hoạt động ngay cả khi ngoại tuyến',
      sceneArt: (
        <svg viewBox="0 0 240 140" className="w-full h-full opacity-55">
          <rect x="68" y="28" width="104" height="82" rx="6" fill="#e9f1f2" stroke="#4d7588" strokeWidth="1.4" />
          <line x1="120" y1="28" x2="120" y2="110" stroke="#4d7588" strokeWidth="1" />
          <line x1="68" y1="68" x2="172" y2="68" stroke="#4d7588" strokeWidth="1" />
          <line x1="88" y1="38" x2="84" y2="52" stroke="#6f97a8" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="146" y1="42" x2="142" y2="56" stroke="#6f97a8" strokeWidth="1.2" strokeDasharray="3 3" />
        </svg>
      ),
    },
      {
      id: 'spiritual_room' as const,
      zoneName: 'Phòng tâm linh',
      title: 'Tarot, Tử Vi & Ghế cố vấn trực tiếp',
      story: 'Không gian chiêm nghiệm dịu dàng: gieo bài Tarot 22 lá ẩn chính, xem bản mệnh Ngũ Hành, hoặc đăng ký ghế & vé xem cố vấn.',
      actionText: 'Bước vào Phòng tâm linh',
      iconBg: 'bg-[#ede9f2] text-[#4e3f6e] border-[#d3cce3]',
      icon: Sparkles,
      soulsPresent: 'Đặt ghế 1:1 & Đăng ký xem',
      sceneArt: (
        <svg viewBox="0 0 240 140" className="w-full h-full opacity-55">
          <rect x="86" y="40" width="44" height="68" rx="6" fill="#f3efe2" stroke="#4e3f6e" strokeWidth="1.3" transform="rotate(-7 108 74)" />
          <rect x="112" y="42" width="44" height="68" rx="6" fill="#ebe8f2" stroke="#4e3f6e" strokeWidth="1.3" transform="rotate(8 134 76)" />
          <circle cx="134" cy="74" r="9" fill="#d8be82" opacity="0.6" />
        </svg>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#4e6b4f] flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            7 Góc Nhỏ Trong Khu Vườn An Trú
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#243627] font-serif-healing">
            Khám phá từng không gian chữa lành
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#576c59] max-w-md font-serif-healing italic">
          Mỗi góc nhỏ là một điểm tựa êm đềm để bạn tạm gác lại âu lo và trở về với sự bình yên bên trong.
        </p>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {destinations.map((dest) => {
          const Icon = dest.icon;

          return (
            <div
              key={dest.id}
              onClick={() => {
                if (dest.customAction) {
                  dest.customAction();
                } else if (dest.id === 'rain_room') {
                  const audioElem = document.getElementById('healing-audio-section');
                  audioElem?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onSelectZone(dest.id);
                }
              }}
              className="group relative cursor-pointer rounded-3xl p-6 bg-[#faf7ef] border border-[#dedcd0] hover:border-[#9eb198] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Visual Scene Backdrop Art */}
              <div className="absolute right-0 bottom-0 w-48 h-32 pointer-events-none transition-transform duration-500 group-hover:scale-105">
                {dest.sceneArt}
              </div>

              {/* Top Bar: Icon badge & quiet metadata */}
              <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${dest.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-[#5f7260]">
                  {dest.soulsPresent}
                </span>
              </div>

              {/* Title & Narrative Storytelling */}
              <div className="relative z-10 space-y-2 mb-5 max-w-sm">
                <div>
                  <div className="text-[11px] text-[#46613e] font-semibold tracking-wider uppercase">
                    {dest.zoneName}
                  </div>
                  <h3 className="text-lg font-bold text-[#243627] font-serif-healing group-hover:text-[#46613e] transition mt-0.5">
                    {dest.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#4e624f] font-serif-healing leading-relaxed">
                  {dest.story}
                </p>
              </div>

              {/* Action Link Button */}
              <div className="relative z-10 flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#46613e] group-hover:text-[#2e4429] transition">
                <span>{dest.actionText}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
