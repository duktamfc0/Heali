import React, { useState, useEffect } from 'react';
import type { Confession, CommunityStats } from '../services/api';
import { api } from '../services/api';
import {
  MessageSquareHeart,
  ArrowRight,
  Users,
} from 'lucide-react';
import { VI_COPY } from '../i18n/vi';

interface CommunityPresenceProps {
  onOpenConfessions: () => void;
  onOpenStrangerChat?: () => void;
}

export const CommunityPresence: React.FC<CommunityPresenceProps> = ({
  onOpenConfessions,
  onOpenStrangerChat,
}) => {
  const [recentConfessions, setRecentConfessions] = useState<Confession[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);

  useEffect(() => {
    api.getConfessions('all', 'popular').then((list) => {
      setRecentConfessions(list.slice(0, 3));
    }).catch(() => {});

    api.getCommunityStats().then(setStats).catch(() => {});
  }, []);

  const handleQuickReact = async (post: Confession, type: 'hug' | 'listen' | 'peace') => {
    try {
      setActiveReactionId(post.id + type);
      const res = await api.reactConfession(post.id, type);
      setRecentConfessions((prev) =>
        prev.map((p) => (p.id === post.id ? res.confession : p))
      );
      setTimeout(() => setActiveReactionId(null), 900);
    } catch {
      // ignore
    }
  };

  return (
    <section className="space-y-6">
      {/* Honest Presence Card — zero fabricated counts */}
      <div className="relative overflow-hidden rounded-3xl bg-[#faf7ef] border border-[#dedcd0] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs text-[#46613e] font-semibold">
              <Users className="w-4 h-4" />
              <span>
                {stats && stats.activeOnlineCount >= 3
                  ? `Hiện có khoảng ${stats.activeOnlineCount} người đang mở Heali cùng lúc với bạn`
                  : 'Không gian ẩn danh, giữ riêng tư và tôn trọng nhịp độ của bạn'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#243627] font-serif-healing">
              Một góc nhỏ yên tĩnh cho lúc lòng vỡ
            </h3>
            <p className="text-xs sm:text-sm text-[#4e624f] font-serif-healing leading-relaxed max-w-xl">
              {VI_COPY.brandTagline} Ở góc Tâm tình, mọi người chỉ gửi phản ứng chia sẻ nhẹ nhàng và không có bình luận phán xét.
            </p>
            {onOpenStrangerChat && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenStrangerChat}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs sm:text-sm font-semibold shadow-sm transition"
                >
                  <span>Ghé góc gặp gỡ ẩn danh</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Real Live Counts from SQLite (shown cleanly without fabricated inflation) */}
          {stats && (stats.lanternsCount > 0 || stats.reactionsTotal > 0) && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f1efe5] border border-[#dfe2d5] text-center min-w-[140px]">
                <div className="text-xs text-[#5d715f] mb-0.5">Hoa đăng trên hồ</div>
                <div className="text-lg sm:text-xl font-bold text-[#a95843] font-mono tabular-nums">
                  {stats.lanternsCount} ngọn
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f1efe5] border border-[#dfe2d5] text-center min-w-[140px]">
                <div className="text-xs text-[#5d715f] mb-0.5">Phản ứng sẻ chia</div>
                <div className="text-lg sm:text-xl font-bold text-[#46613e] font-mono tabular-nums">
                  {stats.reactionsTotal} lượt
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Featured Confessions Preview */}
      {recentConfessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-[#a95843]" />
              <h3 className="text-base sm:text-lg font-bold text-[#243627] font-serif-healing">
                Những chia sẻ gần đây trong vườn
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenConfessions}
              className="flex items-center gap-1.5 text-xs text-[#46613e] hover:text-[#2c4228] font-semibold transition"
            >
              <span>Đến góc Tâm tình</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentConfessions.map((post) => {
              const sumReactions =
                post.reactions.hug +
                post.reactions.listen +
                post.reactions.not_alone +
                post.reactions.peace +
                post.reactions.strength;

              return (
                <div
                  key={post.id}
                  className="p-5 rounded-3xl bg-[#faf7ef] border border-[#dedcd0] flex flex-col justify-between shadow-sm hover:border-[#a5b89f] transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#5e7260] mb-2.5">
                      <span className="font-semibold text-[#46613e]">{post.authorNickname}</span>
                      <span className="text-xs text-[#6d7c6d] font-medium">
                        {post.moodTag}
                      </span>
                    </div>

                    {post.title && (
                      <h4 className="text-sm font-bold text-[#243627] font-serif-healing mb-1.5 line-clamp-1">
                        {post.title}
                      </h4>
                    )}

                    <p className="text-xs sm:text-sm text-[#4c604d] font-serif-healing leading-relaxed line-clamp-3 mb-4">
                      {post.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#e7e5da] flex items-center justify-between text-xs">
                    <span className="text-xs text-[#6a7a69] tabular-nums">
                      {sumReactions} phản ứng lắng nghe
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickReact(post, 'hug')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                          activeReactionId === post.id + 'hug'
                            ? 'bg-[#f4e5df] border-[#c47a66] text-[#9b4c39]'
                            : 'bg-[#f1efe5] hover:bg-[#f4e7e2] border-[#dcdad0] text-[#4b5f4c]'
                        }`}
                        title="Gửi cái ôm"
                      >
                        Ôm bạn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickReact(post, 'peace')}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                          activeReactionId === post.id + 'peace'
                            ? 'bg-[#e6efe2] border-[#46613e] text-[#273829]'
                            : 'bg-[#f1efe5] hover:bg-[#e7efe2] border-[#dcdad0] text-[#4b5f4c]'
                        }`}
                        title="Chúc bình yên"
                      >
                        Bình yên
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
