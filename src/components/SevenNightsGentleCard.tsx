import React from 'react';
import { api } from '../services/api';
import { Check, Moon, ArrowRight } from 'lucide-react';

interface SevenNightsGentleCardProps {
  completedNights: number[];
  onToggleNight: (night: number) => void;
  onOpenAction: (target: 'breathe' | 'mood' | 'journal' | 'grounding' | 'letters' | 'audio' | 'helpline') => void;
}

const SEVEN_NIGHTS: Array<{
  day: number;
  title: string;
  desc: string;
  actionLabel: string;
  target: 'breathe' | 'mood' | 'journal' | 'grounding' | 'letters' | 'audio' | 'helpline';
}> = [
  {
    day: 1,
    title: 'Đêm 1 · Thả lỏng vai với 3 phút thở chậm',
    desc: 'Chỉ ngồi yên và thở nhịp 4-7-8, không cần nghĩ ra giải pháp nào tối nay.',
    actionLabel: 'Mở thở 4-7-8',
    target: 'breathe',
  },
  {
    day: 2,
    title: 'Đêm 2 · Gọi tên một cảm xúc trên Bánh xe',
    desc: 'Nhìn thẳng cảm giác hôm nay (tê liệt, nhớ nhung hay kiệt sức) thay vì tự trách.',
    actionLabel: 'Check-in nhẹ',
    target: 'mood',
  },
  {
    day: 3,
    title: 'Đêm 3 · Viết 5 phút không cần hay',
    desc: 'Viết ra giấy chuyện vừa xảy ra để đầu óc đỡ quay cuồng trước khi ngủ.',
    actionLabel: 'Mở Nhật ký',
    target: 'journal',
  },
  {
    day: 4,
    title: 'Đêm 4 · Chạm đất 5-4-3-2-1',
    desc: 'Kéo chú ý về 5 thứ nhìn thấy và 4 bề mặt chạm vào được ngay trong phòng.',
    actionLabel: 'Tập chạm đất',
    target: 'grounding',
  },
  {
    day: 5,
    title: 'Đêm 5 · Đặt điều chưa nói vào Thư chưa gửi',
    desc: 'Viết ra câu chữ muốn gửi rồi niêm phong hoặc Hoá tro khi thấy sẵn sàng.',
    actionLabel: 'Viết Thư',
    target: 'letters',
  },
  {
    day: 6,
    title: 'Đêm 6 · Nghe 2 phút tiếng mưa êm',
    desc: 'Chế độ chỉ âm thanh cho lúc mắt đã mỏi và không muốn đọc chữ.',
    actionLabel: 'Nghe mưa êm',
    target: 'audio',
  },
  {
    day: 7,
    title: 'Đêm 7 · Quay về một kết nối thật ngoài đời',
    desc: 'Nhắn một câu bình thường cho người bạn tin hoặc rủ nhau uống nước.',
    actionLabel: 'Mẫu tin nhắn nhẹ',
    target: 'helpline',
  },
];

export const SevenNightsGentleCard: React.FC<SevenNightsGentleCardProps> = ({
  completedNights,
  onToggleNight,
  onOpenAction,
}) => {
  const handleToggle = (day: number) => {
    const wasDone = completedNights.includes(day);
    onToggleNight(day);
    if (!wasDone) {
      void api.trackHealthyMetric('challenge_step_done');
    }
  };

  return (
    <section className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#46613e] dark:text-[#98c18e]">
            <Moon className="w-4 h-4" />
            <span>Nhịp nhẹ · Không đếm chuỗi ngày, không phạt bỏ lỡ</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-serif-healing">
            Thử thách dịu dàng: 7 đêm tử tế với mình
          </h2>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#eef3ea] dark:bg-[#233126] text-[#355432] dark:text-[#b4deb0] tabular-nums self-start sm:self-center">
          Đã ghé qua {completedNights.length}/7 bước
        </span>
      </div>

      <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
        Bạn có thể làm cách quãng nhiều ngày hoặc bỏ qua bất kỳ đêm nào không hợp lúc này. Dữ liệu chỉ giữ trên thiết bị của bạn.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {SEVEN_NIGHTS.map((step) => {
          const done = completedNights.includes(step.day);
          return (
            <div
              key={step.day}
              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 transition ${
                done
                  ? 'bg-[#e6efe2] dark:bg-[#243427] border-[#b7ccb0] dark:border-[#3e5842]'
                  : 'bg-[#f1efe5] dark:bg-[#232f26] border-[#dcdad0] dark:border-[#324236]'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggle(step.day)}
                aria-label={`Đánh dấu hoàn thành ${step.title}`}
                className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition ${
                  done
                    ? 'bg-[#46613e] border-[#46613e] text-white'
                    : 'bg-white dark:bg-[#131a15] border-[#c4c8bc] dark:border-[#3b4e3f]'
                }`}
              >
                {done && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="text-sm font-bold text-[#243627] dark:text-[#edf2e8]">{step.title}</div>
                <p className="text-xs text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">{step.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => onOpenAction(step.target)}
                className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#d6d3c6] dark:border-[#324236] hover:border-[#46613e] text-xs font-semibold text-[#46613e] dark:text-[#98c18e] inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
