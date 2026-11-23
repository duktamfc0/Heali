/**
 * Heali API Client with offline resilience, server-verified PIN tokens, and strict privacy guarantees.
 */

export interface User {
  id: string;
  token?: string;
  nickname: string;
  avatar: string;
  statusMessage: string;
  hasPin: boolean;
  pinUnlocked: boolean;
  hasRecoveryCode?: boolean;
  blockedUserIds: string[];
  reportedPostIds: string[];
  isBanned?: boolean;
  createdAt: string;
}

export interface CommunityStatus {
  communityOpen: boolean;
  moderationQueueReady: boolean;
  activeModeratorsCount: number;
  moderatorAlias: string | null;
  slaTargetMinutes: number;
  shiftNote: string;
  closedReason: string | null;
  pendingModerationCount?: number;
  queueOverloaded?: boolean;
  slowModeNotice?: string | null;
}

export interface SharedLanternGift {
  id: string;
  sharePath?: string;
  message: string;
  color: 'pink' | 'gold' | 'lavender' | 'moon';
  senderDisplayName: string | null;
  showSenderName?: boolean;
  expiresAt: string;
  hasReplied?: boolean;
  replyMessage?: string | null;
  replyAt?: string | null;
  createdAt: string;
}

export interface LanternNightEvent {
  id: string;
  title: string;
  subtitle: string;
  startAt: string;
  endAt: string;
  isLiveNow?: boolean;
}

export interface LanternNightResponse {
  nextEvent: LanternNightEvent;
  upcomingEvents: LanternNightEvent[];
  publicLanternsCount: number;
  recentPublicLanterns: Array<{
    id: string;
    authorNickname: string;
    message: string;
    color: 'pink' | 'gold' | 'lavender' | 'moon';
    ripples: number;
    createdAt: string;
  }>;
}

export type HealthyMetricEventType =
  | 'calm_tool_completed'
  | 'support_card_shown'
  | 'support_card_opened'
  | 'support_helpful_yes'
  | 'first_useful_action'
  | 'lantern_gift_created'
  | 'challenge_step_done'
  | 'feeling_lighter_yes'
  | 'feeling_lighter_no';

export interface HealthyMetricsResponse {
  windowDays: number;
  aggregates: Record<string, number>;
  medianFirstUsefulMs: number | null;
  supportOpenRatePct: number | null;
  supportHelpfulRatePct: number | null;
  feelingLighterRatePct: number | null;
  slaCompliancePct: number | null;
  resolvedWithin30d: number;
  feedbackNotes: Array<{
    id: string;
    note: string;
    category: string;
    createdAt: string;
  }>;
  gate: CommunityStatus;
}

export interface AdminAuthStatus {
  envConfigured: boolean;
  needsBootstrap: boolean;
}

export interface AiCompanionStatus {
  dailyLimit: number;
  turnsUsedToday: number;
  remainingTurns: number;
  isConfigured: boolean;
}

export interface AiReflectResponse {
  reply?: string;
  blockedBySafety: boolean;
  riskLevel: number;
  supportCardRequired?: boolean;
  turnsUsedToday: number;
  dailyLimit: number;
  isClosingTurn?: boolean;
}

export interface QuarterlyReportMetricValue {
  value: number | null;
  display: string;
  maskedBelowThreshold: boolean;
}

export interface QuarterlyReportResponse {
  quarter: string;
  periodStart: string;
  periodEnd: string;
  anonymityThreshold: number;
  privacyGuarantee: string;
  metrics: {
    calmToolsCompleted: QuarterlyReportMetricValue;
    lanternsFloated: QuarterlyReportMetricValue;
    sharedGiftsCreated: QuarterlyReportMetricValue;
    approvedConfessions: QuarterlyReportMetricValue;
    wishesHung: QuarterlyReportMetricValue;
    feelingLighterSampleMet: boolean;
    feelingLighterPct: number | null;
  };
}

export interface PartnerInquiryPayload {
  orgName: string;
  orgType: 'university' | 'company' | 'ngo' | 'community';
  contactEmail: string;
  contactPerson?: string;
  note: string;
}

