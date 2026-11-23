import React, { useState, useEffect } from 'react';
import type { Wish } from '../services/api';
import { api } from '../services/api';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import {
  Plus,
  Heart,
  TreeDeciduous,
  CheckCircle,
  X,
  Send,
  Leaf,
  CheckCircle2,
} from 'lucide-react';

interface WishTreeViewProps {
  lowMotion?: boolean;
}

export const WishTreeView: React.FC<WishTreeViewProps> = ({ lowMotion = false }) => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isHangingWish, setIsHangingWish] = useState(false);

  // Form states
  const [wishText, setWishText] = useState('');
  const [actionCommitment, setActionCommitment] = useState('');
  const [tag, setTag] = useState<Wish['tag']>('healing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const tags = [
    { id: 'all', label: 'Tất cả' },
    { id: 'healing', label: 'Chữa lành' },
    { id: 'self_love', label: 'Thương mình' },
    { id: 'letting_go', label: 'Buông bỏ' },
    { id: 'inner_peace', label: 'Tĩnh tại' },
    { id: 'future', label: 'Tương lai' },
  ];

  const healthyActionsSuggestions = [
    'Tối nay tôi sẽ tắt điện thoại trước 23h và ngủ một giấc thật sâu.',
    'Tôi sẽ pha một ấm trà hoa cúc và dành 15 phút lắng nghe hơi thở.',
    'Tôi sẽ đi dạo bộ dưới tán cây công viên và mỉm cười với chính mình.',
    'Tôi sẽ không tìm kiếm tin tức về người cũ nữa, để lòng được thanh thản.',
    'Tôi sẽ tự nấu cho mình một bữa ăn thật ấm áp và đủ chất.',
  ];

  useEffect(() => {
    void loadWishes();
  }, []);

  const loadWishes = async () => {
    setIsLoading(true);
    try {
      const list = await api.getWishes();
      setWishes(list);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3200);
  };

  const handleSupportWish = async (wish: Wish) => {
    try {
      const res = await api.supportWish(wish.id);
      setWishes((prev) =>
        prev.map((w) => (w.id === wish.id ? { ...w, supports: res.supports } : w))
      );
      showToast(res.active ? 'Đã gửi lời chúc lành ấm áp ✨' : 'Đã rút lại lời chúc');
    } catch {
      showToast('Chưa thể gửi lời chúc');
    }
  };

  const handleHangWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) {
      showToast('Vui lòng viết điều ước nguyện của bạn');
      return;
    }
    setIsSubmitting(true);
    try {
      const newWish = await api.hangWish({
        wishText,
        actionCommitment:
          actionCommitment.trim() || 'Hôm nay tôi sẽ đối xử thật dịu dàng với chính mình.',
        tag,
      });
      setWishes((prev) => [newWish, ...prev]);
      setIsHangingWish(false);
      setWishText('');
      setActionCommitment('');
      showToast('Thẻ ước nguyện đã được treo lên Cây Nguyện Ước');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể treo thẻ ước nguyện');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWishes =
    selectedTag === 'all' ? wishes : wishes.filter((w) => w.tag === selectedTag);

  return (
    <div className="space-y-5 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#273829] border border-[#46613e] px-4 py-2.5 text-xs text-[#faf7ef] shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#a8e0a1] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 3D Interactive Bonsai Wish Tree Stage */}
      <SanctuaryScene3D
        variant="wishes"
        lowMotion={lowMotion}
        allowPureViewToggle
        className="min-h-[245px] sm:min-h-[275px]"
      >
        <div className="p-5 sm:p-8 flex flex-col justify-between min-h-[245px] sm:min-h-[275px] text-[#f4f4ed]">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#b9e1b3]">
            Khu vườn ý niệm · {wishes.length} dải lụa nguyện ước
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6">
            <div className="space-y-1.5 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white">
                Cây nguyện ước &amp; ý niệm lành
              </h2>
              <p className="text-xs sm:text-sm text-[#d9e5d7]">
                Treo một dải lụa ước lành kèm cam kết nhỏ dịu dàng cho chính bạn hôm nay.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsHangingWish(true)}
              className="min-h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-[#537949] hover:bg-[#43653a] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition active:scale-95 shrink-0 self-start md:self-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Treo dải ước mới</span>
            </button>
          </div>
        </div>
      </SanctuaryScene3D>

      {/* Clean Single-Row Tag Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tags.map((t) => {
          const isSelected = selectedTag === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTag(t.id)}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isSelected
                  ? 'bg-[#46613e] text-white shadow-sm'
                  : 'bg-[#faf7ef] dark:bg-[#1b241d] text-[#4b604d] dark:text-[#b4c4b6] border border-[#dcdad0] dark:border-[#324236] hover:border-[#46613e]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Wish Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcd9cc] dark:border-[#324236]"
            />
          ))}
        </div>
      ) : filteredWishes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm">
          <Leaf className="w-10 h-10 text-[#91a48e] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#243627] dark:text-[#edf2e8]">
            Chưa có thẻ ước nguyện nào trong mục này.
          </p>
          <p className="text-xs text-[#5e7260] dark:text-[#b0c0b2] mt-1">
            Hãy treo lên một ý niệm đẹp để nuôi dưỡng tâm hồn bạn nhé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredWishes.map((wish) => {
            const tagMeta = tags.find((t) => t.id === wish.tag);

            return (
              <div
                key={wish.id}
                className="relative p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm flex flex-col justify-between hover:border-[#b9c6b4] dark:hover:border-[#4c6451] heali-card-surface"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <span className="font-bold text-[#243627] dark:text-[#edf2e8]">{wish.authorNickname}</span>
                    <span className="text-[#46613e] dark:text-[#98c18e] font-semibold">{tagMeta?.label}</span>
                  </div>

                  <div className="text-sm text-[#2d3f2f] dark:text-[#e6ece4] font-serif-healing leading-relaxed italic mb-3.5">
                    “{wish.wishText}”
                  </div>

                  {wish.actionCommitment && (
                    <div className="p-3 rounded-2xl bg-[#e6efe2] dark:bg-[#233226] border border-[#c3d3bd] dark:border-[#3a523d] text-xs text-[#264223] dark:text-[#cfe2cc] flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#46613e] dark:text-[#98c18e] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[11px] text-[#355432] dark:text-[#b4deb0] mb-0.5">
                          Hành động nhỏ hôm nay:
                        </strong>
                        <span className="font-serif-healing">{wish.actionCommitment}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#e6e4d8] dark:border-[#2e3d31] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#5e7260] dark:text-[#a6b7a8] tabular-nums">
                    {new Date(wish.createdAt).toLocaleDateString('vi-VN')}
                  </span>

                  <button
                    type="button"
                    onClick={() => void handleSupportWish(wish)}
                    className="min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-[#273829] dark:text-[#edf2e8] hover:border-[#46613e] transition text-xs font-semibold whitespace-nowrap"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#9a4f46] dark:text-[#e48d83]" />
                    <span>Chúc lành</span>
                    {wish.supports > 0 && (
                      <span className="font-bold text-[#46613e] dark:text-[#98c18e] tabular-nums ml-0.5">
                        {wish.supports}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hang Wish Modal */}
      {isHangingWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl text-[#273829] dark:text-[#edf2e8]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
              <div className="flex items-center gap-2.5">
                <TreeDeciduous className="w-5 h-5 text-[#46613e] dark:text-[#98c18e]" />
                <h3 className="font-bold text-base font-serif-healing">
                  Treo Thẻ Nguyện Ước
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHangingWish(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#5e7260] dark:text-[#a6b7a8]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHangWish} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#243627] mb-1">
                  Chọn chủ đề nguyện ước
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as Wish['tag'])}
                  className="w-full rounded-xl bg-white border border-[#d6d3c6] p-2.5 text-xs text-[#273829] focus:outline-none focus:border-[#46613e]"
                >
                  <option value="healing">Chữa lành tổn thương</option>
                  <option value="self_love">Yêu thương bản thân</option>
                  <option value="letting_go">Buông bỏ quá khứ</option>
                  <option value="inner_peace">Tĩnh tại trong tâm</option>
                  <option value="future">Hướng tới tương lai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243627] mb-1">
                  Ý niệm / Điều ước nguyện của bạn <span className="text-[#9b4b38]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  required
                  maxLength={280}
                  placeholder="Ví dụ: Mong cho trái tim mình đủ bao dung để khép lại quá khứ và đón nhận hạnh phúc mới..."
                  className="w-full rounded-2xl bg-white border border-[#d6d3c6] p-3 text-xs sm:text-sm text-[#273829] placeholder:text-[#8b988b] focus:outline-none focus:border-[#46613e] resize-none font-serif-healing leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3c5c39] mb-1">
                  Cam kết một hành động lành mạnh bạn sẽ làm hôm nay
                </label>
                <textarea
                  rows={2}
                  value={actionCommitment}
                  onChange={(e) => setActionCommitment(e.target.value)}
                  maxLength={280}
                  placeholder="Ví dụ: Hôm nay tôi sẽ đi bộ 20 phút hít thở khí trời và đi ngủ trước 23h..."
                  className="w-full rounded-2xl bg-white border border-[#d6d3c6] p-2.5 text-xs text-[#273829] placeholder:text-[#8b988b] focus:outline-none focus:border-[#46613e] resize-none font-serif-healing leading-relaxed"
                />

                {/* Suggestions */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-[11px] text-[#5e7260] block">Gợi ý hành động nhỏ:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {healthyActionsSuggestions.slice(0, 3).map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActionCommitment(sug)}
                        className="px-2.5 py-1 rounded-xl bg-[#f1efe5] border border-[#dcdad0] text-[11px] text-[#4b604d] hover:text-[#273829] hover:border-[#9eb198] text-left transition"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHangingWish(false)}
                  className="px-4 py-2 rounded-xl bg-[#eef1e8] text-xs font-semibold text-[#3f5440]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang treo...' : 'Treo lên cây ước'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
