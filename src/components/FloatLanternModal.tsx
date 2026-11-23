import React, { useState } from 'react';
import type { Lantern } from '../services/api';
import { api } from '../services/api';
import { X, Sparkles, Send, Flame } from 'lucide-react';

interface FloatLanternModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanternFloated: (lantern: Lantern) => void;
}

export const FloatLanternModal: React.FC<FloatLanternModalProps> = ({
  isOpen,
  onClose,
  onLanternFloated,
}) => {
  const [message, setMessage] = useState('');
  const [color, setColor] = useState<'pink' | 'gold' | 'lavender' | 'moon'>('gold');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const colorOptions: Array<{
    id: 'gold' | 'pink' | 'lavender' | 'moon';
    name: string;
    meaning: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      id: 'gold',
      name: 'Hổ Phách Ấm Áp',
      meaning: 'Nguyện cầu ánh sáng và niềm hy vọng mới',
      bgClass: 'bg-amber-400',
      borderClass: 'border-amber-300',
    },
    {
      id: 'pink',
      name: 'Sen Hồng Thấu Cảm',
      meaning: 'Chữa lành vết thương lòng & tha thứ',
      bgClass: 'bg-rose-400',
      borderClass: 'border-rose-300',
    },
    {
      id: 'lavender',
      name: 'Thạch Anh Tím',
      meaning: 'Xua tan âu lo, tìm lại tĩnh lặng',
      bgClass: 'bg-purple-400',
      borderClass: 'border-purple-300',
    },
    {
      id: 'moon',
      name: 'Bạch Ngọc Thanh Khiết',
      meaning: 'Buông bỏ muộn phiền, mở lòng đón nhận',
      bgClass: 'bg-blue-100',
      borderClass: 'border-blue-200',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Hãy viết một vài dòng gửi gắm theo dòng nước bạn nhé.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const newLantern = await api.floatLantern(message, color);
      onLanternFloated(newLantern);
      setMessage('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Chưa thể thả hoa đăng. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const samplePrompts = [
    'Nguyện cho lòng mình thôi day dứt về những điều đã qua.',
    'Gửi lời cảm ơn người đã từng ghé ngang cuộc đời, chúc người bình an.',
    'Hôm nay tôi tha thứ cho chính mình vì đã không đủ dũng cảm.',
    'Cầu mong một ngày mai nhiều tiếng cười hơn nước mắt.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#14152b] border border-purple-500/30 p-6 sm:p-7 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-100">Thả Hoa Đăng Cầu Nguyện</h2>
              <p className="text-xs text-purple-200/70">
                Thắp lên ngọn đèn ấm, gửi nỗi niềm trôi theo dòng nước đêm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Pick Color */}
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-2">
              Chọn màu sắc hoa đăng
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {colorOptions.map(opt => {
                const isSelected = color === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColor(opt.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'border-amber-400/80 bg-purple-900/40 shadow-md'
                        : 'border-purple-500/20 bg-[#191b36]/60 hover:border-purple-400/40'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full mt-0.5 shrink-0 ${opt.bgClass} shadow-sm`} />
                    <div>
                      <div className="text-xs font-medium text-white">{opt.name}</div>
                      <div className="text-[10px] text-purple-200/60 leading-tight mt-0.5">{opt.meaning}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-purple-200">
                Lời tâm sự hoặc ước nguyện muốn gửi gắm
              </label>
              <span className="text-[11px] text-purple-300/60">{message.length}/300</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="Viết ra những điều đang đè nặng trong lòng bạn, hoặc một lời cầu chúc bình an cho chính mình..."
              className="w-full rounded-2xl bg-[#0d0e1f] border border-purple-500/30 p-3.5 text-sm text-purple-100 placeholder:text-purple-400/40 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 resize-none font-serif-healing leading-relaxed"
            />
          </div>

          {/* Quick inspiration chips */}
          <div>
            <div className="text-[11px] text-purple-300/70 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Gợi ý lời nhắn:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/20 text-[11px] text-purple-200/80 hover:text-white hover:border-purple-400/40 transition text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-900/30 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-rose-950/50 hover:opacity-95 active:scale-95 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-amber-200" />
              <span>{isSubmitting ? 'Đang thả hoa đăng...' : 'Thắp Đèn & Thả Trôi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