export interface ModerationQueueItem {
  id: string;
  sourceType: string;
  sourceId: string;
  reporterUserId: string | null;
  reason: string;
  riskLevel: number;
  status: 'pending' | 'resolved';
  createdAt: string;
  reviewedAt: string | null;
  reviewerNote: string | null;
  targetTitle: string;
  targetExcerpt: string;
  targetCategory: string;
  targetAuthorId: string;
  targetAuthorAlias: string;
  targetStatus: string;
}

export interface ModerationOverview {
  moderatorAlias: string;
  gate: CommunityStatus;
  counts: {
    level3Pending: number;
    level2Pending: number;
    reportsPending: number;
    totalPending: number;
    resolvedTodayCount: number;
    bannedUsersCount: number;
  };
}

export interface ModerationAuditLog {
  id: string;
  queueItemId: string;
  sourceType: string;
  sourceId: string;
  action: string;
  moderatorAlias: string;
  note: string;
  createdAt: string;
}

export type ModerationActionType =
  | 'approve_public'
  | 'approve_with_tw'
  | 'hide_post'
  | 'mark_safety_outreach'
  | 'ban_author'
  | 'dismiss_report';

export interface Confession {
  id: string;
  authorId: string;
  authorNickname: string;
  authorAvatar: string;
  category: 'breakup' | 'loneliness' | 'relationship' | 'family' | 'friendship' | 'healing';
  title: string;
  content: string;
  moodTag: string;
  isTriggerWarning: boolean;
  reactions: {
    hug: number;
    listen: number;
    not_alone: number;
    peace: number;
    strength: number;
  };
  userReactions: Record<string, string[]>;
  reportCount: number;
  isModerated: boolean;
  moderationStatus?: string;
  createdAt: string;
}

export interface CommunityStats {
  activeOnlineCount: number;
  lanternsCount: number;
  wishesCount: number;
  reactionsTotal: number;
  confessionsCount: number;
}

export interface Lantern {
  id: string;
  authorId: string;
  authorNickname: string;
  message: string;
  color: 'pink' | 'gold' | 'lavender' | 'moon';
  x: number;
  y: number;
  ripples: number;
  createdAt: string;
}

export interface Wish {
  id: string;
  authorId: string;
  authorNickname: string;
  wishText: string;
  actionCommitment: string;
  tag: 'healing' | 'self_love' | 'letting_go' | 'inner_peace' | 'future';
  supports: number;
  userSupports: string[];
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  moodScore: number;
  emotions: string[];
  title: string;
  content: string;
  gratitude: string;
  selfCareAction: string;
  createdAt: string;
}

export interface MoodCheckin {
  id: string;
  date: string;
  moodScore: number;
  emotions: string[];
  note: string;
  createdAt: string;
}

export interface UnsentLetter {
  id: string;
  userId: string;
  recipient: 'ex' | 'self' | 'family' | 'friend' | 'someone';
  recipientName: string;
  title: string;
  content: string;
  status: 'sealed' | 'burned_released';
  sealedUntil?: string | null;
  isTimeLocked?: boolean;
  burnedAt?: string | null;
  createdAt: string;
}

export interface Helpline {
  id?: string;
  name: string;
  phone: string;
  hours: string;
  free: boolean;
  scope?: string;
  verificationStatus?: 'verified_official' | 'needs_verification';
  verificationNote?: string;
  lastUpdated?: string;
  note: string;
}

export type SpiritualSpecialty = 'tarot' | 'tuvi' | 'numerology' | 'combined';

export interface SpiritualChair {
  id: string;
  ownerUserId: string;
  hostName: string;
  specialty: SpiritualSpecialty;
  title: string;
  bio: string;
  seatPrice: number;
  viewerTicketPrice: number;
  maxSeats: number;
  bookedSeatsCount: number;
  viewerCount: number;
  isLive: boolean;
  createdAt: string;
}

