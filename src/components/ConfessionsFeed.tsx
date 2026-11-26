import React, { useState, useEffect } from 'react';
import type { CommunityStatus, Confession } from '../services/api';
import { api } from '../services/api';
import { SupportPromptCard } from './SupportPromptCard';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';
import { VI_COPY } from '../i18n/vi';
import type { RiskLevel } from '../../shared/riskDetector';
import {
  MessageSquareHeart,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Eye,
  EyeOff,
  Send,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ConfessionsFeedProps {
  lowMotion?: boolean;
  embeddedIn3DRoom?: boolean;
}

export const ConfessionsFeed: React.FC<ConfessionsFeedProps> = ({
  lowMotion = false,
  embeddedIn3DRoom = false,
}) => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [communityStatus, setCommunityStatus] = useState<CommunityStatus | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  // Modals & states
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [unblurredIds, setUnblurredIds] = useState<Record<string, boolean>>({});
  const [reportingPost, setReportingPost] = useState<Confession | null>(null);
  const [blockingAuthor, setBlockingAuthor] = useState<{ id: string; nickname: string } | null>(null);
  const [reportReason, setReportReason] = useState('Nội dung gây tổn hại tinh thần');
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [heldNoticeRiskLevel, setHeldNoticeRiskLevel] = useState<RiskLevel | null>(null);

  // New post form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Confession['category']>('breakup');
  const [newMoodTag, setNewMoodTag] = useState('Nhói lòng');
  const [newIsTriggerWarning, setNewIsTriggerWarning] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const categories = [
    { id: 'all', label: 'Tất cả tâm tình' },
    { id: 'breakup', label: 'Tan vỡ tình cảm' },
    { id: 'loneliness', label: 'Nỗi niềm cô đơn' },
    { id: 'relationship', label: 'Khúc mắc lứa đôi' },
    { id: 'family', label: 'Gia đình & áp lực' },
    { id: 'friendship', label: 'Tình bạn tan rã' },
    { id: 'healing', label: 'Hành trình chữa lành' },
  ];

  const reactionMeta = [
    { type: 'hug', icon: '🤗', label: 'Ôm một cái' },
    { type: 'listen', icon: '🤍', label: 'Lắng nghe' },
    { type: 'not_alone', icon: '🌱', label: 'Không cô đơn' },
    { type: 'peace', icon: '🕊️', label: 'Bình yên nhé' },
    { type: 'strength', icon: '✨', label: 'Mạnh mẽ lên' },
  ] as const;

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const list = await api.getConfessions(category, sort);
      setConfessions(list);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.getCommunityStatus().then(setCommunityStatus).catch(() => {});
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [category, sort]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3200);
  };

  const handleReact = async (
    post: Confession,
    type: 'hug' | 'listen' | 'not_alone' | 'peace' | 'strength'
  ) => {
    try {
      const result = await api.reactConfession(post.id, type);
      setConfessions((prev) =>
        prev.map((p) => (p.id === post.id ? result.confession : p))
      );
    } catch {
      showToast('Không thể gửi phản ứng. Vui lòng thử lại.');
    }
  };

  const handleConfirmBlockUser = async () => {
    if (!blockingAuthor) return;
    try {
      await api.blockUser(blockingAuthor.id);
      setConfessions((prev) => prev.filter((c) => c.authorId !== blockingAuthor.id));
      showToast(`Đã ẩn mọi nội dung từ "${blockingAuthor.nickname}"`);
      setBlockingAuthor(null);
    } catch {
      showToast('Không thể thực hiện ẩn tác giả lúc này.');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;
    try {
      const res = await api.reportConfession(reportingPost.id, reportReason);
      setReportSuccessMsg(res.message);
      if (res.postHidden) {
        setConfessions((prev) => prev.filter((c) => c.id !== reportingPost.id));
      }
      window.setTimeout(() => {
        setReportingPost(null);
        setReportSuccessMsg(null);
      }, 2000);
    } catch {
      showToast('Gửi báo cáo thất bại.');
    }
  };

  const handleCreateConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      showToast('Vui lòng nhập nội dung bộc bạch');
      return;
    }
    setIsSubmittingPost(true);
    try {
      const { confession, heldForModeration, riskLevel } = await api.postConfession({
        title: newTitle,
        content: newContent,
        category: newCategory,
        moodTag: newMoodTag,
        isTriggerWarning: newIsTriggerWarning,
      });
      setIsNewPostModalOpen(false);
      setNewTitle('');
      setNewContent('');

      if (heldForModeration) {
        setHeldNoticeRiskLevel((riskLevel && riskLevel >= 2 ? riskLevel : 2) as RiskLevel);
      } else {
        setConfessions((prev) => [confession, ...prev]);
        setHeldNoticeRiskLevel(null);
        showToast('Đã gửi tâm tình của bạn vào góc chia sẻ.');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi gửi bài');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const currentUser = api.getCurrentUser();

  const isCommunityOpen = communityStatus ? communityStatus.communityOpen : true;

  return (
    <div className="space-y-5 text-[#273829] dark:text-[#edf2e8] heali-stage-enter">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#273829] dark:bg-[#233226] border border-[#46613e] px-4 py-2.5 text-xs text-[#faf7ef] shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#a8e0a1] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Off-duty Moderation Pause Notice */}
      {communityStatus && !communityStatus.communityOpen && (
        <div className="rounded-2xl bg-[#f9ece8] dark:bg-[#32201d] border border-[#e3b9af] dark:border-[#603932] p-4 flex items-start gap-3 text-xs sm:text-sm text-[#7a3121] dark:text-[#f2c6bc]">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Góc chia sẻ công khai đang tạm nghỉ ngoài ca trực kiểm duyệt</div>
            <p className="leading-relaxed">
              {communityStatus.closedReason ||
                'Để giữ an toàn cho mọi người, tính năng đăng bài mới tạm đóng khi chưa có điều phối viên trực. Bạn vẫn có thể đọc bài cũ hoặc viết vào Nhật ký riêng tư.'}
            </p>
          </div>
        </div>
      )}

      {/* Overload Slow-Mode Notice */}
      {communityStatus?.communityOpen && communityStatus.queueOverloaded && communityStatus.slowModeNotice && (
        <div className="rounded-2xl bg-[#f8f1e2] dark:bg-[#2e291d] border border-[#e2cfab] dark:border-[#5a4f36] p-3.5 flex items-start gap-2.5 text-xs text-[#6e5225] dark:text-[#ecd49f]">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{communityStatus.slowModeNotice}</span>
        </div>
      )}

      {/* 3D Interactive Evening Community Clearing Stage */}
      {embeddedIn3DRoom ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#222c24] border border-[#dcdad0] dark:border-[#324236]">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#9c5a2c] dark:text-[#e6c37b] flex items-center gap-1.5">
              <MessageSquareHeart className="w-3.5 h-3.5" />
              <span>Tâm tình ẩn danh · Không phán xét</span>
            </div>
            <p className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
              Đọc và gửi những nỗi niềm được kiểm duyệt an toàn trên tường giấy trà thất.
            </p>
          </div>
          <button
            type="button"
            disabled={!isCommunityOpen}
            onClick={() => setIsNewPostModalOpen(true)}
            className="min-h-[40px] flex items-center gap-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:opacity-45 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCommunityOpen ? 'Gửi bộc bạch mới' : 'Tạm đóng ngoài ca trực'}</span>
          </button>
        </div>
      ) : (
        <SanctuaryScene3D
          variant="community"
          lowMotion={lowMotion}
          allowPureViewToggle
          className="min-h-[215px] sm:min-h-[245px]"
        >
          <div className="p-5 sm:p-8 flex flex-col justify-between min-h-[215px] sm:min-h-[245px] text-[#f4f4ed]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#e6c37b]">
              <MessageSquareHeart className="w-4 h-4" />
              <span>Góc tâm tình · Lắng nghe ẩn danh</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-6">
              <div className="space-y-1 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif-healing text-white">
                  Tâm tình ẩn danh
                </h2>
                <p className="text-xs sm:text-sm text-[#dce5d9] font-serif-healing italic">
                  Ánh đèn lều nhỏ ấm áp cho những nỗi niềm cần được lắng nghe dịu dàng, không phán xét.
                </p>
              </div>

              <button
                type="button"
                disabled={!isCommunityOpen}
                onClick={() => setIsNewPostModalOpen(true)}
                className="min-h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-[#537949] hover:bg-[#43653a] disabled:opacity-45 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition active:scale-95 shrink-0 self-start sm:self-auto whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{isCommunityOpen ? 'Gửi bộc bạch mới' : 'Tạm đóng ngoài ca trực'}</span>
              </button>
            </div>
          </div>
        </SanctuaryScene3D>
      )}

      {/* Slim Moderation Rule Bar + Category & Sort Strip */}
      <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4b604d] dark:text-[#b4c4b6]">
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className="inline-flex items-center gap-2 font-medium hover:text-[#273829] dark:hover:text-[#edf2e8] transition text-left"
          >
            <ShieldCheck className="w-4 h-4 text-[#46613e] dark:text-[#98c18e] shrink-0" />
            <span>
              Nguyên tắc dịu dàng ·{' '}
              {communityStatus?.communityOpen
                ? `Đang trực kiểm duyệt (≤ ${communityStatus.slaTargetMinutes}p)`
                : 'Kiểm duyệt an toàn'}
            </span>
            {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 text-xs text-[#576c59] dark:text-[#a6b7a8]">
            <span className="tabular-nums hidden sm:inline">{confessions.length} tâm tình ·</span>
            <button
              type="button"
              onClick={() => setSort('newest')}
              className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                sort === 'newest'
                  ? 'bg-[#e6efe2] dark:bg-[#2a392d] text-[#243627] dark:text-[#edf2e8] font-semibold'
                  : 'hover:text-[#273829] dark:hover:text-[#edf2e8]'
              }`}
            >
              Mới nhất
            </button>
            <button
              type="button"
              onClick={() => setSort('popular')}
              className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                sort === 'popular'
                  ? 'bg-[#e6efe2] dark:bg-[#2a392d] text-[#243627] dark:text-[#edf2e8] font-semibold'
                  : 'hover:text-[#273829] dark:hover:text-[#edf2e8]'
              }`}
            >
              Nhiều đồng cảm
            </button>
          </div>
        </div>

        {showRules && (
          <div className="rounded-2xl bg-[#f1efe5] dark:bg-[#232e25] border border-[#dcd9cc] dark:border-[#324236] px-4 py-2.5 text-xs text-[#4b604d] dark:text-[#b4c4b6]">
            Không bình luận phán xét, không bảng xếp hạng lượt thích, tôn trọng cảnh báo nội dung nhạy cảm và luôn có đội ngũ rà soát an toàn trực ca.
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-[#e6e4d8] dark:border-[#2e3d31]">
          {categories.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`min-h-[38px] whitespace-nowrap shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-[#46613e] text-white shadow-sm'
                    : 'bg-[#f1efe5] dark:bg-[#232e25] text-[#4b604d] dark:text-[#b4c4b6] border border-[#dcdad0] dark:border-[#324236] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Held Moderation Banner & Supportive Card */}
      {heldNoticeRiskLevel !== null && (
        <div className="rounded-3xl bg-[#f9f3eb] dark:bg-[#2e241b] border border-[#dcc2a6] dark:border-[#5e4733] p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-[#4a3827] dark:text-[#f0decb] leading-relaxed">
              {VI_COPY.confessions.heldNotice}
            </p>
            <button
              type="button"
              onClick={() => setHeldNoticeRiskLevel(null)}
              className="p-1 text-[#6e5a47] dark:text-[#d5b89e] hover:text-[#273829] dark:hover:text-white"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SupportPromptCard forcedLevel={heldNoticeRiskLevel} />
        </div>
      )}

      {/* Confession Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-[#f1efe5] dark:bg-[#1f2921] border border-[#dcd9cc] dark:border-[#324236]"
            />
          ))}
        </div>
      ) : confessions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm">
          <MessageSquareHeart className="w-10 h-10 text-[#91a48e] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#243627] dark:text-[#edf2e8]">
            Chưa có bài tâm tình nào trong danh mục này.
          </p>
          <p className="text-xs text-[#5e7260] dark:text-[#a6b7a8] mt-1">
            Hãy là người đầu tiên trải lòng để cùng thắp lên hơi ấm.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {confessions.map((post) => {
            const isBlurred = post.isTriggerWarning && !unblurredIds[post.id];
            const isMyPost = currentUser?.id === post.authorId;

            return (
              <div
                key={post.id}
                className="relative p-5 sm:p-6 rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-sm hover:border-[#b9c6b4] dark:hover:border-[#4c6451] heali-card-surface"
              >
                {/* Author row & safety actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e6efe2] dark:bg-[#253628] border border-[#c3d3bd] dark:border-[#3e5642] flex items-center justify-center text-[#355432] dark:text-[#a9d4a1] text-xs font-bold shrink-0">
                      {post.authorNickname.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#243627] dark:text-[#f2f6ee]">{post.authorNickname}</span>
                        {isMyPost && (
                          <>
                            <span aria-hidden="true" className="text-[#8a9989]">·</span>
                            <span className="font-semibold text-[#46613e] dark:text-[#98c18e]">Bài của bạn</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5e7260] dark:text-[#a6b7a8] mt-0.5 tabular-nums">
                        <span className="font-medium text-[#46613e] dark:text-[#98c18e]">{post.moodTag}</span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  {!isMyPost && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setReportingPost(post)}
                        className="p-2 rounded-lg text-[#6a7c6b] dark:text-[#a6b7a8] hover:text-[#9b4b38] hover:bg-[#f7e7e3] dark:hover:bg-[#38231e] transition"
                        title="Báo cáo vi phạm"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBlockingAuthor({
                            id: post.authorId,
                            nickname: post.authorNickname,
                          })
                        }
                        className="p-2 rounded-lg text-[#6a7c6b] dark:text-[#a6b7a8] hover:text-[#7a5d2e] hover:bg-[#f5efe0] dark:hover:bg-[#30291b] transition"
                        title="Ẩn bài từ tác giả này"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                {post.title && (
                  <h3 className="text-base sm:text-lg font-bold text-[#243627] dark:text-[#f2f6ee] mb-2 font-serif-healing">
                    {post.title}
                  </h3>
                )}

                {/* Sensitive content blur warning */}
                {post.isTriggerWarning && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#f6efe2] dark:bg-[#2c261a] border border-[#dfc89e] dark:border-[#56482b] text-xs text-[#6d4f22] dark:text-[#ead29f]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#9e6b27] shrink-0" />
                      <span>Nội dung có thể chạm vào vùng tổn thương nhạy cảm</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setUnblurredIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                      }
                      className="text-[#46613e] dark:text-[#98c18e] font-semibold hover:underline flex items-center gap-1 whitespace-nowrap"
                    >
                      {isBlurred ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      <span>{isBlurred ? 'Xem nội dung' : 'Ẩn lại'}</span>
                    </button>
                  </div>
                )}

                {/* Content */}
                <div
                  className={`text-sm sm:text-[15px] text-[#2d3f2f] dark:text-[#dce5da] leading-relaxed font-serif-healing whitespace-pre-wrap ${
                    isBlurred ? 'filter blur-sm select-none pointer-events-none' : ''
                  }`}
                >
                  {post.content}
                </div>

                {/* Empathetic reactions bar */}
                <div className="mt-4 pt-3.5 border-t border-[#e6e4d8] dark:border-[#2e3d31] flex flex-wrap items-center gap-2">
                  {reactionMeta.map((rm) => {
                    const count = post.reactions[rm.type] || 0;
                    const hasReacted = post.userReactions?.[rm.type]?.includes(
                      currentUser?.id || ''
                    );

                    return (
                      <button
                        key={rm.type}
                        type="button"
                        onClick={() => void handleReact(post, rm.type)}
                        className={`min-h-[38px] flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition whitespace-nowrap ${
                          hasReacted
                            ? 'bg-[#e6efe2] dark:bg-[#283c2b] border border-[#46613e] dark:border-[#6a935f] text-[#243627] dark:text-[#edf2e8] font-semibold'
                            : 'bg-[#f1efe5] dark:bg-[#232e25] border border-[#dcdad0] dark:border-[#324236] text-[#4b604d] dark:text-[#b4c4b6] hover:border-[#9eb198] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                        }`}
                      >
                        <span>{rm.icon}</span>
                        <span className="hidden sm:inline text-[11px]">{rm.label}</span>
                        {count > 0 && (
                          <span className="font-bold text-[11px] tabular-nums ml-0.5">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Post Modal */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 shadow-2xl text-[#273829] dark:text-[#edf2e8]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
              <div className="flex items-center gap-2.5">
                <MessageSquareHeart className="w-5 h-5 text-[#46613e] dark:text-[#98c18e]" />
                <h3 className="font-bold text-[#243627] dark:text-[#edf2e8] text-base font-serif-healing">
                  Gửi Bộc Bạch Ẩn Danh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPostModalOpen(false)}
                className="p-1 rounded-lg text-[#5e7260] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-white"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConfession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#243627] dark:text-[#edf2e8] mb-1">
                  Chọn chủ đề
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Confession['category'])}
                  className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-xs text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e]"
                >
                  <option value="breakup">Tan vỡ tình cảm</option>
                  <option value="loneliness">Nỗi niềm cô đơn</option>
                  <option value="relationship">Khúc mắc lứa đôi</option>
                  <option value="family">Gia đình &amp; áp lực</option>
                  <option value="friendship">Tình bạn tan rã</option>
                  <option value="healing">Hành trình chữa lành</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243627] dark:text-[#edf2e8] mb-1">
                  Tiêu đề ngắn (tùy chọn)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Ví dụ: Lời nhắn gửi tuổi 25, Hôm nay lại nhớ người..."
                  className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-xs text-[#273829] dark:text-[#edf2e8] placeholder:text-[#8b988b] focus:outline-none focus:border-[#46613e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243627] dark:text-[#edf2e8] mb-1">
                  Trải lòng của bạn <span className="text-[#9b4b38]">*</span>
                </label>
                <textarea
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                  placeholder="Viết tất cả những gì bạn đang trăn trở... Nơi này hoàn toàn ẩn danh và bảo vệ sự riêng tư của bạn."
                  className="w-full rounded-2xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-3 text-sm text-[#273829] dark:text-[#edf2e8] placeholder:text-[#6f7e70] focus:outline-none focus:border-[#46613e] resize-none font-serif-healing leading-relaxed"
                />
              </div>

              <SupportPromptCard text={`${newTitle} ${newContent}`} compact />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#455a47] dark:text-[#b4c4b6]">Thẻ tâm trạng:</label>
                  <input
                    type="text"
                    value={newMoodTag}
                    onChange={(e) => setNewMoodTag(e.target.value)}
                    maxLength={20}
                    className="w-28 rounded-lg bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] px-2.5 py-1 text-xs text-[#273829] dark:text-[#edf2e8] focus:outline-none focus:border-[#46613e]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#455a47] dark:text-[#b4c4b6]">
                  <input
                    type="checkbox"
                    checked={newIsTriggerWarning}
                    onChange={(e) => setNewIsTriggerWarning(e.target.checked)}
                    className="rounded border-[#9eb198] text-[#46613e] focus:ring-0"
                  />
                  <span>Làm mờ cảnh báo nhạy cảm</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-xs font-semibold text-[#3f5440] dark:text-[#b4c4b6]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="flex items-center gap-1.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingPost ? 'Đang gửi...' : 'Gửi ẩn danh'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 text-[#273829] dark:text-[#edf2e8] shadow-2xl">
            <div className="flex items-center gap-2.5 mb-3 text-[#9b4b38] dark:text-[#e9a392]">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm font-serif-healing">Báo cáo nội dung</h3>
            </div>

            {reportSuccessMsg ? (
              <div className="p-4 rounded-xl bg-[#e6efe2] dark:bg-[#223225] border border-[#b9cfb2] dark:border-[#3c563f] text-[#274224] dark:text-[#b7dab2] text-xs">
                {reportSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
                <p className="text-[#4b604d] dark:text-[#b4c4b6] leading-relaxed">
                  Heali cam kết duy trì một không gian an toàn, chữa lành và lành mạnh. Lý do báo cáo:
                </p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl bg-white dark:bg-[#131a15] border border-[#d6d3c6] dark:border-[#324236] p-2.5 text-[#273829] dark:text-[#edf2e8]"
                >
                  <option value="Nội dung gây tổn hại tinh thần">
                    Nội dung gây tổn hại tinh thần / kích động
                  </option>
                  <option value="Quấy rối hoặc xúc phạm">
                    Quấy rối hoặc xúc phạm người khác
                  </option>
                  <option value="Spam hoặc quảng cáo">Spam hoặc quảng cáo</option>
                  <option value="Nội dung nguy hiểm / tự hại">
                    Nội dung nguy hiểm hoặc đề cập tự hại
                  </option>
                </select>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingPost(null)}
                    className="px-3.5 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-[#3f5440] dark:text-[#b4c4b6] font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#9b4b38] hover:bg-[#823c2b] text-white font-semibold"
                  >
                    Gửi báo cáo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Block User Confirmation Modal */}
      {blockingAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dcdad0] dark:border-[#324236] p-6 text-[#273829] dark:text-[#edf2e8] shadow-2xl space-y-4">
            <h3 className="font-bold text-base font-serif-healing text-[#243627] dark:text-[#edf2e8]">
              Ẩn bài viết từ “{blockingAuthor.nickname}”?
            </h3>
            <p className="text-xs text-[#4b604d] dark:text-[#b4c4b6] leading-relaxed">
              Toàn bộ tâm tình của tác giả này sẽ được ẩn khỏi bảng tin của bạn để giữ không gian đọc luôn nhẹ nhàng.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockingAuthor(null)}
                className="px-3.5 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#232f26] text-xs font-semibold text-[#3f5440] dark:text-[#b4c4b6]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmBlockUser()}
                className="px-4 py-2 rounded-xl bg-[#273829] dark:bg-[#46613e] hover:bg-[#344b37] text-white text-xs font-semibold"
              >
                Xác nhận ẩn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
