import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, Sparkles, Download, Copy, Check, Eye } from 'lucide-react';
import { VI_COPY } from '../i18n/vi';

interface DailyReflectionCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReflectionCard {
  name: string;
  archetype: string;
  reflection: string;
  question: string;
}

const REFLECTION_DECK: ReflectionCard[] = [
  {
    name: 'Ngôi Sao Tĩnh Lặng (The Star)',
    archetype: 'Nhịp thở sau cơn mưa',
    reflection:
      'Bạn không cần phải thấy rõ cả con đường phía trước. Chỉ cần nhận ra mình đang đứng vững trong khoảnh khắc hiện tại đã là một điểm tựa.',
    question: 'Hôm nay, một điều nhỏ nào giúp vai và ngực của mình dịu lại đôi chút?',
  },
  {
    name: 'Ẩn Sĩ (The Hermit)',
    archetype: 'Góc lặng cho riêng mình',
    reflection:
      'Rút lui về một góc yên tĩnh lúc mệt mỏi không phải là trốn tránh, mà là cách giữ gìn năng lượng để nghe rõ điều mình thực sự cần.',
    question: 'Nếu hôm nay không cần chiều lòng ai, mình muốn đối xử nhẹ nhàng với bản thân thế nào?',
  },
  {
    name: 'Mặt Trăng (The Moon)',
    archetype: 'Đêm dài và sương mỏng',
    reflection:
      'Cảm xúc nhớ nhung hay bất an vào ban đêm thường khuếch đại nỗi buồn hơn thực tế ban ngày. Không cần đưa ra quyết định lớn lúc lòng còn sương mù.',
    question: 'Điều gì mình có thể tạm đặt sang sáng mai mới nghĩ tiếp?',
  },
  {
    name: 'Điềm Tĩnh (Temperance)',
    archetype: 'Pha dịu từng nhịp nhỏ',
    reflection:
      'Chữa lành không phải phép màu qua một đêm, mà là sự kiên nhẫn đặt từng mảnh nhỏ trở về đúng chỗ của nó.',
    question: 'Hôm nay mình có đang ép bản thân phải “ổn” quá nhanh không?',
  },
  {
    name: 'Nữ Tu Tế (The High Priestess)',
    archetype: 'Trực giác lắng nghe',
    reflection:
      'Có những câu trả lời không nằm ở tin nhắn của người khác, mà nằm ở ranh giới bình an mà chính bạn đang tự học cách đặt ra.',
    question: 'Nếu một người bạn thân đang ở trong hoàn cảnh của mình, mình sẽ khuyên họ điều gì?',
  },
  {
    name: 'Mặt Trời Dịu (The Sun)',
    archetype: 'Hơi ấm vừa đủ',
    reflection:
      'Sự ấm áp không nhất thiết phải ồn ào. Một cốc nước ấm, năm phút ánh nắng sáng hay một bữa ăn tử tế đều đáng được ghi nhận.',
    question: 'Điều nhỏ bé nào hôm nay vẫn đang âm thầm nâng đỡ mình?',
  },
  {
    name: 'Bốn Thanh Kiếm (Four of Swords)',
    archetype: 'Cho phép mình nghỉ ngơi',
    reflection:
      'Khi đầu óc đã suy nghĩ quá nhiều vòng, hành động dũng cảm nhất lúc này đôi khi là tắt màn hình và đặt điện thoại xuống sớm một chút.',
    question: 'Cơ thể mình đang gửi tín hiệu mệt ở đâu nhất ngay bây giờ?',
  },
];

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const DailyReflectionCardModal: React.FC<DailyReflectionCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedQuestion, setCopiedQuestion] = useState(false);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const card = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < todayKey.length; i++) {
      hash = (hash * 31 + todayKey.charCodeAt(i)) % 10007;
    }
    return REFLECTION_DECK[hash % REFLECTION_DECK.length];
  }, [todayKey]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 720;
    const h = 900;
    canvas.width = w;
    canvas.height = h;

    // Botanical dusk background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#19261d');
    grad.addColorStop(0.55, '#223327');
    grad.addColorStop(1, '#141e17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle soft glow
    const rad = ctx.createRadialGradient(w / 2, 230, 10, w / 2, 230, 260);
    rad.addColorStop(0, 'rgba(229, 194, 123, 0.20)');
    rad.addColorStop(1, 'rgba(229, 194, 123, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);

    // Outer cream frame
    ctx.strokeStyle = 'rgba(244, 240, 224, 0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, w - 72, h - 72);

    ctx.strokeStyle = 'rgba(229, 194, 123, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    // Top label (zero personal data)
    ctx.fillStyle = '#e5c27b';
    ctx.font = '600 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`THẺ PHẢN CHIẾU HÔM NAY · ${todayKey}`, w / 2, 110);

    // Ornamental circle
    ctx.beginPath();
    ctx.arc(w / 2, 210, 48, 0, Math.PI * 2);
    ctx.strokeStyle = '#e5c27b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f4ebd0';
    ctx.font = '600 28px Georgia, serif';
    ctx.fillText('✦', w / 2, 220);

    // Card Name
    ctx.fillStyle = '#f7f4ea';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText(card.name, w / 2, 320);

    ctx.fillStyle = '#b4c9b6';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText(card.archetype, w / 2, 360);

    // Divider
    ctx.strokeStyle = 'rgba(229, 194, 123, 0.45)';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 70, 395);
    ctx.lineTo(w / 2 + 70, 395);
    ctx.stroke();

    // Reflection text
    ctx.fillStyle = '#e4eadf';
    ctx.font = '23px Georgia, serif';
    const refLines = wrapTextLines(ctx, card.reflection, w - 170);
    let y = 455;
    for (const line of refLines) {
      ctx.fillText(line, w / 2, y);
      y += 36;
    }

    // Question Box
    const boxY = Math.max(y + 28, 610);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(88, boxY, w - 176, 150);
    ctx.strokeStyle = 'rgba(229, 194, 123, 0.35)';
    ctx.strokeRect(88, boxY, w - 176, 150);

    ctx.fillStyle = '#e5c27b';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('CÂU HỎI TỰ VẤN', w / 2, boxY + 38);

    ctx.fillStyle = '#faf7ef';
    ctx.font = 'italic 22px Georgia, serif';
    const qLines = wrapTextLines(ctx, `“${card.question}”`, w - 220);
    let qy = boxY + 80;
    for (const ql of qLines) {
      ctx.fillText(ql, w / 2, qy);
      qy += 32;
    }

    // Footer disclaimer (zero PII)
    ctx.fillStyle = '#9db4a0';
    ctx.font = '15px sans-serif';
    ctx.fillText('heali. · Gợi mở suy ngẫm (không chứa dữ liệu cá nhân)', w / 2, h - 78);
  }, [isOpen, card, todayKey]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `heali-the-phan-chieu-${todayKey}.png`;
    a.click();
  };

  const handleCopyQuestion = async () => {
    try {
      await navigator.clipboard.writeText(`${card.name}\n“${card.question}” — Thẻ phản chiếu từ Heali`);
      setCopiedQuestion(true);
      window.setTimeout(() => setCopiedQuestion(false), 2400);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-card-title"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 text-[#273829] dark:text-[#edf2e8] shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#46613e] dark:text-[#98c18e]">
              <Sparkles className="w-4 h-4" />
              <span>Thẻ Phản Chiếu Mỗi Ngày · Chia sẻ không lộ riêng tư</span>
            </div>
            <h2 id="daily-card-title" className="text-xl font-bold font-serif-healing">
              {card.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#5e7260] dark:text-[#a6b7a8] hover:bg-[#ecebe0] dark:hover:bg-[#243227]"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Live PNG Canvas Preview */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#46613e] dark:text-[#98c18e]">
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước ảnh chia sẻ (khổ đứng)</span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#d6d3c6] dark:border-[#324236] bg-[#141e17] shadow-md">
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>

          {/* Reflection & Controls */}
          <div className="md:col-span-6 space-y-4">
            <div className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] space-y-2">
              <div className="text-xs font-semibold text-[#46613e] dark:text-[#98c18e]">
                Gợi mở hôm nay · {card.archetype}
              </div>
              <p className="text-sm sm:text-base font-serif-healing leading-relaxed">{card.reflection}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#223125] border border-[#c7d6c0] dark:border-[#3a523d] space-y-1.5">
              <div className="text-xs font-bold text-[#2d452a] dark:text-[#cfe3c9]">
                Câu hỏi tự vấn hôm nay
              </div>
              <p className="text-sm sm:text-base font-serif-healing italic">“{card.question}”</p>
            </div>

            <p className="text-xs text-[#576c59] dark:text-[#a6b7a8] leading-relaxed">
              {VI_COPY.spiritual.disclaimer} Ảnh tải về hoàn toàn <strong>không gắn tên người dùng, điểm tâm trạng hay nhật ký cá nhân</strong> của bạn.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="min-h-[46px] flex-1 px-4 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh PNG xem trước</span>
              </button>
              <button
                type="button"
                onClick={() => void handleCopyQuestion()}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition"
              >
                {copiedQuestion ? <Check className="w-4 h-4 text-[#46613e]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedQuestion ? 'Đã chép câu hỏi' : 'Chép câu hỏi'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