export interface SpiritualSeatBooking {
  id: string;
  chairId: string;
  userId: string;
  viewerName: string;
  birthDate: string;
  questionTopic: string;
  note: string;
  feeAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface SpiritualViewerPass {
  id: string;
  chairId: string;
  userId: string;
  viewerName: string;
  feeAmount: number;
  createdAt: string;
}

export interface SpiritualRoomResponse {
  paidEnabled?: boolean;
  chairs: SpiritualChair[];
  myBookings: SpiritualSeatBooking[];
  myViewerPasses: SpiritualViewerPass[];
  hostIncomingBookings: SpiritualSeatBooking[];
}

export class PinLockedError extends Error {
  public readonly pinRequired = true;
  constructor(message = 'Không gian riêng tư đang khóa bằng mã PIN.') {
    super(message);
  }
}

export class SpiritualPauseRecommendedError extends Error {
  public readonly suggestExUrgeFlow: boolean;
  constructor(message: string, suggestExUrgeFlow = false) {
    super(message);
    this.suggestExUrgeFlow = suggestExUrgeFlow;
  }
}

const STORAGE_TOKEN_KEY = 'heali_auth_token';
const STORAGE_USER_KEY = 'heali_user_cached';
const STORAGE_PIN_TOKEN_KEY = 'heali_pin_unlock_token';
const STORAGE_OFFLINE_JOURNALS = 'heali_offline_journals';
const STORAGE_OFFLINE_LETTERS = 'heali_offline_letters';

class HealiApiClient {
  private token: string | null = null;
  private pinToken: string | null = null;
  private adminToken: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.token = localStorage.getItem(STORAGE_TOKEN_KEY);
    this.pinToken = sessionStorage.getItem(STORAGE_PIN_TOKEN_KEY);
    const cached = localStorage.getItem(STORAGE_USER_KEY);
    if (cached) {
      try {
        this.currentUser = JSON.parse(cached);
      } catch {
        // ignore
      }
    }
  }

  public getToken() {
    return this.token;
  }

