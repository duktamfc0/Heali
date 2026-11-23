import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  api,
  SpiritualPauseRecommendedError,
  type SpiritualChair,
  type SpiritualSeatBooking,
  type SpiritualViewerPass,
  type SpiritualSpecialty,
} from '../services/api';
import {
  AlertTriangle,
  Armchair,
  Briefcase,
  Calendar,
  CheckCircle2,
  Coins,
  Compass,
  Eye,
  Heart,
  HeartPulse,
  Lock,
  Plus,
  Power,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { TarotHostWorkspace } from './TarotHostWorkspace';
import { SupportPromptCard } from './SupportPromptCard';
import { VI_COPY } from '../i18n/vi';
import {
  TUVI_BIRTH_HOURS,
  generateTuViNumerologyReport,
} from '../data/tuviNumerology';
import { SanctuaryScene3D } from './3d/SanctuaryScene3D';

type SubTabId = 'tarot' | 'tuvi' | 'chairs';
type ChairFilter = 'all' | SpiritualSpecialty;

const SPECIALTY_LABEL: Record<SpiritualSpecialty, string> = {
  tarot: 'Tarot Soi Chiếu',
  tuvi: 'Tử Vi Đẩu Số',
  numerology: 'Thần Số Học',
  combined: 'Tarot & Tử Vi',
};

function formatVnd(amount: number): string {
  if (!amount || amount <= 0) return 'Miễn phí';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

interface SpiritualRoomViewProps {
  lowMotion?: boolean;
}

export const SpiritualRoomView: React.FC<SpiritualRoomViewProps> = ({ lowMotion = false }) => {
  const [subTab, setSubTab] = useState<SubTabId>('tarot');

  // --- Tử Vi & Thần Số Học State ---
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('1998-06-15');
  const [birthHourId, setBirthHourId] = useState('mao');

  // --- Advisor Chairs & Monetization State ---
  const [paidEnabled, setPaidEnabled] = useState(false);
  const [chairs, setChairs] = useState<SpiritualChair[]>([]);
  const [chairFilter, setChairFilter] = useState<ChairFilter>('all');
  const [myBookings, setMyBookings] = useState<SpiritualSeatBooking[]>([]);
  const [myViewerPasses, setMyViewerPasses] = useState<SpiritualViewerPass[]>([]);
  const [hostIncomingBookings, setHostIncomingBookings] = useState<SpiritualSeatBooking[]>([]);
  const [loadingChairs, setLoadingChairs] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Booking Modal State (supports prefill from Tarot / Tu Vi)
  const [bookingChair, setBookingChair] = useState<SpiritualChair | null>(null);
  const [bookingTopic, setBookingTopic] = useState('');
  const [bookingBirthDate, setBookingBirthDate] = useState('1998-06-15');
  const [bookingNote, setBookingNote] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [pauseWarning, setPauseWarning] = useState<{
    message: string;
    suggestExUrgeFlow: boolean;
  } | null>(null);
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);

  // Open Chair Modal State (Monetization Host)
  const [showCreateChairModal, setShowCreateChairModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSpecialty, setNewSpecialty] = useState<SpiritualSpecialty>('tarot');
  const [newBio, setNewBio] = useState('');
  const [newSeatPrice, setNewSeatPrice] = useState('99000');
  const [newTicketPrice, setNewTicketPrice] = useState('19000');
  const [newMaxSeats, setNewMaxSeats] = useState('6');
  const [hostRulesAccepted, setHostRulesAccepted] = useState(false);
  const [creatingChair, setCreatingChair] = useState(false);

  const currentUser = api.getCurrentUser();

  const loadChairs = useCallback(async () => {
    setLoadingChairs(true);
    try {
      const data = await api.getSpiritualRoomData();
      setPaidEnabled(Boolean(data.paidEnabled));
      setChairs(data.chairs || []);
      setMyBookings(data.myBookings || []);
      setMyViewerPasses(data.myViewerPasses || []);
      setHostIncomingBookings(data.hostIncomingBookings || []);
    } catch {
      // ignore initial error
    } finally {
      setLoadingChairs(false);
    }
  }, []);

  useEffect(() => {
    void loadChairs();
  }, [loadChairs]);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setFeedbackMsg(null);
    } else {
      setFeedbackMsg(msg);
      setErrorMsg(null);
    }
    window.setTimeout(() => {
      setFeedbackMsg(null);
      setErrorMsg(null);
    }, 4500);
  };

  // --- Comprehensive Tử Vi & Thần Số Học Report ---
  const tuviReport = useMemo(
    () =>
      generateTuViNumerologyReport({
        displayName,
        birthDate,
        birthHourId,
      }),
    [displayName, birthDate, birthHourId]
  );

  // --- Filtered Advisor Chairs ---
  const filteredChairs = useMemo(() => {
    if (chairFilter === 'all') return chairs;
    return chairs.filter((c) => c.specialty === chairFilter);
  }, [chairs, chairFilter]);

  const openBookingWithContext = (
    preferredSpecialty: SpiritualSpecialty[],
    prefill: { topic: string; note: string; customBirthDate?: string }
  ) => {
    setBookingTopic(prefill.topic);
    setBookingNote(prefill.note);
    if (prefill.customBirthDate) {
      setBookingBirthDate(prefill.customBirthDate);
    } else {
      setBookingBirthDate(birthDate);
    }

    const candidate =
      chairs.find(
        (c) =>
          c.isLive &&
          c.bookedSeatsCount < c.maxSeats &&
          preferredSpecialty.includes(c.specialty)
      ) ||
      chairs.find((c) => c.isLive && c.bookedSeatsCount < c.maxSeats) ||
      chairs[0];

    setSubTab('chairs');
    if (candidate) {
      setBookingChair(candidate);
    } else {
      showToast('Đã chuyển sang Ghế Cố Vấn — hãy chọn phòng phù hợp để đặt lịch.');
    }
  };

  const openBookingModalForChair = (chair: SpiritualChair) => {
    setPauseWarning(null);
    setBookingChair(chair);
  };

  // --- Chairs & Monetization Handlers ---
  const submitBooking = async (confirmAfterReflection: boolean) => {
    if (!bookingChair || !bookingTopic.trim()) return;
    setSubmittingBooking(true);
    try {
      await api.bookSpiritualSeat(bookingChair.id, {
        birthDate: bookingChair.specialty === 'tarot' ? '' : bookingBirthDate,
        questionTopic: bookingTopic.trim(),
        note: bookingNote.trim(),
        confirmAfterReflection,
      });
      setBookingChair(null);
      setBookingTopic('');
      setBookingNote('');
      setPauseWarning(null);
      await loadChairs();
      showToast('Đã đăng ký lên ghế cố vấn thành công!');
    } catch (err) {
      if (err instanceof SpiritualPauseRecommendedError) {
        setPauseWarning({
          message: err.message,
          suggestExUrgeFlow: err.suggestExUrgeFlow,
        });
      } else {
        showToast(err instanceof Error ? err.message : 'Không thể đăng ký ghế', true);
      }
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitBooking(false);
  };

  const handleCompleteBooking = async (bookingId: string) => {
    setCompletingBookingId(bookingId);
    try {
      const res = await api.completeSpiritualBooking(bookingId);
      await loadChairs();
      showToast(res.message || 'Đã hoàn tất phiên và xóa ngày sinh khỏi máy chủ.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể hoàn tất phiên', true);
    } finally {
      setCompletingBookingId(null);
    }
  };

  const handleSubscribeViewer = async (chair: SpiritualChair) => {
    try {
      const result = await api.subscribeSpiritualViewer(chair.id);
      await loadChairs();
      showToast(
        result.alreadySubscribed
          ? `Bạn đã sở hữu vé xem phòng "${chair.title}".`
          : `Đã đăng ký xem trực tiếp phòng "${chair.title}" thành công!`
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể đăng ký xem', true);
    }
  };

  const handleCreateChair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!hostRulesAccepted) {
      showToast('Vui lòng đọc và xác nhận Quy tắc Cố vấn Heali trước khi mở ghế.', true);
      return;
    }
    setCreatingChair(true);
    try {
      await api.createSpiritualChair({
        title: newTitle.trim(),
        bio: newBio.trim(),
        specialty: newSpecialty,
        seatPrice: Math.min(300000, Math.max(0, Number(newSeatPrice) || 0)),
        viewerTicketPrice: Math.min(50000, Math.max(0, Number(newTicketPrice) || 0)),
        maxSeats: Math.min(20, Math.max(1, Number(newMaxSeats) || 6)),
        hostRulesAccepted,
      });
      setShowCreateChairModal(false);
      setNewTitle('');
      setNewBio('');
      setHostRulesAccepted(false);
      await loadChairs();
      showToast('Đã mở ghế cố vấn mới trong Phòng Tâm Linh!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Mở ghế thất bại', true);
    } finally {
      setCreatingChair(false);
    }
  };

  const handleToggleChairLive = async (chairId: string) => {
    try {
      await api.toggleSpiritualChair(chairId);
      await loadChairs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể đổi trạng thái ghế', true);
    }
  };

  const myOwnedChairs = currentUser
    ? chairs.filter((c) => c.ownerUserId === currentUser.id)
    : [];

  const totalHostEstimatedRevenue = myOwnedChairs.reduce(
    (sum, c) => sum + c.bookedSeatsCount * c.seatPrice + c.viewerCount * c.viewerTicketPrice,
    0
  );

  const liveChairsCount = chairs.filter((c) => c.isLive).length;

  return (
    <div className="rounded-[28px] bg-[#faf7ef] dark:bg-[#1a221b] border border-[#dedcd0] dark:border-[#323f34] overflow-hidden shadow-sm text-[#273829] dark:text-[#edf2eb] heali-stage-enter">
      {/* 3D INTERACTIVE ASTROLABE & TAROT SANCTUARY STAGE */}
      <SanctuaryScene3D
        variant="spiritual"
        lowMotion={lowMotion}
        allowPureViewToggle
        className="min-h-[245px] sm:min-h-[280px] rounded-none border-0"
        scrimClassName="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#121c15]/92 via-[#18261c]/70 to-[#121c15]/30"
      >
        <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[245px] sm:min-h-[280px]">
          <div className="text-xs font-medium text-[#e5d2a3] flex items-center gap-2">
            <span>Phòng Tâm Linh Heali</span>
            <span aria-hidden="true">·</span>
            <span>Công cụ gợi mở suy ngẫm</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{liveChairsCount} phòng cố vấn đang mở</span>
          </div>

          <div className="max-w-2xl space-y-2 pt-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#faf7ef] font-serif-healing leading-tight text-balance">
              Soi chiếu nội tâm, lắng nghe mình và tìm điểm tựa bình yên
            </h1>
            <p className="text-xs sm:text-sm text-[#dce5d9] leading-relaxed font-serif-healing italic max-w-xl">
              Trải bài 78 lá Tarot cổ điển, tham khảo góc nhìn Tử Vi &amp; Số Học hoặc trò chuyện riêng tư 1:1.
            </p>
          </div>
        </div>
      </SanctuaryScene3D>

      {/* MAIN CONTENT BODY */}
      <div className="p-5 sm:p-8 space-y-6">
        {/* Sub-tab Navigation Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#e5e2d5] dark:border-[#2e3a30]">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#f1efe5] dark:bg-[#232d25] p-1.5 rounded-2xl border border-[#dcd9cc] dark:border-[#344236]">
            {[
              { id: 'tarot' as const, label: '01. Trải bài Tarot & Host', icon: Star },
              { id: 'tuvi' as const, label: '02. Tử Vi & Số Học', icon: Compass },
              { id: 'chairs' as const, label: '03. Ghế Cố Vấn 1:1 & Live', icon: Armchair },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#46613e] text-white shadow-sm'
                      : 'text-[#4b604d] dark:text-[#b4c4b5] hover:text-[#273829] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#2d392f]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSubTab('chairs')}
            className="text-xs font-semibold text-[#46613e] dark:text-[#9fc495] hover:text-[#273829] dark:hover:text-white transition flex items-center gap-1.5 self-start md:self-center"
          >
            <Armchair className="w-4 h-4" />
            <span>Đặt ghế 1:1 hoặc mở phòng cố vấn →</span>
          </button>
        </div>

        {/* Reflective Tool Disclaimer (Section 4.4) */}
        <div className="px-4 py-3 rounded-2xl bg-[#f6efe2] dark:bg-[#2b261b] border border-[#e3d2b1] dark:border-[#4b402a] text-xs text-[#5e461f] dark:text-[#ebd8b0] leading-relaxed">
          {VI_COPY.spiritual.disclaimer}
        </div>

        {/* Notifications */}
        {feedbackMsg && (
          <div className="px-4 py-2.5 rounded-2xl bg-[#e6efe2] dark:bg-[#223225] border border-[#b9cfb2] dark:border-[#3c563f] text-xs font-medium text-[#274224] dark:text-[#b7dab2] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="px-4 py-2.5 rounded-2xl bg-[#f7e7e3] dark:bg-[#35211f] border border-[#dfbeb6] dark:border-[#633934] text-xs font-medium text-[#8c3d2d] dark:text-[#edb4aa]">
            {errorMsg}
          </div>
        )}

        {/* SUBTAB 1: TAROT READING & HOST LEARNING */}
        {subTab === 'tarot' && (
          <TarotHostWorkspace
            onOpenAdvisorChairs={() => setSubTab('chairs')}
            onRequestAdvisorBooking={(prefill) =>
              openBookingWithContext(['tarot', 'combined'], prefill)
            }
          />
        )}

        {/* SUBTAB 2: TỬ VI & THẦN SỐ HỌC CHUYÊN SÂU ĐA KHÍA CẠNH */}
        {subTab === 'tuvi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Input Panel */}
              <div className="lg:col-span-4 rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#e2dfd3] dark:border-[#344236]">
                  <div className="w-9 h-9 rounded-xl bg-[#46613e] text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#243627] dark:text-[#edf2eb]">Thông tin lập lá số</h2>
                    <p className="text-[11px] text-[#5e7260] dark:text-[#a6b7a8]">
                      Giải mã 60 Hoa Giáp Nạp Âm, Giờ sinh &amp; Thần Số Học
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#273829] dark:text-[#edf2eb] mb-1">
                      Tên gọi thân mật của bạn
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#5e7260] dark:text-[#a6b7a8] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="VD: Minh Anh, Hoàng..."
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs sm:text-sm text-[#273829] dark:text-[#edf2eb] focus:outline-none focus:border-[#46613e]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#273829] dark:text-[#edf2eb] mb-1">
                      Ngày sinh dương lịch
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs sm:text-sm text-[#273829] dark:text-[#edf2eb] focus:outline-none focus:border-[#46613e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#273829] dark:text-[#edf2eb] mb-1">
                      Khung giờ sinh (12 Canh Giờ Tử Vi)
                    </label>
                    <select
                      value={birthHourId}
                      onChange={(e) => setBirthHourId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs sm:text-sm text-[#273829] dark:text-[#edf2eb] focus:outline-none focus:border-[#46613e]"
                    >
                      {TUVI_BIRTH_HOURS.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Resonance Metrics */}
                <div className="p-4 rounded-2xl bg-[#faf7ef] dark:bg-[#1a221b] border border-[#dcd9cc] dark:border-[#344236] space-y-2 text-xs">
                  <div className="font-bold text-[#243627] dark:text-[#edf2eb]">Yếu tố hòa hợp bản mệnh</div>
                  <div className="text-[#455a47] dark:text-[#c1cec2]">
                    <span className="font-semibold text-[#243627] dark:text-[#edf2eb]">Sắc màu nâng đỡ: </span>
                    {tuviReport.luckyColors}
                  </div>
                  <div className="text-[#455a47] dark:text-[#c1cec2]">
                    <span className="font-semibold text-[#243627] dark:text-[#edf2eb]">Âm thanh hợp mệnh: </span>
                    {tuviReport.healingSound}
                  </div>
                </div>

                {/* Bridge to Paid Advisor */}
                <div className="p-4 rounded-2xl bg-[#273829] text-[#f5efe0] space-y-2.5">
                  <div className="text-xs font-bold text-[#d8be82]">
                    Gợi mở suy ngẫm lá số 1:1 (tham khảo)
                  </div>
                  <p className="text-[11px] text-[#d5ded2] leading-relaxed">
                    {tuviReport.advisorPitch}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      openBookingWithContext(['tuvi', 'numerology', 'combined'], {
                        topic: `Gợi mở Tử Vi & Số Học (${tuviReport.canChi} · Số ${tuviReport.lifePath.number})`,
                        note: `Tên: ${tuviReport.displayName}. Nạp âm: ${tuviReport.napAmName}. Giờ sinh: ${tuviReport.hourProfile.label}. Năm cá nhân 2026: Số ${tuviReport.personalYear2026.yearNumber}.`,
                        customBirthDate: birthDate,
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-[#d8be82] hover:bg-[#e7cf98] text-[#1f2e21] text-xs font-bold transition"
                  >
                    Đặt ghế trò chuyện cùng cố vấn
                  </button>
                </div>
              </div>

              {/* Detailed 5-Aspect Result Panel */}
              <div className="lg:col-span-8 space-y-4">
                {/* Identity Summary Card */}
                <div className="rounded-3xl bg-[#273829] text-[#f5efe0] p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#d8be82]">
                    <span>Hồ sơ Bản Mệnh &amp; Thần Số Học của {tuviReport.displayName}</span>
                    <span className="tabular-nums">{tuviReport.amDuong}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="p-3.5 rounded-2xl bg-[#1f2e21] border border-[#3a503d]">
                      <div className="text-[11px] text-[#b8c8b5]">Tuổi &amp; Nạp Âm</div>
                      <div className="text-lg font-bold text-white font-serif-healing mt-0.5">
                        {tuviReport.canChi} ({tuviReport.zodiacAnimal})
                      </div>
                      <div className="text-xs text-[#d8be82] mt-0.5">{tuviReport.napAmName}</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#1f2e21] border border-[#3a503d]">
                      <div className="text-[11px] text-[#b8c8b5]">Số Chủ Đạo</div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-bold text-[#d8be82] font-serif-healing tabular-nums">
                          {tuviReport.lifePath.number}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {tuviReport.lifePath.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#c7d3c4] mt-0.5">
                        Năng lượng ngày sinh {tuviReport.birthDayVibration.day}: {tuviReport.birthDayVibration.gift}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#1f2e21] border border-[#3a503d]">
                      <div className="text-[11px] text-[#b8c8b5]">Chu kỳ Năm Cá Nhân 2026</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {tuviReport.personalYear2026.theme}
                      </div>
                      <div className="text-[11px] text-[#d8be82] mt-1">
                        Hành: Mệnh {tuviReport.element}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aspect 1 & 2: Identity + Deep Empathy Hook */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 space-y-2 heali-card-surface">
                    <div className="text-xs font-bold text-[#46613e] dark:text-[#9dc293] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>01. Bản sắc &amp; Điểm mạnh cốt lõi</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#2d3f2f] dark:text-[#d5e0d4] leading-relaxed font-serif-healing">
                      {tuviReport.fiveAspects.identity}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#f4ece6] dark:bg-[#2c221f] border border-[#dfc8bc] dark:border-[#4e3832] p-5 space-y-2 heali-card-surface">
                    <div className="text-xs font-bold text-[#8a4536] dark:text-[#e5a294] flex items-center gap-1.5">
                      <Heart className="w-4 h-4" />
                      <span>02. Nỗi niềm thầm kín &amp; Điểm dễ tổn thương</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#3d2924] dark:text-[#ebd5cf] leading-relaxed font-serif-healing">
                      {tuviReport.fiveAspects.empathyAndWound}
                    </p>
                  </div>
                </div>

                {/* Aspect 3 & 4: Love + Career & Birth Hour */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 space-y-2 heali-card-surface">
                    <div className="text-xs font-bold text-[#46613e] dark:text-[#9dc293] flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-[#9a4f46] dark:text-[#e48d83]" />
                      <span>03. Tình cảm &amp; Cách bạn yêu</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#2d3f2f] dark:text-[#d5e0d4] leading-relaxed font-serif-healing">
                      {tuviReport.fiveAspects.love}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 space-y-2 heali-card-surface">
                    <div className="text-xs font-bold text-[#46613e] dark:text-[#9dc293] flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#7a5d2e] dark:text-[#d9b672]" />
                      <span>04. Công việc, Tài vận &amp; Giờ sinh</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#2d3f2f] dark:text-[#d5e0d4] leading-relaxed font-serif-healing">
                      {tuviReport.fiveAspects.careerAndHour}
                    </p>
                  </div>
                </div>

                {/* Aspect 5: Health + Personal Year 2026 + 3 Rituals */}
                <div className="rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#46613e] dark:text-[#9dc293] flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-[#37635c] dark:text-[#7db3aa]" />
                      <span>05. Nhịp sống Ngũ Hành &amp; Chu kỳ Suy ngẫm Năm 2026</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#2d3f2f] dark:text-[#d5e0d4] leading-relaxed font-serif-healing">
                      {tuviReport.fiveAspects.healthAndYear2026}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#e0ddd0] dark:border-[#344236] space-y-2">
                    <div className="text-xs font-bold text-[#243627] dark:text-[#edf2eb]">
                      3 Nghi thức nhỏ cân bằng Mệnh {tuviReport.element} mỗi ngày
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {tuviReport.rituals.map((r, i) => (
                        <div
                          key={r}
                          className="p-3 rounded-xl bg-[#faf7ef] dark:bg-[#1a221b] border border-[#dcdad0] dark:border-[#344236] text-[#354b37] dark:text-[#c7d7c8] leading-relaxed"
                        >
                          <span className="font-mono font-bold text-[#46613e] dark:text-[#9dc293] mr-1">0{i + 1}.</span>
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: GHẾ CỐ VẤN LIVE & DOANH THU */}
        {subTab === 'chairs' && (
          <div className="space-y-6">
            {!paidEnabled && (
              <div className="px-4 py-3 rounded-2xl bg-[#eef3ea] dark:bg-[#213024] border border-[#c3d3bd] dark:border-[#384f3c] text-xs text-[#2d452a] dark:text-[#cfe2cc] leading-relaxed">
                {VI_COPY.spiritual.paidDisabledNotice}
              </div>
            )}

            {/* Value Proposition & Host Chair Banner */}
            <div className="rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-lg sm:text-xl font-bold text-[#243627] dark:text-[#edf2eb] font-serif-healing">
                  Ghế Cố Vấn 1:1 &amp; Phiên Soi Chiếu Trực Tiếp
                </h2>
                <p className="text-xs sm:text-sm text-[#4b604d] dark:text-[#c1cec2] leading-relaxed">
                  Khi cần một người trò chuyện và gợi mở câu hỏi suy ngẫm, bạn có thể <strong>Đăng ký lên ghế 1:1</strong> hoặc chọn <strong>Vé xem trực tiếp</strong>. Nội dung mang tính tham khảo và không thay thế tư vấn chuyên môn.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#3c563a] dark:text-[#9fc495] font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Ngày sinh tự xóa khi xong phiên
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Báo giá trần minh bạch
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ký cam kết không phán đoán định mệnh
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateChairModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-bold shadow-sm transition shrink-0 self-start lg:self-center whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{paidEnabled ? 'Mở ghế cố vấn' : 'Mở ghế cố vấn (Miễn phí thử nghiệm)'}</span>
              </button>
            </div>

            {/* User's Active / Recent Seat Bookings + Erasure Control */}
            {myBookings.length > 0 && (
              <div className="rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#243627] dark:text-[#edf2eb] flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-[#46613e] dark:text-[#9dc293]" />
                    <span>Lượt ghế 1:1 của bạn ({myBookings.length})</span>
                  </h3>
                  <span className="text-[11px] text-[#5e7260] dark:text-[#9cb09e]">
                    Bấm hoàn tất để xóa ngày sinh khỏi máy chủ
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myBookings.map((b) => {
                    const chair = chairs.find((c) => c.id === b.chairId);
                    const isCompleted = b.status === 'completed';
                    return (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl bg-[#faf7ef] dark:bg-[#1a221b] border border-[#dcd9cc] dark:border-[#344236] flex flex-col justify-between gap-2.5 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#243627] dark:text-[#edf2eb] truncate">
                              {chair?.title || 'Phiên cố vấn 1:1'}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                isCompleted
                                  ? 'bg-[#e6efe2] dark:bg-[#253628] text-[#2e522b] dark:text-[#9fd296]'
                                  : 'bg-[#f6efe2] dark:bg-[#382f1d] text-[#6d4f1d] dark:text-[#e5ca8b]'
                              }`}
                            >
                              {isCompleted ? 'Đã hoàn tất' : 'Đang giữ ghế'}
                            </span>
                          </div>
                          <div className="text-[#4b604d] dark:text-[#c1cec2]">{b.questionTopic}</div>
                          <div className="text-[11px] text-[#657766] dark:text-[#99ac9b] tabular-nums">
                            Chi phí: {formatVnd(b.feeAmount)}
                            {b.birthDate ? ` · Ngày sinh lưu tạm: ${b.birthDate}` : ' · Không lưu ngày sinh'}
                          </div>
                        </div>

                        {!isCompleted && (
                          <button
                            type="button"
                            disabled={completingBookingId === b.id}
                            onClick={() => void handleCompleteBooking(b.id)}
                            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef1e8] dark:bg-[#2a362c] hover:bg-[#e2e7da] text-[11px] font-semibold text-[#2d452a] dark:text-[#cfe2cc] transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {completingBookingId === b.id
                                ? 'Đang xóa...'
                                : 'Hoàn tất & xóa ngày sinh'}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host Revenue Dashboard */}
            {myOwnedChairs.length > 0 && (
              <div className="rounded-3xl bg-[#e7efe3] dark:bg-[#212f24] border border-[#c3d3bd] dark:border-[#374b3a] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#46613e] text-white flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#243627] dark:text-[#edf2eb]">
                        Bảng điều khiển Cố vấn của bạn
                      </h3>
                      <p className="text-[11px] text-[#4c644b] dark:text-[#b4c4b5]">
                        Theo dõi ghế đã đặt, vé xem đăng ký và doanh thu ước tính
                      </p>
                    </div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a221b] border border-[#c7d6c1] dark:border-[#344236] text-xs font-semibold text-[#2d492b] dark:text-[#dce5d9] tabular-nums">
                    Doanh thu ước tính:{' '}
                    <span className="text-sm font-bold text-[#46613e] dark:text-[#9fc495]">
                      {formatVnd(totalHostEstimatedRevenue)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myOwnedChairs.map((c) => (
                    <div
                      key={`host-${c.id}`}
                      className="p-3.5 rounded-2xl bg-[#faf7ef] dark:bg-[#1a221b] border border-[#d1dccb] dark:border-[#344236] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#243627] dark:text-[#edf2eb] truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-[#556b56] dark:text-[#a6b7a8] mt-0.5 tabular-nums">
                          Ghế: {c.bookedSeatsCount}/{c.maxSeats} · Vé xem: {c.viewerCount}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleToggleChairLive(c.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                          c.isLive
                            ? 'bg-[#46613e] text-white'
                            : 'bg-[#ebe8dc] dark:bg-[#2c352d] text-[#5d685c] dark:text-[#b4c4b5] border border-[#cfd3c6] dark:border-[#3d4c3f]'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{c.isLive ? 'Đang mở' : 'Tạm nghỉ'}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {hostIncomingBookings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#cde0c8] dark:border-[#374b3a]">
                    <div className="text-xs font-bold text-[#243627] dark:text-[#edf2eb] tabular-nums">
                      Khách đã đăng ký lên ghế của bạn ({hostIncomingBookings.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hostIncomingBookings.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl bg-white dark:bg-[#1a221b] border border-[#d6e0d2] dark:border-[#344236] text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold text-[#243627] dark:text-[#edf2eb]">
                            <span>{b.viewerName}</span>
                            <span className="text-[#46613e] dark:text-[#9fc495] tabular-nums">
                              {formatVnd(b.feeAmount)}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#475d48] dark:text-[#c1cec2]">
                            Chủ đề: {b.questionTopic}
                          </div>
                          {b.birthDate && (
                            <div className="text-[10px] text-[#687c69] dark:text-[#99ac9b]">
                              Ngày sinh tạm: {b.birthDate}
                            </div>
                          )}
                          {b.status !== 'completed' ? (
                            <button
                              type="button"
                              disabled={completingBookingId === b.id}
                              onClick={() => void handleCompleteBooking(b.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eef1e8] dark:bg-[#2a362c] text-[10px] font-semibold text-[#2d452a] dark:text-[#cfe2cc]"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hoàn tất phiên &amp; xóa ngày sinh</span>
                            </button>
                          ) : (
                            <div className="text-[10px] font-semibold text-[#3f6a39] dark:text-[#9fd296]">
                              Đã hoàn tất · Đã xóa ngày sinh
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specialty Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all' as const, label: `Tất cả (${chairs.length})` },
                  { id: 'tarot' as const, label: 'Tarot Soi Chiếu' },
                  { id: 'tuvi' as const, label: 'Tử Vi Đẩu Số' },
                  { id: 'numerology' as const, label: 'Thần Số Học' },
                  { id: 'combined' as const, label: 'Tarot & Tử Vi' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setChairFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                      chairFilter === f.id
                        ? 'bg-[#273829] dark:bg-[#46613e] text-white'
                        : 'bg-[#f1efe5] dark:bg-[#232d25] text-[#4b604d] dark:text-[#b4c4b5] border border-[#dcd9cc] dark:border-[#344236] hover:border-[#9eb198]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advisor Chairs Grid */}
            {loadingChairs && chairs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#576c59] dark:text-[#a6b7a8]">
                Đang tải danh sách cố vấn tâm linh...
              </div>
            ) : filteredChairs.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] text-center text-xs text-[#576c59] dark:text-[#a6b7a8]">
                Hiện chưa có phòng cố vấn nào trong nhóm chuyên môn này. Bạn có thể chuyển bộ lọc hoặc tự mở ghế cố vấn mới.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChairs.map((chair) => {
                  const specLabel = SPECIALTY_LABEL[chair.specialty] || 'Tarot Soi Chiếu';
                  const hasBooked = myBookings.some(
                    (b) => b.chairId === chair.id && b.status === 'pending'
                  );
                  const hasViewerPass = myViewerPasses.some((p) => p.chairId === chair.id);
                  const remainingSeats = Math.max(0, chair.maxSeats - chair.bookedSeatsCount);
                  const isFull = remainingSeats === 0;
                  const fillPercent = Math.min(
                    100,
                    Math.round((chair.bookedSeatsCount / Math.max(1, chair.maxSeats)) * 100)
                  );

                  return (
                    <div
                      key={chair.id}
                      className="rounded-3xl bg-[#f1efe5] dark:bg-[#232d25] border border-[#dcd9cc] dark:border-[#344236] p-5 flex flex-col justify-between gap-4 shadow-sm heali-card-surface"
                    >
                      <div className="space-y-3">
                        {/* Unboxed Metadata Line */}
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-[#4e6b4f] dark:text-[#9ec394]">{specLabel}</span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              chair.isLive
                                ? 'text-[#2f632b] dark:text-[#98d18f]'
                                : 'text-[#73766c] dark:text-[#95a095]'
                            }`}
                          >
                            <Radio className="w-3 h-3" />
                            <span>{chair.isLive ? 'Đang mở phiên' : 'Tạm nghỉ'}</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#243627] dark:text-[#edf2eb] font-serif-healing leading-snug">
                            {chair.title}
                          </h3>
                          <p className="text-xs font-semibold text-[#46613e] dark:text-[#9fc495] mt-0.5">
                            Cố vấn: {chair.hostName}
                          </p>
                        </div>

                        <p className="text-xs text-[#4b604d] dark:text-[#c1cec2] leading-relaxed">{chair.bio}</p>

                        {/* Pricing & Seat Progress Box */}
                        <div className="p-3.5 rounded-2xl bg-[#faf7ef] dark:bg-[#1a221b] border border-[#e0ddd0] dark:border-[#323f34] space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[#5e7260] dark:text-[#a6b7a8] flex items-center gap-1.5">
                              <Armchair className="w-3.5 h-3.5 text-[#46613e] dark:text-[#9fc495]" />
                              Phí lên ghế 1:1
                            </span>
                            <span className="font-bold text-[#243627] dark:text-[#edf2eb] tabular-nums">
                              {formatVnd(chair.seatPrice)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#5e7260] dark:text-[#a6b7a8] flex items-center gap-1.5">
                              <Ticket className="w-3.5 h-3.5 text-[#46613e] dark:text-[#9fc495]" />
                              Vé đăng ký xem
                            </span>
                            <span className="font-bold text-[#243627] dark:text-[#edf2eb] tabular-nums">
                              {formatVnd(chair.viewerTicketPrice)}
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-[#eae7dc] dark:border-[#2e3b30] space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-[#576c59] dark:text-[#a6b7a8] tabular-nums">
                              <span>
                                {isFull
                                  ? 'Đã kín ghế phiên này'
                                  : `Còn ${remainingSeats}/${chair.maxSeats} ghế trống`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {chair.viewerCount} người xem
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#e6e3d7] dark:bg-[#2f3b31] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#46613e] transition-all"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {hasBooked ? (
                          <div className="flex-1 py-2.5 px-3 rounded-xl bg-[#e5efe1] dark:bg-[#243527] border border-[#bfd2b8] dark:border-[#3e5942] text-[#2e4c2b] dark:text-[#a6d49f] text-xs font-semibold text-center">
                            Đã giữ ghế hàng chờ
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!chair.isLive || isFull}
                            onClick={() => openBookingModalForChair(chair)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:bg-[#c8ccc2] dark:disabled:bg-[#364037] text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <Armchair className="w-3.5 h-3.5" />
                            <span>{isFull ? 'Hết ghế' : 'Đăng ký lên ghế'}</span>
                          </button>
                        )}

                        {hasViewerPass ? (
                          <div className="py-2.5 px-3 rounded-xl bg-[#faf7ef] dark:bg-[#1a221b] border border-[#c6d5c0] dark:border-[#3b4d3e] text-[#46613e] dark:text-[#9fc495] text-xs font-semibold text-center flex items-center justify-center gap-1 whitespace-nowrap">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Đã có vé xem</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleSubscribeViewer(chair)}
                            className="py-2.5 px-3 rounded-xl bg-[#faf7ef] dark:bg-[#1a221b] hover:bg-white dark:hover:bg-[#242e25] border border-[#cad5c5] dark:border-[#3b4d3e] text-[#273829] dark:text-[#edf2eb] text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#46613e] dark:text-[#9fc495]" />
                            <span>Mua vé xem</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Book a Reader Seat */}
      {bookingChair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitBooking}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1e2720] border border-[#dcdad0] dark:border-[#344236] shadow-2xl p-6 space-y-4 text-[#273829] dark:text-[#edf2eb]"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#e5e2d5] dark:border-[#323f34]">
              <div>
                <h3 className="text-base font-bold font-serif-healing">Đăng ký lên ghế 1:1</h3>
                <p className="text-xs text-[#546956] dark:text-[#a6b7a8] mt-0.5">
                  {bookingChair.title} · Phí dự kiến:{' '}
                  <strong className="tabular-nums">{formatVnd(bookingChair.seatPrice)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookingChair(null);
                  setPauseWarning(null);
                }}
                className="p-1 text-[#5e7260] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-white"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Vấn đề / Câu hỏi muốn soi chiếu *
                </label>
                <input
                  type="text"
                  required
                  value={bookingTopic}
                  onChange={(e) => {
                    setBookingTopic(e.target.value);
                    setPauseWarning(null);
                  }}
                  placeholder="VD: Soi chiếu cảm xúc và hướng đi nhẹ nhàng sắp tới"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb] focus:outline-none focus:border-[#46613e]"
                />
              </div>

              {/* Conditional birthDate: hidden and never stored for pure Tarot chairs (Section 4.4) */}
              {bookingChair.specialty !== 'tarot' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Ngày sinh (chỉ dùng cho Tử Vi / Số học)
                  </label>
                  <input
                    type="date"
                    value={bookingBirthDate}
                    onChange={(e) => setBookingBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb] focus:outline-none focus:border-[#46613e]"
                  />
                  <p className="text-[11px] text-[#5e7260] dark:text-[#9cb09e] mt-1">
                    Ngày sinh chỉ dùng tạm trong phiên này và xóa khỏi máy chủ ngay khi bấm hoàn tất.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Lời nhắn riêng cho cố vấn (đã kèm ngữ cảnh nếu bạn vừa trải bài)
                </label>
                <textarea
                  rows={3}
                  value={bookingNote}
                  onChange={(e) => {
                    setBookingNote(e.target.value);
                    setPauseWarning(null);
                  }}
                  placeholder="Mô tả ngắn bối cảnh để cố vấn nắm rõ hơn..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb] focus:outline-none focus:border-[#46613e]"
                />
              </div>

              {/* Transparent cost & non-predictive reminder */}
              <div className="p-3 rounded-2xl bg-[#f1efe5] dark:bg-[#242f26] border border-[#dcd9cc] dark:border-[#344236] text-[11px] text-[#4b604d] dark:text-[#c1cec2] space-y-1">
                <div className="font-semibold text-[#273829] dark:text-[#edf2eb] tabular-nums">
                  Xác nhận chi phí: {formatVnd(bookingChair.seatPrice)}
                </div>
                <p>
                  Heali định vị đây là không gian tham khảo gợi mở suy ngẫm, không phải bói toán định mệnh hay trị liệu tâm lý.
                </p>
              </div>

              {/* Gentle 24h cooldown / Ex-relationship loop pause prompt (Section 4.4) */}
              {pauseWarning && (
                <div className="p-3.5 rounded-2xl bg-[#f6efe2] dark:bg-[#2f2718] border border-[#dec89c] dark:border-[#5f4d28] space-y-2.5 text-xs text-[#573f17] dark:text-[#f0dbb0]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#a3721f] dark:text-[#e5b869] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{pauseWarning.message}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {pauseWarning.suggestExUrgeFlow && (
                      <button
                        type="button"
                        onClick={() => {
                          setBookingChair(null);
                          setPauseWarning(null);
                          window.dispatchEvent(new CustomEvent('heali:open-ex-urge'));
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white font-semibold transition"
                      >
                        Mở công cụ 10 phút: Tôi sắp nhắn cho người cũ
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={submittingBooking}
                      onClick={() => void submitBooking(true)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#1e261f] border border-[#d6c297] dark:border-[#5a4b2d] font-semibold text-[#3f3016] dark:text-[#ebd7ad] hover:opacity-90 transition"
                    >
                      {submittingBooking ? 'Đang xử lý...' : 'Mình đã cân nhắc kỹ, vẫn giữ ghế'}
                    </button>
                  </div>
                </div>
              )}

              <SupportPromptCard text={`${bookingTopic} ${bookingNote}`} compact />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBookingChair(null);
                  setPauseWarning(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#2b372d] text-xs font-semibold text-[#3f5440] dark:text-[#c7d7c8]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingBooking}
                className="px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition"
              >
                {submittingBooking ? 'Đang gửi...' : 'Xác nhận giữ ghế'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Open Host Monetization Chair */}
      {showCreateChairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c281e]/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateChair}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[#faf7ef] dark:bg-[#1e2720] border border-[#dcdad0] dark:border-[#344236] shadow-2xl p-6 space-y-4 text-[#273829] dark:text-[#edf2eb]"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#e5e2d5] dark:border-[#323f34]">
              <div>
                <h3 className="text-base font-bold font-serif-healing">Mở Ghế Cố Vấn Tâm Linh</h3>
                <p className="text-xs text-[#546956] dark:text-[#a6b7a8] mt-0.5">
                  Tạo phòng tiếp nhận lượt đăng ký ghế 1:1 &amp; vé xem trực tiếp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateChairModal(false)}
                className="p-1 text-[#5e7260] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-white"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Tên ghế / Chủ đề phiên *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Trải bài Tarot soi chiếu cảm xúc & sự bình an"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb] focus:outline-none focus:border-[#46613e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Chuyên môn</label>
                <select
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value as SpiritualSpecialty)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb]"
                >
                  <option value="tarot">Tarot Soi Chiếu</option>
                  <option value="tuvi">Tử Vi Đẩu Số</option>
                  <option value="numerology">Thần Số Học</option>
                  <option value="combined">Kết hợp Tarot &amp; Tử Vi</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Ghế (≤300k đ)</label>
                  <input
                    type="number"
                    min={0}
                    max={300000}
                    step={1000}
                    value={newSeatPrice}
                    onChange={(e) => setNewSeatPrice(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Vé xem (≤50k đ)</label>
                  <input
                    type="number"
                    min={0}
                    max={50000}
                    step={1000}
                    value={newTicketPrice}
                    onChange={(e) => setNewTicketPrice(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Số ghế (≤20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newMaxSeats}
                    onChange={(e) => setNewMaxSeats(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Giới thiệu ngắn phong cách lắng nghe &amp; gợi mở
                </label>
                <textarea
                  rows={2}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Chia sẻ nhẹ nhàng về phong cách lắng nghe và trải bài của bạn..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151c16] border border-[#d6d3c6] dark:border-[#3b4b3d] text-xs text-[#273829] dark:text-[#edf2eb]"
                />
              </div>

              {/* Mandatory Host Code of Conduct acceptance (Section 4.4) */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f1efe5] dark:bg-[#242f26] border border-[#dcd9cc] dark:border-[#344236] text-[11px] text-[#354837] dark:text-[#c7d7c8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hostRulesAccepted}
                  onChange={(e) => setHostRulesAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-[#9fb29d] text-[#46613e] focus:ring-[#46613e]"
                />
                <span className="leading-relaxed">
                  Tôi cam kết tuân thủ <strong>Quy tắc Cố vấn Heali</strong>: không chẩn đoán bệnh lý, không phán đoán định mệnh tiêu cực gây hoang mang, không gài khách quay lại để thu phí.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateChairModal(false)}
                className="px-4 py-2 rounded-xl bg-[#eef1e8] dark:bg-[#2b372d] text-xs font-semibold text-[#3f5440] dark:text-[#c7d7c8]"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={creatingChair || !hostRulesAccepted}
                className="px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] disabled:bg-[#b5bdb2] dark:disabled:bg-[#364037] text-white text-xs font-semibold transition"
              >
                {creatingChair ? 'Đang mở...' : 'Mở ghế ngay'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
