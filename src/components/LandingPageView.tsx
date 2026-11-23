import React, { useState } from 'react';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import { VI_COPY } from '../i18n/vi';
import {
  Leaf,
  ShieldCheck,
  ArrowRight,
  Heart,
  Wind,
  Lock,
  Flame,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Mail,
} from 'lucide-react';

import type { SupportedLanguage } from '../i18n';

interface LandingPageViewProps {
  language?: SupportedLanguage;
  lowMotion?: boolean;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  onEnterApp: () => void;
  onOpenLanternNight: () => void;
  onOpenSendGift: () => void;
  onOpenDailyCard: () => void;
  onOpenHelpline: () => void;
  onOpenQuarterlyReport?: () => void;
  onOpenPartnerInquiry?: () => void;
}

interface EthicalArticle {
  id: string;
  shortLabel: string;
  title: string;
  readTime: string;
  summary: string;
  bodyParagraphs: string[];
  groundingTip: string;
}

const ETHICAL_ARTICLES: EthicalArticle[] = [
  {
    id: '2am-thoughts',
    shortLabel: '2 giờ sáng',
    title: 'Vì sao bạn hay nghĩ đến người cũ lúc 2 giờ sáng?',
    readTime: '3 phút đọc',
    summary:
      'Vào ban đêm, sự mệt mỏi khiến vùng điều tiết lý trí hoạt động chậm lại trong khi nỗi cô đơn và thói quen tìm điểm tựa tăng lên.',
    bodyParagraphs: [
      'Khi ban ngày bận rộn, bộ não có nhiều việc nhỏ để bám vào: công việc, tiếng xe, bữa ăn. Nhưng sau nửa đêm, môi trường yên ắng và cơ thể mệt đi tự nhiên làm giảm khả năng kiềm chế các vòng lặp suy nghĩ.',
      'Nhớ đến một người từng quen thuộc vào lúc này không có nghĩa là bạn “yếu đuối” hay “chưa bước qua được”. Đơn giản là hệ thần kinh đang tìm cảm giác an toàn quen thuộc khi mệt mỏi.',
      'Thay vì tự phán xét hay vội vàng gửi tin nhắn ngay lúc đầu óc đang sương mù, bạn có thể tạm chuyển cơ thể sang một nhịp thở chậm 4-7-8, uống ngụm nước ấm và để mọi quyết định lớn chờ đến sáng.',
    ],
    groundingTip: 'Gợi ý thực hành: Thử chế độ Chỉ âm thanh 3 phút trong mục Dịu lại và đặt điện thoại xa giường.',
  },
  {
    id: 'unsent-letter-psychology',
    shortLabel: 'Thư không gửi',
    title: 'Viết thư không gửi hoạt động thế nào khi lòng còn nghẹn?',
    readTime: '3 phút đọc',
    summary:
      'Việc diễn đạt thành câu chữ rõ ràng giúp chuyển cảm xúc mơ hồ thành hình hài cụ thể để bộ não bớt phải “giữ hộ” trong trí nhớ.',
    bodyParagraphs: [
      'Những điều chưa kịp nói sau một cuộc chia tay thường tạo ra cảm giác dang dở kéo dài. Khi giữ toàn bộ trong đầu, cùng một câu chuyện có thể tự tua đi tua lại hàng chục lần.',
      'Khi bạn viết thành một lá thư không cần gửi cho ai, bạn đang tạo một ranh giới an toàn: mình được nói hết sự thật cảm xúc lúc này mà không làm tổn thương thêm chính mình hay người kia.',
      'Nếu muốn kết thúc hẳn lưu trữ, bạn có thể dùng tùy chọn Hoá tro (xoá vĩnh viễn khỏi máy chủ), hoặc chọn niêm phong tạm thời đến một ngày đủ bình tĩnh để đọc lại.',
    ],
    groundingTip: 'Gợi ý thực hành: Mở Cho riêng mình -> Thư chưa gửi; giới hạn viết khoảng 15 phút rồi dừng.',
  },
  {
    id: '10-minute-pause',
    shortLabel: 'Khoảng dừng 10p',
    title: 'Làm gì trong 10 phút khi bỗng dưng muốn nhắn lại cho người cũ?',
    readTime: '2 phút đọc',
    summary:
      'Cơn thôi thúc gửi tin nhắn thường đạt đỉnh trong vài phút đầu rồi dịu dần nếu ta không phản ứng ngay lập tức.',
    bodyParagraphs: [
      'Heali không đặt ra luật cấm “không được nhắn tin”, vì sự ép buộc đôi khi chỉ khiến mình thấy tù túng hơn. Thay vào đó, một khoảng dừng ngắn 10 phút giúp bạn tách giữa “cơn nhớ nhất thời” và “mong muốn thực sự”.',
      'Trong khoảng dừng đó, hãy thử tự hỏi: mình đang mong đợi điều gì từ tin nhắn này — một lời giải thích, cảm giác được nhớ tới, hay chỉ đang muốn bớt trống trải ngay phút này?',
      'Bạn có thể gõ thử tin nhắn định gửi vào ô nháp riêng tư (không ai đọc được) rồi chuyển nó thành Thư chưa gửi trước khi quyết định có bấm nút gửi ngoài đời thật hay không.',
    ],
    groundingTip: 'Gợi ý thực hành: Bấm nút “Tôi sắp nhắn cho người cũ” ở góc trên tab Cho riêng mình.',
  },
  {
    id: 'supporting-a-friend',
    shortLabel: 'Ở bên bạn bè',
    title: 'Cách ở bên một người bạn đang buồn mà không vô tình làm họ nặng thêm',
    readTime: '3 phút đọc',
    summary:
      'Người đang đau thường không cần giải pháp ngay lập tức; sự hiện diện bình thản và không phán xét có giá trị lớn hơn nhiều lời khuyên.',
    bodyParagraphs: [
      'Khi thấy bạn mình buồn, phản xạ tốt bụng của ta hay là nói: “Rồi sẽ qua thôi”, “Sao không quên đi cho nhẹ”, hoặc vội phân tích lỗi của người kia. Nhưng đôi khi những câu đó vô tình khiến người nghe cảm thấy mình phải cố vui lên cho người khác yên tâm.',
      'Thay vào đó, bạn có thể nói rất ngắn: “Mình biết đoạn này thật sự khó. Không cần giải thích nhiều đâu, hôm nay nếu muốn ngồi yên hoặc uống ly nước với mình thì nhắn nhé.”',
      'Nếu người bạn đó xuất hiện dấu hiệu tự làm hại bản thân hoặc bế tắc kéo dài, đừng gánh một mình — hãy nhẹ nhàng đồng hành cùng họ liên hệ gia đình hoặc bác sĩ, tổng đài y tế gần nhất.',
    ],
    groundingTip: 'Bạn có thể tạo một liên kết “Gửi một ngọn đèn” ẩn danh có nút tắt ngay để bạn ấy tự chọn đọc lúc sẵn sàng.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Heali có miễn phí không và có quảng cáo không?',
    a: 'Không gian tự chăm sóc, nhật ký, thư chưa gửi, thở chậm, âm thanh dịu nhẹ và hồ hoa đăng trên Heali hoàn toàn miễn phí và không chèn quảng cáo. Heali cũng không bán dữ liệu hay khai thác nỗi đau làm nội dung thương mại.',
  },
  {
    q: 'Tôi có cần tạo tài khoản bằng email hay số điện thoại không?',
    a: 'Không. Bạn dùng ngay lập tức dưới dạng phiên ẩn danh. Nếu muốn sang máy khác mà vẫn giữ nhật ký riêng tư, bạn chỉ cần tạo một Mã khôi phục tự lưu trong phần Hồ sơ.',
  },
  {
    q: 'Nhật ký và Thư chưa gửi của tôi có bị đọc hoặc dùng để huấn luyện AI không?',
    a: 'Không. Toàn bộ nhật ký, check-in tâm trạng và thư chưa gửi được mã hóa AES-256-GCM trước khi lưu. Khi bạn bấm “Hoá tro (xoá hẳn)”, nội dung thư bị ghi đè và xóa khỏi cơ sở dữ liệu máy chủ. Hệ thống không dùng bài viết của bạn để huấn luyện AI.',
  },
  {
    q: 'Heali có thay thế bác sĩ hay chuyên gia tâm lý không?',
    a: 'Không. Heali là góc trú tạm tự chăm sóc và phản chiếu. Nếu nỗi buồn kéo dài trên 2–3 tuần, làm ảnh hưởng giấc ngủ, ăn uống hoặc xuất hiện ý nghĩ tự hại, vui lòng liên hệ đường dây cấp cứu 115, bác sĩ hoặc chuyên viên tâm lý có chứng chỉ.',
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  language = 'vi',
  lowMotion = false,
  onChangeLanguage,
  onEnterApp,
  onOpenLanternNight,
  onOpenSendGift,
  onOpenDailyCard,
  onOpenHelpline,
  onOpenQuarterlyReport,
  onOpenPartnerInquiry,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(ETHICAL_ARTICLES[0].id);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const isEn = language === 'en';
  const activeArticle =
    ETHICAL_ARTICLES.find((a) => a.id === selectedArticleId) || ETHICAL_ARTICLES[0];

  return (
    <div className="min-h-screen bg-[#f4f4ed] dark:bg-[#141a15] text-[#273829] dark:text-[#edf2e8] flex flex-col">
      {/* Strict 3-Zone Header: Brand | 4 Single-line Nav Links | 1 Primary CTA */}
      <header className="sticky top-0 z-40 bg-[#fafaf4]/95 dark:bg-[#182019]/95 backdrop-blur-sm border-b border-[#e2e6da] dark:border-[#2c3a2e] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <a
            href="/gioi-thieu"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 shrink-0 min-h-[44px]"
          >
            <Leaf className="w-5 h-5 text-[#496946] dark:text-[#8eb984]" />
            <span className="text-2xl font-bold font-serif-healing">
              heali<span className="text-[#496946] dark:text-[#8eb984]">.</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6" aria-label="Điều hướng giới thiệu">
            <a href="#triet-ly" className="text-sm font-medium text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-white whitespace-nowrap">
              Triết lý
            </a>
            <a href="#tinh-nang" className="text-sm font-medium text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-white whitespace-nowrap">
              Trải nghiệm
            </a>
            <a href="#kien-thuc" className="text-sm font-medium text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-white whitespace-nowrap">
              Góc hiểu mình
            </a>
            <a href="#co-van" className="text-sm font-medium text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-white whitespace-nowrap">
              Minh bạch
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {onChangeLanguage && (
              <button
                type="button"
                onClick={() => onChangeLanguage(isEn ? 'vi' : 'en')}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs font-bold whitespace-nowrap"
                aria-label="Chuyển ngôn ngữ VI / EN"
              >
                {isEn ? 'VI' : 'EN'}
              </button>
            )}
            <button
              type="button"
              onClick={onEnterApp}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition shadow-sm"
            >
              <span>{isEn ? 'Open Heali' : 'Vào góc nhỏ của bạn'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-14 heali-stage-enter">
        {/* 1. Immersive Interactive 3D Sanctuary Hero */}
        <section>
          <SanctuaryScene3D
            variant="landing"
            lowMotion={lowMotion}
            allowPureViewToggle
            className="min-h-[430px] sm:min-h-[490px]"
            scrimClassName="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0d1711]/92 via-[#0e1a13]/68 to-transparent"
          >
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[430px] sm:min-h-[490px] max-w-2xl text-[#f4f4ed]">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#b6dbaf]">
                Ẩn danh · Không phán xét · Không quảng cáo
              </div>

              <div className="space-y-4 my-auto py-4">
                <h1 className="text-3xl sm:text-5xl font-bold font-serif-healing leading-[1.16] text-white [text-wrap:balance]">
                  Một góc nhỏ yên tĩnh cho lúc lòng vỡ.
                </h1>
                <p className="text-sm sm:text-lg text-[#d8e3d6] leading-relaxed max-w-xl">
                  Cho những đêm khó ngủ hoặc sau một cuộc chia tay — nơi đặt suy nghĩ xuống nhẹ nhàng bên mặt hồ đèn hoa đăng, không phải giải thích với ai.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#517448] hover:bg-[#416039] text-white text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition shadow-md"
                  >
                    <span>Mở không gian Heali ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSendGift}
                    className="min-h-[48px] px-5 py-3 rounded-2xl bg-[#16231a]/85 hover:bg-[#1f3124] border border-[#4f6d55]/60 text-[#f2f6ee] text-sm font-semibold inline-flex items-center gap-2 transition"
                  >
                    <Flame className="w-4 h-4 text-[#f4c66c]" />
                    <span>Gửi ngọn đèn cho bạn</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#bfd0be]">
                <button
                  type="button"
                  onClick={onOpenLanternNight}
                  className="hover:text-white underline font-medium"
                >
                  Đêm Hoa Đăng cộng đồng
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenHelpline}
                  className="text-[#f2afa1] hover:text-white underline font-medium"
                >
                  Đường dây hỗ trợ 115 / 111
                </button>
              </div>
            </div>
          </SanctuaryScene3D>
        </section>

        {/* 2. Triết lý & 3 Lời hứa trung thực */}
        <section id="triet-ly" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-healing">Ba nguyên tắc nền tảng</h2>
              <p className="text-sm text-[#4e624f] dark:text-[#b0c0b2]">
                Sự an toàn và quyền tự chủ luôn đứng trước mọi chỉ số.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VI_COPY.promises.map((promise, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm space-y-2.5 heali-card-surface"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#e6efe2] dark:bg-[#243427] flex items-center justify-center text-[#46613e] dark:text-[#98c18e]">
                  {idx === 0 ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : idx === 1 ? (
                    <Heart className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <p className="text-base font-medium leading-relaxed">{promise}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-[#eef3ea] dark:bg-[#1e2a20] border border-[#c5d6bf] dark:border-[#374a3a] space-y-2.5">
              <div className="flex items-center gap-2 text-base font-bold text-[#243627] dark:text-[#edf2e8]">
                <CheckCircle2 className="w-5 h-5 text-[#46613e] dark:text-[#98c18e]" />
                <span>Heali đồng hành nhẹ nhàng</span>
              </div>
              <ul className="space-y-1.5 text-sm text-[#354b37] dark:text-[#cbd6cc]">
                <li>• Nhật ký &amp; Thư chưa gửi mã hóa · Hoá tro xóa vĩnh viễn.</li>
                <li>• Hạ nhiệt 3 phút: thở 4-7-8, chạm đất 5-4-3-2-1, thanh âm mưa.</li>
                <li>• Khoảng dừng 10 phút trước khi vội nhắn cho người cũ.</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] space-y-2.5">
              <div className="flex items-center gap-2 text-base font-bold text-[#6e2d1f] dark:text-[#f2c6bc]">
                <XCircle className="w-5 h-5 text-[#9b3d2b]" />
                <span>Heali KHÔNG thay thế điều gì</span>
              </div>
              <ul className="space-y-1.5 text-sm text-[#4e624f] dark:text-[#cbd6cc]">
                <li>• Không thay thế bác sĩ hay trị liệu tâm lý chuyên môn.</li>
                <li>• Không bói toán định đoạt hay chẩn đoán bệnh lý.</li>
                <li>• Không dùng streaks, điểm số hay bảng xếp hạng gây áp lực.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Trải nghiệm thực tế — Interactive Tiles */}
        <section id="tinh-nang" className="space-y-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-healing">Bắt đầu từ điều bạn cần lúc này</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={onEnterApp}
              className="p-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] hover:border-[#46613e] text-left space-y-2 shadow-sm heali-card-surface"
            >
              <Mail className="w-5 h-5 text-[#46613e] dark:text-[#98c18e]" />
              <h3 className="text-base font-bold">Thư chưa gửi &amp; Hoá tro</h3>
              <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
                Viết điều còn nghẹn, niêm phong hoặc xoá vĩnh viễn.
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenDailyCard}
              className="p-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] hover:border-[#46613e] text-left space-y-2 shadow-sm heali-card-surface"
            >
              <Sparkles className="w-5 h-5 text-[#b37e27]" />
              <h3 className="text-base font-bold">Thẻ phản chiếu hôm nay</h3>
              <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
                Câu hỏi tự vấn dịu nhẹ · Tải ảnh sạch không lộ tên.
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenSendGift}
              className="p-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] hover:border-[#46613e] text-left space-y-2 shadow-sm heali-card-surface"
            >
              <Flame className="w-5 h-5 text-[#b37e27]" />
              <h3 className="text-base font-bold">Gửi ngọn đèn cho bạn</h3>
              <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
                Link ẩn danh an toàn giúp bạn bè bớt cô đơn.
              </p>
            </button>

            <button
              type="button"
              onClick={onOpenLanternNight}
              className="p-5 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] hover:border-[#46613e] text-left space-y-2 shadow-sm heali-card-surface"
            >
              <Wind className="w-5 h-5 text-[#46613e] dark:text-[#98c18e]" />
              <h3 className="text-base font-bold">Đêm Hoa Đăng cộng đồng</h3>
              <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#b0c0b2]">
                Thắp đèn bình an trên mặt hồ mỗi Rằm, 14/2, 11/11.
              </p>
            </button>
          </div>
        </section>

        {/* 4. Góc hiểu mình — Clean Tabbed Editorial Reader (Zero vertical accordion clutter) */}
        <section id="kien-thuc" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#46613e] dark:text-[#98c18e]">
                <BookOpen className="w-4 h-4" />
                <span>Đọc chậm · Hiểu mình</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-healing mt-1">
                Góc hiểu mình qua những đêm dài
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ETHICAL_ARTICLES.map((art) => {
                const active = art.id === activeArticle.id;
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-[#46613e] text-white shadow-sm'
                        : 'bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] text-[#4b604d] dark:text-[#b0c0b2] hover:border-[#46613e]'
                    }`}
                  >
                    {art.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <article className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-8 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#46613e] dark:text-[#98c18e]">
                {activeArticle.readTime}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif-healing">{activeArticle.title}</h3>
              <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] italic">{activeArticle.summary}</p>
            </div>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-[#2d3f2f] dark:text-[#dce5da] pt-2 border-t border-[#e5e2d5] dark:border-[#2e3d31]">
              {activeArticle.bodyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#223125] border border-[#c7d6c0] dark:border-[#3a523d] text-xs sm:text-sm space-y-1">
              <div className="font-bold text-[#243627] dark:text-[#edf2e8]">{activeArticle.groundingTip}</div>
              <div className="text-[#4e624f] dark:text-[#b0c0b2]">
                {VI_COPY.realWorldBridge.disclaimer}{' '}
                <button type="button" onClick={onOpenHelpline} className="underline text-[#9b3d2b] dark:text-[#e9a392] font-semibold">
                  Xem đường dây hỗ trợ khẩn cấp.
                </button>
              </div>
            </div>
          </article>
        </section>

        {/* 5. Minh bạch Cố vấn & Đối tác (Trung thực tuyệt đối — không tự bịa) */}
        <section id="co-van" className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#46613e] dark:text-[#98c18e] shrink-0 mt-1" />
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif-healing">
                Cố vấn chuyên môn &amp; Đối tác (Trạng thái minh bạch)
              </h2>
              <p className="text-sm sm:text-base text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">
                Heali đang trong quá trình mời xác nhận chính thức từ chuyên gia tham vấn tâm lý, phòng tư vấn học đường và luật sư bảo vệ dữ liệu cá nhân tại Việt Nam. <strong>Chúng tôi không tự điền tên cố vấn, logo đối tác hay lời chứng thực khi chưa có văn bản đồng ý.</strong>
              </p>
              <p className="text-xs sm:text-sm text-[#576c59] dark:text-[#a6b7a8]">
                Các tổ chức sinh viên, trung tâm công tác xã hội hoặc doanh nghiệp quan tâm tài trợ chi phí vận hành kiểm duyệt (hoàn toàn không được cấp quyền xem dữ liệu người dùng) có thể gửi đề xuất hợp tác minh bạch hoặc xem báo cáo cộng đồng theo quý.
              </p>
              {(onOpenQuarterlyReport || onOpenPartnerInquiry) && (
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {onOpenQuarterlyReport && (
                    <button
                      type="button"
                      onClick={onOpenQuarterlyReport}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#eef3ea] dark:bg-[#223125] border border-[#c5d6bf] dark:border-[#374a3a] text-xs sm:text-sm font-semibold"
                    >
                      Xem Báo cáo cộng đồng theo quý
                    </button>
                  )}
                  {onOpenPartnerInquiry && (
                    <button
                      type="button"
                      onClick={onOpenPartnerInquiry}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs sm:text-sm font-semibold"
                    >
                      Hợp tác trường học &amp; tổ chức (Không truy cập dữ liệu cá nhân)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-serif-healing">Câu hỏi thường gặp</h2>
          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const expanded = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(expanded ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-semibold text-sm sm:text-base"
                  >
                    <span>{item.q}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>
                  {expanded && (
                    <div className="px-4 sm:px-5 pb-4 text-sm text-[#4e624f] dark:text-[#b0c0b2] leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e2e6da] dark:border-[#2c3a2e] bg-[#fafaf4] dark:bg-[#182019] px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-[#576c59] dark:text-[#a6b7a8]">
          <div className="space-y-1">
            <div className="font-bold text-[#273829] dark:text-[#edf2e8] font-serif-healing text-base">
              heali. — Một góc nhỏ yên tĩnh cho lúc lòng vỡ
            </div>
            <div>Thông tin chỉ mang tính tự chăm sóc và phản chiếu, không phải chẩn đoán y khoa.</div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={onOpenLanternNight} className="hover:underline font-medium">
              Đêm Hoa Đăng
            </button>
            {onOpenQuarterlyReport && (
              <button type="button" onClick={onOpenQuarterlyReport} className="hover:underline font-medium">
                Báo cáo quý
              </button>
            )}
            <button type="button" onClick={onOpenHelpline} className="hover:underline text-[#9b3d2b] dark:text-[#e9a392] font-semibold">
              Đường dây khẩn cấp
            </button>
            <button type="button" onClick={onEnterApp} className="hover:underline font-semibold text-[#46613e] dark:text-[#98c18e]">
              Vào ứng dụng
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