  public getCurrentUser() {
    return this.currentUser;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['x-heali-token'] = this.token;
    }
    if (this.pinToken) {
      headers['x-heali-pin-token'] = this.pinToken;
    }
    return headers;
  }

  private saveUserCache(user: User) {
    this.currentUser = user;
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  }

  public async initSession(nickname?: string, avatar?: string): Promise<User> {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          existingToken: this.token,
          nickname,
          avatar,
        }),
      });

      if (!res.ok) throw new Error('Session initialization failed');
      const data = await res.json();
      if (data.token) {
        this.token = data.token;
        localStorage.setItem(STORAGE_TOKEN_KEY, this.token!);
      }
      this.saveUserCache(data.user);
      return data.user;
    } catch {
      if (this.currentUser) return this.currentUser;
      const guestUser: User = {
        id: 'u-offline-guest',
        nickname: nickname || 'Bạn Lữ Hành',
        avatar: avatar || 'heart',
        statusMessage: 'Một góc nhỏ yên tĩnh cho lúc lòng vỡ.',
        hasPin: false,
        pinUnlocked: true,
        blockedUserIds: [],
        reportedPostIds: [],
        createdAt: new Date().toISOString(),
      };
      this.currentUser = guestUser;
      return guestUser;
    }
  }

  public async updateProfile(
    updates: Partial<{
      nickname: string;
      avatar: string;
      statusMessage: string;
      pinCode: string | null;
      currentPin?: string;
    }>
  ): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Cập nhật hồ sơ thất bại');
    }
    const data = await res.json();
    if (data.pinToken) {
      this.pinToken = data.pinToken;
      sessionStorage.setItem(STORAGE_PIN_TOKEN_KEY, data.pinToken);
    } else if (updates.pinCode === null || updates.pinCode === '') {
      this.pinToken = null;
      sessionStorage.removeItem(STORAGE_PIN_TOKEN_KEY);
    }
    this.saveUserCache(data.user);
    return data.user;
  }

  public async verifyPin(pinCode: string): Promise<User> {
    const res = await fetch('/api/auth/pin/verify', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ pinCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Mã PIN không chính xác');
    }
    if (data.pinToken) {
      this.pinToken = data.pinToken;
      sessionStorage.setItem(STORAGE_PIN_TOKEN_KEY, data.pinToken);
    }
    if (data.user) {
      this.saveUserCache(data.user);
    }
    return data.user;
  }

  public async lockPrivateSpace(): Promise<void> {
    try {
      await fetch('/api/auth/pin/lock', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      this.pinToken = null;
      sessionStorage.removeItem(STORAGE_PIN_TOKEN_KEY);
      if (this.currentUser) {
        this.saveUserCache({ ...this.currentUser, pinUnlocked: !this.currentUser.hasPin });
      }
    }
  }

  public async generateRecoveryCode(): Promise<{ recoveryCode: string; accountId: string; note: string }> {
    const res = await fetch('/api/auth/recovery/generate', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể tạo mã khôi phục.');
    }
    if (this.currentUser) {
      this.saveUserCache({ ...this.currentUser, hasRecoveryCode: true });
    }
    return data;
  }

  public async restoreWithRecovery(userId: string, recoveryCode: string): Promise<User> {
    const res = await fetch('/api/auth/recovery/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, recoveryCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Khôi phục tài khoản thất bại.');
    }
    this.token = data.token;
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    this.pinToken = null;
    sessionStorage.removeItem(STORAGE_PIN_TOKEN_KEY);
    this.saveUserCache(data.user);
    return data.user;
  }

  public async exportAllData(): Promise<Record<string, unknown>> {
    const res = await fetch('/api/auth/export', {
      headers: this.getHeaders(),
    });
    if (res.status === 423) {
      throw new PinLockedError();
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể xuất dữ liệu lúc này.');
    }
    return res.json();
  }

  public async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể xóa tài khoản lúc này.');
    }
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_OFFLINE_JOURNALS);
    localStorage.removeItem(STORAGE_OFFLINE_LETTERS);
    sessionStorage.removeItem(STORAGE_PIN_TOKEN_KEY);
    this.token = null;
    this.pinToken = null;
    this.currentUser = null;
    return data;
  }

  // Real Community Gate & Stats
  public async getCommunityStatus(): Promise<CommunityStatus> {
    try {
      const res = await fetch('/api/community/status');
      if (!res.ok) throw new Error('Status failed');
      return res.json();
    } catch {
      return {
        communityOpen: true,
        moderationQueueReady: true,
        activeModeratorsCount: 1,
        moderatorAlias: null,
        slaTargetMinutes: 15,
        shiftNote: '',
        closedReason: null,
        pendingModerationCount: 0,
        queueOverloaded: false,
        slowModeNotice: null,
      };
    }
  }

  public async getCommunityStats(): Promise<CommunityStats> {
    try {
      const res = await fetch('/api/community/stats');
      if (!res.ok) throw new Error('Stats failed');
      return res.json();
    } catch {
      return {
        activeOnlineCount: 0,
        lanternsCount: 0,
        wishesCount: 0,
        reactionsTotal: 0,
        confessionsCount: 0,
      };
    }
  }

  // Confessions
  public async getConfessions(category = 'all', sort = 'newest'): Promise<Confession[]> {
    try {
      const res = await fetch(`/api/confessions?category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Fetch confessions failed');
      const data = await res.json();
      return data.confessions;
    } catch {
      return [];
    }
  }

  public async postConfession(data: {
    title: string;
    content: string;
    category: string;
    moodTag: string;
    isTriggerWarning?: boolean;
  }): Promise<{ confession: Confession; heldForModeration?: boolean; riskLevel?: number }> {
    const res = await fetch('/api/confessions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Đăng lời bộc bạch thất bại');
    }
    return res.json();
  }

  public async reactConfession(id: string, type: 'hug' | 'listen' | 'not_alone' | 'peace' | 'strength') {
    const res = await fetch(`/api/confessions/${id}/react`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error('Phản ứng thất bại');
    return res.json();
  }

  public async reportConfession(id: string, reason: string) {
    const res = await fetch(`/api/confessions/${id}/report`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Báo cáo thất bại');
    return res.json();
  }

  public async blockUser(targetUserId: string) {
    const res = await fetch('/api/users/block', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetUserId }),
    });
    if (!res.ok) throw new Error('Chặn thất bại');
    return res.json();
  }

  // Lanterns
  public async getLanterns(): Promise<Lantern[]> {
    try {
      const res = await fetch('/api/lanterns');
      if (!res.ok) throw new Error('Fetch lanterns failed');
      const data = await res.json();
      return data.lanterns;
    } catch {
      return [];
    }
  }

  public async floatLantern(message: string, color: 'pink' | 'gold' | 'lavender' | 'moon'): Promise<Lantern> {
    const res = await fetch('/api/lanterns', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message, color }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Thả hoa đăng thất bại');
    }
    const data = await res.json();
    return data.lantern;
  }

  public async rippleLantern(id: string): Promise<number> {
    try {
      const res = await fetch(`/api/lanterns/${id}/ripple`, { method: 'POST' });
      const data = await res.json();
      return data.ripples;
    } catch {
      return 1;
    }
  }

  // Wishes
  public async getWishes(): Promise<Wish[]> {
    try {
      const res = await fetch('/api/wishes');
      if (!res.ok) throw new Error('Fetch wishes failed');
      const data = await res.json();
      return data.wishes;
    } catch {
      return [];
    }
  }

  public async hangWish(data: { wishText: string; actionCommitment: string; tag: string }): Promise<Wish> {
    const res = await fetch('/api/wishes', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Treo ước nguyện thất bại');
    }
    const result = await res.json();
    return result.wish;
  }

  public async supportWish(id: string) {
    const res = await fetch(`/api/wishes/${id}/support`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Gửi lời chúc thất bại');
    return res.json();
  }

  // Private Mood Check-ins (PIN protected)
  public async getMoodCheckins(): Promise<{ checkins: MoodCheckin[]; weeklySelfCareCount: number }> {
    const res = await fetch('/api/private/mood-checkins', {
      headers: this.getHeaders(),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) return { checkins: [], weeklySelfCareCount: 0 };
    return res.json();
  }

  public async saveMoodCheckin(payload: {
    moodScore: number;
    emotions?: string[];
    note?: string;
  }): Promise<{ checkin: MoodCheckin; riskLevel: number }> {
    const res = await fetch('/api/private/mood-checkins', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) throw new Error('Lưu tâm trạng thất bại');
    return res.json();
  }

  // Private Journal (Strictly PIN & encryption protected)
  public async getJournalEntries(): Promise<JournalEntry[]> {
    const res = await fetch('/api/private/journal', {
      headers: this.getHeaders(),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) {
      const cached = localStorage.getItem(STORAGE_OFFLINE_JOURNALS);
      return cached ? JSON.parse(cached) : [];
    }
    const data = await res.json();
    localStorage.setItem(STORAGE_OFFLINE_JOURNALS, JSON.stringify(data.entries));
    return data.entries;
  }

  public async saveJournalEntry(entry: {
    date: string;
    moodScore: number;
    emotions: string[];
    title: string;
    content: string;
    gratitude: string;
    selfCareAction: string;
  }): Promise<JournalEntry> {
    const res = await fetch('/api/private/journal', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(entry),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lưu nhật ký thất bại');
    }
    const data = await res.json();
    return data.entry;
  }

  public async deleteJournalEntry(id: string) {
    const res = await fetch(`/api/private/journal/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) throw new Error('Xóa nhật ký thất bại');
    return res.json();
  }

  // Private Unsent Letters
  public async getLetters(): Promise<UnsentLetter[]> {
    const res = await fetch('/api/private/letters', {
      headers: this.getHeaders(),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) {
      const cached = localStorage.getItem(STORAGE_OFFLINE_LETTERS);
      return cached ? JSON.parse(cached) : [];
    }
    const data = await res.json();
    localStorage.setItem(STORAGE_OFFLINE_LETTERS, JSON.stringify(data.letters));
    return data.letters;
  }

  public async saveLetter(letter: {
    recipient: 'ex' | 'self' | 'family' | 'friend' | 'someone';
    recipientName: string;
    title: string;
    content: string;
    sealedUntil?: string | null;
  }): Promise<UnsentLetter> {
    const res = await fetch('/api/private/letters', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(letter),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ghi thư thất bại');
    }
    const data = await res.json();
    return data.letter;
  }

  public async sealLetterUntil(id: string, sealedUntil: string): Promise<{ letter: UnsentLetter }> {
    const res = await fetch(`/api/private/letters/${id}/seal`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ sealedUntil }),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể niêm phong thư lúc này.');
    }
    return res.json();
  }

  public async burnLetter(id: string): Promise<{ erasedId: string; erasedPermanently: boolean; message: string }> {
    const res = await fetch(`/api/private/letters/${id}/burn`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) throw new Error('Không thể thực hiện thao tác xoá thư lúc này.');
    return res.json();
  }

  public async deleteLetter(id: string) {
    const res = await fetch(`/api/private/letters/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (res.status === 423) throw new PinLockedError();
    if (!res.ok) throw new Error('Xóa thư thất bại');
    return res.json();
  }

  // Helpline Crisis (Single source of truth)
  public async getHelplines(): Promise<{ helplines: Helpline[]; lastReviewedAt?: string }> {
    try {
      const res = await fetch('/api/helplines');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return { helplines: data.helplines || [], lastReviewedAt: data.lastReviewedAt };
    } catch {
      return {
        lastReviewedAt: '2025-05-01',
        helplines: [
          {
            name: 'Cấp cứu Y tế khẩn cấp (Quốc gia)',
            phone: '115',
            hours: '24/7 (Toàn quốc)',
            free: false,
            verificationStatus: 'verified_official',
            lastUpdated: '2025-05-01',
            note: 'Gọi khi có nguy cơ tổn thương thể chất ngay lúc này.',
          },
          {
            name: 'Tổng đài Quốc gia Bảo vệ Trẻ em',
            phone: '111',
            hours: '24/7 (Miễn cước)',
            free: true,
            scope: 'Phạm vi chính: Trẻ em & thanh thiếu niên.',
            verificationStatus: 'verified_official',
            lastUpdated: '2025-05-01',
            note: 'Hỗ trợ bảo vệ và tư vấn tâm lý cho trẻ em, thanh thiếu niên.',
          },
        ],
      };
    }
  }

  // Spiritual Room
  public async getSpiritualRoomData(): Promise<SpiritualRoomResponse> {
    const res = await fetch('/api/spiritual/chairs', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải phòng tâm linh');
    }
    return res.json();
  }

  public async createSpiritualChair(payload: {
    title: string;
    bio: string;
    specialty: SpiritualSpecialty;
    seatPrice: number;
    viewerTicketPrice: number;
    maxSeats: number;
    hostRulesAccepted: boolean;
  }): Promise<SpiritualChair> {
    const res = await fetch('/api/spiritual/chairs', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Mở ghế cố vấn thất bại');
    }
    const data = await res.json();
    return data.chair;
  }

  public async toggleSpiritualChair(chairId: string): Promise<SpiritualChair> {
    const res = await fetch(`/api/spiritual/chairs/${encodeURIComponent(chairId)}/toggle`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể đổi trạng thái ghế');
    }
    const data = await res.json();
    return data.chair;
  }

  public async bookSpiritualSeat(
    chairId: string,
    payload: {
      birthDate?: string;
      questionTopic: string;
      note?: string;
      confirmAfterReflection?: boolean;
    }
  ): Promise<{ booking: SpiritualSeatBooking; chair: SpiritualChair }> {
    const res = await fetch(`/api/spiritual/chairs/${encodeURIComponent(chairId)}/book-seat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 409 && err.code === 'REFLECTION_PAUSE_RECOMMENDED') {
        throw new SpiritualPauseRecommendedError(err.error, Boolean(err.suggestExUrgeFlow));
      }
      throw new Error(err.error || 'Đăng ký lên ghế thất bại');
    }
    return res.json();
  }

  public async completeSpiritualBooking(
    bookingId: string
  ): Promise<{ booking: SpiritualSeatBooking; birthDateErased: boolean; message: string }> {
    const res = await fetch(`/api/spiritual/bookings/${encodeURIComponent(bookingId)}/complete`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể hoàn tất lượt xem');
    }
    return res.json();
  }

  public async subscribeSpiritualViewer(
    chairId: string
  ): Promise<{ pass: SpiritualViewerPass; chair: SpiritualChair; alreadySubscribed: boolean }> {
    const res = await fetch(`/api/spiritual/chairs/${encodeURIComponent(chairId)}/subscribe-viewer`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Đăng ký xem trực tiếp thất bại');
    }
    return res.json();
  }

  // Internal Moderation Portal (/admin) — token stays strictly in JS memory
  private getAdminHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
    }
    return headers;
  }

  public hasAdminToken(): boolean {
    return Boolean(this.adminToken);
  }

  public async getAdminStatus(): Promise<AdminAuthStatus> {
    const res = await fetch('/api/admin/status');
    if (!res.ok) throw new Error('Không thể kiểm tra trạng thái cổng điều phối');
    return res.json();
  }

  public async bootstrapAdmin(passcode: string, moderatorAlias: string): Promise<{ moderatorAlias: string }> {
    const res = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode, moderatorAlias }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể thiết lập mã truy cập điều phối viên.');
    }
    this.adminToken = data.token;
    return { moderatorAlias: data.moderatorAlias };
  }

  public async loginAdmin(passcode: string, moderatorAlias: string): Promise<{ moderatorAlias: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode, moderatorAlias }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập cổng điều phối thất bại.');
    }
    this.adminToken = data.token;
    return { moderatorAlias: data.moderatorAlias };
  }

  public async logoutAdmin(): Promise<void> {
    try {
      if (this.adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: this.getAdminHeaders(),
        });
      }
    } finally {
      this.adminToken = null;
    }
  }

  public async getAdminOverview(): Promise<ModerationOverview> {
    const res = await fetch('/api/admin/overview', { headers: this.getAdminHeaders() });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      this.adminToken = null;
      throw new Error('ADMIN_UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(data.error || 'Không thể tải tổng quan ca trực');
    return data;
  }

  public async getModerationQueue(status: 'pending' | 'resolved' = 'pending'): Promise<ModerationQueueItem[]> {
    const res = await fetch(`/api/admin/queue?status=${status}`, { headers: this.getAdminHeaders() });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      this.adminToken = null;
      throw new Error('ADMIN_UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(data.error || 'Không thể tải hàng đợi kiểm duyệt');
    return data.items || [];
  }

  public async resolveModerationItem(
    id: string,
    action: ModerationActionType,
    note = ''
  ): Promise<ModerationQueueItem> {
    const res = await fetch(`/api/admin/queue/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify({ action, note }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      this.adminToken = null;
      throw new Error('ADMIN_UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(data.error || 'Không thể cập nhật xử lý');
    return data.item;
  }

  public async toggleModerationShift(payload: {
    status: 'active' | 'paused';
    moderatorAlias?: string;
    slaTargetMinutes?: number;
    note?: string;
  }): Promise<CommunityStatus> {
    const res = await fetch('/api/admin/shift', {
      method: 'POST',
      headers: this.getAdminHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      this.adminToken = null;
      throw new Error('ADMIN_UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(data.error || 'Không thể đổi trạng thái ca trực');
    return data.gate;
  }

  public async getModerationAuditLogs(): Promise<ModerationAuditLog[]> {
    const res = await fetch('/api/admin/audit-logs', { headers: this.getAdminHeaders() });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      this.adminToken = null;
      throw new Error('ADMIN_UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(data.error || 'Không thể tải nhật ký xử lý');
    return data.logs || [];
  }

  public async getAdminMetrics(): Promise<HealthyMetricsResponse> {
    const res = await fetch('/api/admin/metrics', { headers: this.getAdminHeaders() });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      this.adminToken = null;
      throw new Error('ADMIN_UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(data.error || 'Không thể tải chỉ số lành mạnh');
    return data;
  }

  // Stage 3: Lantern Gift Links, Đêm Hoa Đăng, Healthy Opt-Out Metrics & Anonymous Feedback
  public async createLanternGift(payload: {
    message: string;
    color: 'pink' | 'gold' | 'lavender' | 'moon';
    showSenderName?: boolean;
    senderAlias?: string;
    expiryDays?: number;
  }): Promise<SharedLanternGift> {
    const res = await fetch('/api/lantern-gifts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể tạo liên kết ngọn đèn lúc này.');
    }
    return data.gift;
  }

  public async getLanternGift(token: string): Promise<SharedLanternGift> {
    const res = await fetch(`/api/lantern-gifts/${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Ngọn đèn này không còn khả dụng.');
    }
    return data.gift;
  }

  public async replyLanternGift(
    token: string,
    replyMessage: string,
    color: 'pink' | 'gold' | 'lavender' | 'moon' = 'pink'
  ): Promise<{ replied: boolean; replyMessage: string; replyAt: string }> {
    const res = await fetch(`/api/lantern-gifts/${encodeURIComponent(token)}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyMessage, color }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể gửi ngọn đèn đáp lại.');
    }
    return data;
  }

  public async optOutLanternGift(token: string): Promise<{ optedOut: boolean; message: string }> {
    const res = await fetch(`/api/lantern-gifts/${encodeURIComponent(token)}/opt-out`, {
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể tắt liên kết này.');
    }
    return data;
  }

  public async getLanternNight(): Promise<LanternNightResponse> {
    const res = await fetch('/api/lantern-night');
    if (!res.ok) {
      throw new Error('Không thể tải lịch Đêm Hoa Đăng.');
    }
    return res.json();
  }

  public async trackHealthyMetric(eventType: HealthyMetricEventType, valueMs?: number): Promise<void> {
    try {
      const raw = localStorage.getItem('heali_preferences_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { analyticsOptOut?: boolean };
        if (parsed.analyticsOptOut) return;
      }
    } catch {
      // ignore storage access issues
    }
    try {
      await fetch('/api/metrics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeof valueMs === 'number' ? { eventType, valueMs } : { eventType }),
      });
    } catch {
      // non-fatal metric ping
    }
  }

  public async submitBetaFeedback(
    note: string,
    category: 'general' | 'copy' | 'safety' | 'accessibility' = 'general'
  ): Promise<void> {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, category }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể gửi góp ý lúc này.');
    }
  }

  // Stage 4: Guarded AI Companion, Quarterly Anonymized Report & Partner Inquiries
  public async getAiCompanionStatus(): Promise<AiCompanionStatus> {
    const res = await fetch('/api/companion/status', {
      headers: this.getHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể kiểm tra trạng thái trợ lý phản chiếu.');
    }
    return data;
  }

  public async reflectWithCompanion(payload: {
    message: string;
    consentAccepted: boolean;
    language: 'vi' | 'en';
    history: Array<{ role: 'user' | 'model'; text: string }>;
  }): Promise<AiReflectResponse> {
    const res = await fetch('/api/companion/reflect', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể phản chiếu lúc này.');
    }
    return data;
  }

  public async getQuarterlyReport(): Promise<QuarterlyReportResponse> {
    const res = await fetch('/api/community/quarterly-report');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể tải báo cáo quý.');
    }
    return data;
  }

  public async submitPartnerInquiry(
    payload: PartnerInquiryPayload
  ): Promise<{ submitted: boolean; id: string; privacyGuarantee: string }> {
    const res = await fetch('/api/partners/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Không thể gửi đề xuất hợp tác lúc này.');
    }
    return data;
  }
}

export const api = new HealiApiClient();
