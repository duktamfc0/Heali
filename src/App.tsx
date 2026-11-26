import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import type { User } from './services/api';
import { api } from './services/api';
import { useAppPreferences, type OnboardingNeed } from './hooks/useAppPreferences';
import { PersonalJourneyDashboard } from './components/PersonalJourneyDashboard';
import { FloatLanternModal } from './components/FloatLanternModal';
import { ConfessionsFeed } from './components/ConfessionsFeed';
import { JournalView } from './components/JournalView';
import { UnsentLettersView } from './components/UnsentLettersView';
import { WishTreeView } from './components/WishTreeView';
import { StrangerChatView } from './components/StrangerChatView';
import { SpiritualRoomView } from './components/SpiritualRoomView';
import { CalmTabView } from './components/CalmTabView';
import { ExploreLake2DView } from './components/ExploreLake2DView';
import { PrivacyAndSafetyView } from './components/PrivacyAndSafetyView';
import { DifficultDatesCard } from './components/DifficultDatesCard';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ExUrgeFlowModal } from './components/ExUrgeFlowModal';
import { AudioPlayerDrawer } from './components/AudioPlayerDrawer';
import { HelplineModal } from './components/HelplineModal';
import { ProfileModal } from './components/ProfileModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SevenNightsGentleCard } from './components/SevenNightsGentleCard';
import { SendLanternGiftModal } from './components/SendLanternGiftModal';
import { DailyReflectionCardModal } from './components/DailyReflectionCardModal';
import { LandingPageView } from './components/LandingPageView';
import { SharedLanternGiftView } from './components/SharedLanternGiftView';
import { LanternNightView } from './components/LanternNightView';
import { AiCompanionCard } from './components/AiCompanionCard';
import { QuarterlyReportModal } from './components/QuarterlyReportModal';
import { AllFeaturesHubModal } from './components/AllFeaturesHubModal';
import { DynamicWeatherOverlay, type WeatherMode } from './components/world/DynamicWeatherOverlay';
import type { RoomActionId, RoomLocationId, VietnameseRegionId } from './components/world/r3f/roomTypes';
import { getCopy, UI_CHROME } from './i18n';
import {
  Leaf,
  Wind,
  Users,
  Compass,
  ShieldCheck,
  Settings,
  BookOpen,
  Mail,
  TreeDeciduous,
  Heart,
  Clock,
  Moon,
  Sparkles,
  Waves,
  ArrowLeft,
  Info,
  CalendarHeart,
  X,
  List,
  Gamepad2,
  LayoutGrid,
} from 'lucide-react';

// Lazy-load heavy Three.js / R3F 3D Sanctuary so first load stays fast and light
const Sanctuary3DWorld = lazy(() =>
  import('./components/Sanctuary3DWorld').then((m) => ({ default: m.Sanctuary3DWorld }))
);

// Lazy-load internal moderation portal isolated on /admin
const ModerationAdminPortal = lazy(() =>
  import('./components/ModerationAdminPortal').then((m) => ({ default: m.ModerationAdminPortal }))
);

type NavGroup = 'self' | 'calm' | 'community' | 'explore';
type SelfSubTab = 'overview' | 'journal' | 'letters' | 'wishes';
type CalmSubTool = 'breathe' | 'grounding' | 'compassion' | 'reframe' | 'audio';
type CommunitySubTab = 'confessions' | 'stranger_chat';
type ExploreSubTab = 'lake_2d' | '3d_world' | 'spiritual_room' | 'privacy';

function getTodayMonthDay(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

export default function App() {
  const {
    prefs,
    toggleTheme,
    toggleLowMotion,
    setLanguage,
    toggleAnalyticsOptOut,
    toggleAiCompanion,
    setAiConsentAccepted,
    toggleChallengeNight,
    markLighterFeedbackAnswered,
    completeOnboarding,
    reopenOnboarding,
    addDifficultDate,
    toggleDifficultDateNotify,
    removeDifficultDate,
  } = useAppPreferences();

  const copy = getCopy(prefs.language);
  const chrome = UI_CHROME[prefs.language];

  // Game-First 3D Rooms Mode (default) vs Classic Reading Mode
  const [appViewMode, setAppViewMode] = useState<'3d_game' | 'classic'>('3d_game');
  const [current3DRoom, setCurrent3DRoom] = useState<RoomLocationId>('outdoor');
  const [requestedRoom, setRequestedRoom] = useState<{ room: RoomLocationId; seq: number } | null>(null);
  const [requestedRegion, setRequestedRegion] = useState<{ region: VietnameseRegionId; seq: number } | null>(null);
  const [activeRoomDrawer, setActiveRoomDrawer] = useState<RoomActionId | null>(null);
  const [isAllFeaturesOpen, setIsAllFeaturesOpen] = useState(false);

  // 4-group Navigation Architecture (Classic Mode)
  const [activeGroup, setActiveGroup] = useState<NavGroup>('self');
  const [selfSub, setSelfSub] = useState<SelfSubTab>('overview');
  const [calmTool, setCalmTool] = useState<CalmSubTool>('breathe');
  const [communitySub, setCommunitySub] = useState<CommunitySubTab>('confessions');
  const [exploreSub, setExploreSub] = useState<ExploreSubTab>('lake_2d');
  const [overviewToolTab, setOverviewToolTab] = useState<'nights' | 'dates' | 'ai'>('nights');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [letterPrefill, setLetterPrefill] = useState<string | null>(null);
  const [dismissedDateNoticeIds, setDismissedDateNoticeIds] = useState<string[]>([]);

  // Modals
  const [isFloatModalOpen, setIsFloatModalOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExUrgeOpen, setIsExUrgeOpen] = useState(false);
  const [isSendGiftModalOpen, setIsSendGiftModalOpen] = useState(false);
  const [isDailyCardModalOpen, setIsDailyCardModalOpen] = useState(false);
  const [isQuarterlyModalOpen, setIsQuarterlyModalOpen] = useState(false);
  const [quarterlyModalTab, setQuarterlyModalTab] = useState<'report' | 'partner'>('report');

  // Privacy-first session timing for first useful action (never leaves browser unless metric allowed)
  const sessionStartRef = React.useRef<number>(Date.now());
  const firstUsefulRecordedRef = React.useRef<boolean>(false);

  const markFirstUsefulAction = React.useCallback(() => {
    if (firstUsefulRecordedRef.current) return;
    firstUsefulRecordedRef.current = true;
    const elapsed = Math.max(0, Date.now() - sessionStartRef.current);
    void api.trackHealthyMetric('first_useful_action', elapsed);
  }, []);

  // Weather overlay state (when viewing 2D lake or 3D world inside Explore)
  const [weatherMode, setWeatherMode] = useState<WeatherMode>(() => {
    try {
      const saved = localStorage.getItem('heali_lake_weather');
      if (saved === 'petals' || saved === 'rain' || saved === 'fireflies' || saved === 'mist' || saved === 'clear') {
        return saved;
      }
    } catch {
      // Ignore storage read errors
    }
    return 'petals';
  });
  const [isInsideCottage, setIsInsideCottage] = useState(false);
  const [isAudioBarVisible, setIsAudioBarVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem('heali_audio_bar_visible') !== 'false';
    } catch {
      return true;
    }
  });

  const updateAudioBarVisible = React.useCallback((next: boolean) => {
    setIsAudioBarVisible(next);
    try {
      localStorage.setItem('heali_audio_bar_visible', next ? 'true' : 'false');
    } catch {
      // Ignore storage write errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('heali_lake_weather', weatherMode);
    } catch {
      // Ignore storage write errors
    }
  }, [weatherMode]);

  useEffect(() => {
    api.initSession().then(setCurrentUser).catch(console.error);
  }, []);

  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const navigatePath = React.useCallback((nextPath: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const syncPath = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  useEffect(() => {
    const openHelpline = () => setIsHelplineOpen(true);
    const openExUrge = () => setIsExUrgeOpen(true);
    const openBreathing = () => {
      markFirstUsefulAction();
      if (appViewMode === '3d_game') {
        setRequestedRoom((prev) => ({ room: 'calm', seq: (prev?.seq ?? 0) + 1 }));
        setActiveRoomDrawer('open_calm_breathe');
      } else {
        setActiveGroup('calm');
        setCalmTool('breathe');
      }
    };
    window.addEventListener('heali:open-helpline', openHelpline);
    window.addEventListener('heali:open-ex-urge', openExUrge);
    window.addEventListener('heali:open-breathing', openBreathing);
    return () => {
      window.removeEventListener('heali:open-helpline', openHelpline);
      window.removeEventListener('heali:open-ex-urge', openExUrge);
      window.removeEventListener('heali:open-breathing', openBreathing);
    };
  }, [markFirstUsefulAction, appViewMode]);

  useEffect(() => {
    if (!activeRoomDrawer) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveRoomDrawer(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeRoomDrawer]);

  const isAdminRoute = pathname.startsWith('/admin');
  const isLandingRoute = pathname.startsWith('/gioi-thieu');
  const isLanternNightRoute = pathname.startsWith('/dem-hoa-dang');
  const sharedGiftMatch = pathname.match(/^\/den\/(dn_[a-f0-9]+)/i);
  const sharedGiftToken = sharedGiftMatch ? sharedGiftMatch[1] : null;

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#f4f5ee] dark:bg-[#131914] text-sm text-[#455a47] dark:text-[#a6b7a8]">
            Đang mở cổng điều phối an toàn nội bộ...
          </div>
        }
      >
        <ModerationAdminPortal onExitAdmin={() => navigatePath('/')} />
      </Suspense>
    );
  }

  if (sharedGiftToken) {
    return (
      <>
        <SharedLanternGiftView
          token={sharedGiftToken}
          lowMotion={prefs.lowMotion}
          onEnterApp={() => navigatePath('/')}
          onOpenLanding={() => navigatePath('/gioi-thieu')}
          onOpenHelpline={() => setIsHelplineOpen(true)}
        />
        <HelplineModal isOpen={isHelplineOpen} onClose={() => setIsHelplineOpen(false)} />
      </>
    );
  }

  if (isLanternNightRoute) {
    return (
      <>
        <LanternNightView
          isPublicRoute
          lowMotion={prefs.lowMotion}
          onEnterApp={() => navigatePath('/')}
          onOpenLanding={() => navigatePath('/gioi-thieu')}
          onOpenFloatModal={() => setIsFloatModalOpen(true)}
          onOpenSendGift={() => setIsSendGiftModalOpen(true)}
          onOpenHelpline={() => setIsHelplineOpen(true)}
        />
        <FloatLanternModal
          isOpen={isFloatModalOpen}
          onClose={() => setIsFloatModalOpen(false)}
          onLanternFloated={() => {}}
        />
        <SendLanternGiftModal
          isOpen={isSendGiftModalOpen}
          onClose={() => setIsSendGiftModalOpen(false)}
          defaultAlias={currentUser?.nickname || ''}
          onOpenPreviewLink={(token) => navigatePath(`/den/${token}`)}
        />
        <HelplineModal isOpen={isHelplineOpen} onClose={() => setIsHelplineOpen(false)} />
      </>
    );
  }

  if (isLandingRoute) {
    return (
      <>
        <LandingPageView
          language={prefs.language}
          lowMotion={prefs.lowMotion}
          onChangeLanguage={setLanguage}
          onEnterApp={() => navigatePath('/')}
          onOpenLanternNight={() => navigatePath('/dem-hoa-dang')}
          onOpenSendGift={() => setIsSendGiftModalOpen(true)}
          onOpenDailyCard={() => setIsDailyCardModalOpen(true)}
          onOpenHelpline={() => setIsHelplineOpen(true)}
          onOpenQuarterlyReport={() => {
            setQuarterlyModalTab('report');
            setIsQuarterlyModalOpen(true);
          }}
          onOpenPartnerInquiry={() => {
            setQuarterlyModalTab('partner');
            setIsQuarterlyModalOpen(true);
          }}
        />
        <SendLanternGiftModal
          isOpen={isSendGiftModalOpen}
          onClose={() => setIsSendGiftModalOpen(false)}
          defaultAlias={currentUser?.nickname || ''}
          onOpenPreviewLink={(token) => navigatePath(`/den/${token}`)}
        />
        <DailyReflectionCardModal
          isOpen={isDailyCardModalOpen}
          onClose={() => setIsDailyCardModalOpen(false)}
        />
        <QuarterlyReportModal
          isOpen={isQuarterlyModalOpen}
          onClose={() => setIsQuarterlyModalOpen(false)}
          language={prefs.language}
          initialTab={quarterlyModalTab}
        />
        <HelplineModal isOpen={isHelplineOpen} onClose={() => setIsHelplineOpen(false)} />
      </>
    );
  }

  // Subtle midnight gentleness check (00:00 - 04:59)
  const isLateNight = useMemo(() => {
    const h = new Date().getHours();
    return h >= 0 && h < 5;
  }, []);

  // Check if any user-saved difficult date matches today's MM-DD & has notifyInApp = true
  const activeDifficultDateToday = useMemo(() => {
    const todayMd = getTodayMonthDay();
    return prefs.difficultDates.find((d) => {
      const md = d.monthDay.length === 10 ? d.monthDay.slice(5) : d.monthDay;
      return d.notifyInApp && md === todayMd && !dismissedDateNoticeIds.includes(d.id);
    });
  }, [prefs.difficultDates, dismissedDateNoticeIds]);

  const enter3DRoom = React.useCallback((room: RoomLocationId) => {
    setAppViewMode('3d_game');
    setActiveRoomDrawer(null);
    setCurrent3DRoom(room);
    setRequestedRoom((prev) => ({ room, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const teleport3DRegion = React.useCallback((region: VietnameseRegionId) => {
    setAppViewMode('3d_game');
    setActiveRoomDrawer(null);
    setCurrent3DRoom('outdoor');
    setRequestedRegion((prev) => ({ region, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const handleTriggerRoomAction = React.useCallback(
    (action: RoomActionId) => {
      markFirstUsefulAction();
      if (action === 'open_float_lantern') {
        setIsFloatModalOpen(true);
        return;
      }
      if (action === 'open_send_gift') {
        setIsSendGiftModalOpen(true);
        return;
      }
      if (action === 'open_daily_card') {
        setIsDailyCardModalOpen(true);
        return;
      }
      if (action === 'open_ex_urge') {
        setIsExUrgeOpen(true);
        return;
      }
      if (action === 'open_quarterly_report') {
        setQuarterlyModalTab('report');
        setIsQuarterlyModalOpen(true);
        return;
      }
      setActiveRoomDrawer(action);
    },
    [markFirstUsefulAction]
  );

  const handleOnboardingFinish = (need: OnboardingNeed | null) => {
    completeOnboarding(need);
    if (need === 'release') {
      enter3DRoom('journal');
    } else if (need === 'calm') {
      enter3DRoom('calm');
    } else if (need === 'together') {
      enter3DRoom('community');
    } else if (need === 'quiet') {
      enter3DRoom('lake');
    }
  };

  const handleMoveExUrgeToLetter = (draftText: string) => {
    setLetterPrefill(draftText);
    if (appViewMode === '3d_game') {
      enter3DRoom('letters');
      setActiveRoomDrawer('open_letters');
    } else {
      setActiveGroup('self');
      setSelfSub('letters');
    }
  };

  const handle3DZoneSelect = (
    zone:
      | 'lake'
      | 'community'
      | 'journal'
      | 'letters'
      | 'wishes'
      | 'rain_room'
      | 'stranger_chat'
      | 'spiritual_room'
  ) => {
    if (zone === 'lake') {
      setIsFloatModalOpen(true);
    } else if (zone === 'journal') {
      setActiveGroup('self');
      setSelfSub('journal');
    } else if (zone === 'letters') {
      setActiveGroup('self');
      setSelfSub('letters');
    } else if (zone === 'wishes') {
      setActiveGroup('self');
      setSelfSub('wishes');
    } else if (zone === 'rain_room') {
      setActiveGroup('calm');
      setCalmTool('audio');
    } else if (zone === 'community') {
      setActiveGroup('community');
      setCommunitySub('confessions');
    } else if (zone === 'stranger_chat') {
      setActiveGroup('community');
      setCommunitySub('stranger_chat');
    } else if (zone === 'spiritual_room') {
      setActiveGroup('explore');
      setExploreSub('spiritual_room');
    }
  };

  const gameRoomNavItems: Array<{ id: RoomLocationId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'outdoor', label: 'Thung lũng', icon: Compass },
    { id: 'journal', label: 'Nhật ký', icon: BookOpen },
    { id: 'letters', label: 'Thư chưa gửi', icon: Mail },
    { id: 'wishes', label: 'Ước nguyện', icon: TreeDeciduous },
    { id: 'calm', label: 'Phòng mưa', icon: Wind },
    { id: 'community', label: 'Trà thất', icon: Users },
    { id: 'spiritual_room', label: 'Tâm linh', icon: Sparkles },
    { id: 'lake', label: 'Hồ hoa đăng', icon: Waves },
  ];

  const primaryGroups = [
    { id: 'self' as const, label: copy.navGroups.self, icon: Heart },
    { id: 'calm' as const, label: copy.navGroups.calm, icon: Wind },
    { id: 'community' as const, label: copy.navGroups.community, icon: Users },
    { id: 'explore' as const, label: copy.navGroups.explore, icon: Compass },
  ];

  // Dynamic highlight card copy when onboardingNeed is set (shows 1-2 starting suggestions without hiding anything)
  const onboardingRecommendation = useMemo(() => {
    switch (prefs.onboardingNeed) {
      case 'release':
        return {
          title: 'Bắt đầu với việc viết ra cho nhẹ lòng',
          desc: 'Bạn chọn muốn "Xả ra". Bạn có thể ghi vài dòng nhật ký có hướng dẫn hoặc viết một lá thư chưa gửi.',
          primaryLabel: 'Mở Nhật ký',
          onPrimary: () => setSelfSub('journal'),
          secondaryLabel: 'Viết Thư chưa gửi',
          onSecondary: () => setSelfSub('letters'),
        };
      case 'calm':
        return {
          title: 'Chậm lại vài phút cho cơ thể và hơi thở',
          desc: 'Bạn chọn muốn "Dịu lại". Hãy thử 1–3 phút thở 4-7-8 hoặc bài tập Neo cảm giác 5-4-3-2-1.',
          primaryLabel: 'Qua góc Dịu lại',
          onPrimary: () => {
            setActiveGroup('calm');
            setCalmTool('breathe');
          },
          secondaryLabel: 'Mở Âm thanh êm',
          onSecondary: () => {
            setActiveGroup('calm');
            setCalmTool('audio');
          },
        };
      case 'together':
        return {
          title: 'Lắng nghe và hiện diện cùng người khác',
          desc: 'Bạn chọn muốn "Có ai đó bên cạnh". Bạn có thể đọc Vườn tâm tình hoặc ghé Hồ hoa đăng.',
          primaryLabel: 'Vào Cùng người khác',
          onPrimary: () => {
            setActiveGroup('community');
            setCommunitySub('confessions');
          },
          secondaryLabel: 'Ghé Hồ hoa đăng',
          onSecondary: () => {
            setActiveGroup('explore');
            setExploreSub('lake_2d');
          },
        };
      case 'quiet':
        return {
          title: 'Một góc yên lặng không cần nói gì',
          desc: 'Bạn chọn "Chỉ muốn yên lặng". Hãy nghe tiếng mưa và gió nhẹ hoặc ngồi ngắm mặt hồ.',
          primaryLabel: 'Nghe âm thanh yên tĩnh',
          onPrimary: () => {
            setActiveGroup('calm');
            setCalmTool('audio');
          },
          secondaryLabel: 'Ngắm Hồ hoa đăng',
          onSecondary: () => {
            setActiveGroup('explore');
            setExploreSub('lake_2d');
          },
        };
      default:
        return null;
    }
  }, [prefs.onboardingNeed]);

  return (
    <div className="min-h-screen bg-[#f4f4ed] dark:bg-[#141a15] text-[#273829] dark:text-[#edf2e8] flex flex-col selection:bg-[#d8e5d3] selection:text-[#273829]">
      <OfflineIndicator />

      {((appViewMode === '3d_game' && current3DRoom === 'outdoor') ||
        (appViewMode === 'classic' &&
          activeGroup === 'explore' &&
          (exploreSub === 'lake_2d' || exploreSub === '3d_world'))) && (
        <DynamicWeatherOverlay
          mode={weatherMode}
          dimmed={isInsideCottage}
          lowMotion={prefs.lowMotion}
        />
      )}

      {/* Clean Top Header */}
      <header className="sticky top-0 z-40 bg-[#fafaf4]/96 dark:bg-[#182019]/96 border-b border-[#e2e6da] dark:border-[#2c3a2e] px-3 sm:px-5 py-2 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          {/* Left: Brand */}
          <button
            type="button"
            onClick={() => {
              if (appViewMode === '3d_game') {
                enter3DRoom('outdoor');
              } else {
                setActiveGroup('self');
                setSelfSub('overview');
              }
            }}
            className="flex items-center gap-2 cursor-pointer group whitespace-nowrap shrink-0 min-h-[42px]"
          >
            <Leaf className="w-5 h-5 text-[#496946] dark:text-[#8eb984]" strokeWidth={1.9} />
            <span className="text-2xl font-bold tracking-tight text-[#273829] dark:text-[#edf2e8] font-serif-healing leading-none">
              heali<span className="text-[#496946] dark:text-[#8eb984]">.</span>
            </span>
          </button>

          {/* Center: 3D Game Rooms Switcher OR Classic 4-Group Navigation */}
          {appViewMode === '3d_game' ? (
            <nav
              className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5"
              aria-label="Không gian phòng 3D"
            >
              {gameRoomNavItems.map((room) => {
                const Icon = room.icon;
                const isCurrent = current3DRoom === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => enter3DRoom(room.id)}
                    className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition ${
                      isCurrent
                        ? 'bg-[#46613e] text-white font-semibold shadow-sm'
                        : 'text-[#526754] dark:text-[#a6b7a8] hover:bg-[#ecebe0] dark:hover:bg-[#233025] hover:text-[#273829] dark:hover:text-[#edf2e8] font-medium'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{room.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-6" aria-label="Điều hướng chính">
              {primaryGroups.map((group) => {
                const isCurrent = activeGroup === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroup(group.id)}
                    className={`min-h-[42px] py-2 text-sm whitespace-nowrap shrink-0 transition border-b-2 ${
                      isCurrent
                        ? 'border-[#46613e] dark:border-[#8eb984] text-[#273829] dark:text-[#edf2e8] font-semibold'
                        : 'border-transparent text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8] font-medium'
                    }`}
                  >
                    {group.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right: All Features Hub + 3D/Reading Switch + Language VI/EN + 1-tap Crisis Button + Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAllFeaturesOpen(true)}
              className="inline-flex min-h-[40px] px-2.5 items-center justify-center gap-1.5 rounded-xl bg-[#e7eee2] dark:bg-[#233226] border border-[#b8c8b2] dark:border-[#3c5441] text-xs font-semibold text-[#273829] dark:text-[#edf2e8] hover:border-[#46613e] transition whitespace-nowrap"
              title="Mở toàn bộ 24 chức năng & 4 vùng miền 3D Việt Nam"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#46613e] dark:text-[#8eb984]" />
              <span className="hidden md:inline">Tất cả chức năng</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setAppViewMode((prev) => (prev === '3d_game' ? 'classic' : '3d_game'))
              }
              className="inline-flex min-h-[40px] px-2.5 items-center justify-center gap-1.5 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-semibold text-[#273829] dark:text-[#edf2e8] hover:border-[#46613e] transition whitespace-nowrap"
              title={appViewMode === '3d_game' ? 'Chuyển sang dạng thẻ đọc gọn' : 'Quay lại không gian game 3D'}
            >
              {appViewMode === '3d_game' ? (
                <>
                  <List className="w-3.5 h-3.5 text-[#46613e] dark:text-[#8eb984]" />
                  <span className="hidden xl:inline">Đọc gọn</span>
                </>
              ) : (
                <>
                  <Gamepad2 className="w-3.5 h-3.5 text-[#46613e] dark:text-[#8eb984]" />
                  <span className="hidden sm:inline">Vào 3D</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLanguage(prefs.language === 'vi' ? 'en' : 'vi')}
              className="hidden sm:inline-flex min-h-[40px] px-2.5 items-center justify-center rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-xs font-bold text-[#273829] dark:text-[#edf2e8] hover:border-[#46613e] transition"
              title="Chuyển ngôn ngữ Tiếng Việt / English"
              aria-label="Switch language VI / EN"
            >
              {prefs.language === 'vi' ? 'VI' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => setIsHelplineOpen(true)}
              className="min-h-[44px] px-3 sm:px-3.5 rounded-2xl bg-[#9b3d2b] hover:bg-[#823020] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
              aria-label="Cần giúp ngay — Mở số điện thoại hỗ trợ và gửi tin cho người thân"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>{copy.crisisButtonLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#4c5e4e] dark:text-[#b0c0b2] hover:text-[#273829] dark:hover:text-[#edf2e8] hover:bg-[#eef2e8] dark:hover:bg-[#243227] transition"
              title={`Hồ sơ & Cài đặt (${currentUser?.nickname || 'Bạn Lữ Hành'})`}
              aria-label="Mở hồ sơ, giao diện tối, mã PIN và quyền riêng tư"
            >
              <Settings className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {/* ==================== GAME-FIRST FULL-VIEWPORT 3D SANCTUARY ==================== */}
      {appViewMode === '3d_game' ? (
        <main
          className={`flex-1 w-full max-w-7xl mx-auto p-2 sm:p-3 ${
            isAudioBarVisible ? 'pb-[136px] lg:pb-[74px]' : 'pb-[68px] lg:pb-3'
          }`}
        >
          <Suspense
            fallback={
              <div
                className={`${
                  isAudioBarVisible
                    ? 'h-[calc(100vh-204px)] lg:h-[calc(100vh-148px)] min-h-[410px]'
                    : 'h-[calc(100vh-138px)] lg:h-[calc(100vh-84px)] min-h-[480px]'
                } rounded-3xl bg-[#e9eee5] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] flex flex-col items-center justify-center p-10 text-center space-y-2`}
              >
                <p className="text-base font-semibold font-serif-healing">
                  Đang mở không gian 3D Heali...
                </p>
                <p className="text-sm text-[#576c59] dark:text-[#b0c0b2]">
                  Thung lũng và các phòng bình yên đang sẵn sàng đón bạn.
                </p>
              </div>
            }
          >
            <Sanctuary3DWorld
              weatherMode={weatherMode}
              onChangeWeatherMode={setWeatherMode}
              requestedRoom={requestedRoom}
              requestedRegion={requestedRegion}
              fullViewport
              isAudioBarVisible={isAudioBarVisible}
              isDrawerOpen={
                Boolean(activeRoomDrawer) ||
                isAllFeaturesOpen ||
                isFloatModalOpen ||
                isSendGiftModalOpen ||
                isDailyCardModalOpen ||
                isQuarterlyModalOpen ||
                isHelplineOpen ||
                isProfileOpen ||
                isExUrgeOpen
              }
              onLocationChange={setCurrent3DRoom}
              onInteriorChange={setIsInsideCottage}
              onOpenFloatModal={() => setIsFloatModalOpen(true)}
              onOpenAllFeatures={() => setIsAllFeaturesOpen(true)}
              onTriggerRoomAction={handleTriggerRoomAction}
              onSelectZone={handle3DZoneSelect}
            />
          </Suspense>
        </main>
      ) : (
        /* ==================== CLASSIC ACCESSIBLE CARD VIEW ==================== */
        <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 pb-36 lg:pb-28 space-y-6">
          {/* ================= GROUP 1: CHO RIÊNG MÌNH ================= */}
          {activeGroup === 'self' && (
          <div className="space-y-6 animate-fade-in">
            {/* Segmented Sub-nav inside "Cho riêng mình" */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Công cụ cho riêng mình"
                className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#ecebe0] dark:bg-[#1f2921] border border-[#dcdad0] dark:border-[#324236]"
              >
                {[
                  { id: 'overview' as const, label: chrome.selfSubTabs.overview, icon: Heart },
                  { id: 'journal' as const, label: chrome.selfSubTabs.journal, icon: BookOpen },
                  { id: 'letters' as const, label: chrome.selfSubTabs.letters, icon: Mail },
                  { id: 'wishes' as const, label: chrome.selfSubTabs.wishes, icon: TreeDeciduous },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = selfSub === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelfSub(item.id)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                        active
                          ? 'bg-[#faf7ef] dark:bg-[#2a382d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                          : 'text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsExUrgeOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#c9c5b4] dark:border-[#3e4f42] text-sm font-semibold text-[#5b412c] dark:text-[#e6c9ad] hover:border-[#9b7a5e] inline-flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <Clock className="w-4 h-4" />
                <span>{copy.exUrge.buttonLabel}</span>
              </button>
            </div>

            {selfSub === 'overview' && (
              <div className="space-y-6">
                {/* Active Difficult Date gentle in-app notice (only if opted in) */}
                {activeDifficultDateToday && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-[#f7efe6] dark:bg-[#2b241d] border border-[#dec7ad] dark:border-[#5e4c3a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-[#4f3922] dark:text-[#eed5ba]">
                        Hôm nay là ngày bạn đánh dấu: {activeDifficultDateToday.label}
                      </div>
                      <p className="text-sm text-[#614a32] dark:text-[#d6bfa7]">
                        Nếu hôm nay lòng thấy chùng xuống hoặc nhớ lại chuyện cũ, cứ cho phép mình đi chậm lại một nhịp. Không cần cố tỏ ra ổn.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGroup('calm');
                          setCalmTool('breathe');
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] text-white text-sm font-semibold whitespace-nowrap"
                      >
                        Thở 1 phút
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDismissedDateNoticeIds((prev) => [...prev, activeDifficultDateToday.id])
                        }
                        className="min-h-[44px] px-3 py-2 rounded-xl text-sm text-[#614a32] dark:text-[#d6bfa7]"
                      >
                        Ẩn
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtle Midnight Calm Note */}
                {isLateNight && (
                  <div className="p-4 rounded-2xl bg-[#eef3ea] dark:bg-[#202a22] border border-[#c8d8c2] dark:border-[#394b3d] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-sm text-[#354c38] dark:text-[#cfe3c9]">
                      <Moon className="w-4 h-4 shrink-0" />
                      <span>
                        Khuya rồi. Nếu đầu óc đang quay cuồng chuyện cũ, bạn có thể viết ra cho nhẹ hoặc nghe 2 phút tiếng mưa rồi nghỉ.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveGroup('calm');
                        setCalmTool('audio');
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#46613e] text-white text-xs font-semibold"
                    >
                      Nghe tiếng mưa
                    </button>
                  </div>
                )}

                {/* Onboarding starting highlight (suggests 1-2 gentle starting actions without hiding anything) */}
                {onboardingRecommendation && (
                  <div className="p-5 rounded-3xl bg-[#edf3e9] dark:bg-[#1e2920] border border-[#c5d6bf] dark:border-[#374a3a] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-[#243627] dark:text-[#edf2e8]">
                        {onboardingRecommendation.title}
                      </h2>
                      <p className="text-sm text-[#4e624f] dark:text-[#b0c0b2]">
                        {onboardingRecommendation.desc}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={onboardingRecommendation.onPrimary}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-sm font-semibold transition"
                      >
                        {onboardingRecommendation.primaryLabel}
                      </button>
                      <button
                        type="button"
                        onClick={onboardingRecommendation.onSecondary}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#faf7ef] dark:bg-[#172019] border border-[#c3d3bd] dark:border-[#394b3d] text-[#273829] dark:text-[#edf2e8] text-sm font-semibold transition"
                      >
                        {onboardingRecommendation.secondaryLabel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Personal Check-in & Emotion Wheel */}
                <PersonalJourneyDashboard
                  lowMotion={prefs.lowMotion}
                  onOpenJournal={() => {
                    markFirstUsefulAction();
                    setSelfSub('journal');
                  }}
                  onOpenWishes={() => {
                    markFirstUsefulAction();
                    setSelfSub('wishes');
                  }}
                  onOpenCalm={() => {
                    markFirstUsefulAction();
                    setActiveGroup('calm');
                    setCalmTool('breathe');
                  }}
                  onOpenDailyCard={() => {
                    markFirstUsefulAction();
                    setIsDailyCardModalOpen(true);
                  }}
                  onOpenSendGift={() => {
                    markFirstUsefulAction();
                    setIsSendGiftModalOpen(true);
                  }}
                  lighterFeedbackAnsweredToday={
                    prefs.lighterFeedbackAnsweredAt === new Date().toISOString().slice(0, 10)
                  }
                  onAnswerLighterFeedback={markLighterFeedbackAnswered}
                />

                {/* Clean 3-Tab Companion Drawer (declutters stacked text boxes) */}
                <div className="space-y-4">
                  <div
                    role="tablist"
                    aria-label="Công cụ đồng hành thêm"
                    className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none p-1.5 rounded-2xl bg-[#ecebe0] dark:bg-[#1f2921] border border-[#dcdad0] dark:border-[#324236]"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={overviewToolTab === 'nights'}
                      onClick={() => setOverviewToolTab('nights')}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                        overviewToolTab === 'nights'
                          ? 'bg-[#faf7ef] dark:bg-[#2a382d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                          : 'text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>7 đêm tử tế ({prefs.completedChallengeNights.length}/7)</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={overviewToolTab === 'dates'}
                      onClick={() => setOverviewToolTab('dates')}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                        overviewToolTab === 'dates'
                          ? 'bg-[#faf7ef] dark:bg-[#2a382d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                          : 'text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                      }`}
                    >
                      <CalendarHeart className="w-4 h-4" />
                      <span>Ngày dễ chùng lòng ({prefs.difficultDates.length})</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={overviewToolTab === 'ai'}
                      onClick={() => setOverviewToolTab('ai')}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                        overviewToolTab === 'ai'
                          ? 'bg-[#faf7ef] dark:bg-[#2a382d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                          : 'text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Gương AI tùy chọn</span>
                    </button>
                  </div>

                  {overviewToolTab === 'nights' && (
                    <SevenNightsGentleCard
                      completedNights={prefs.completedChallengeNights}
                      onToggleNight={toggleChallengeNight}
                      onOpenAction={(target) => {
                        markFirstUsefulAction();
                        if (target === 'breathe') {
                          setActiveGroup('calm');
                          setCalmTool('breathe');
                        } else if (target === 'grounding') {
                          setActiveGroup('calm');
                          setCalmTool('grounding');
                        } else if (target === 'audio') {
                          setActiveGroup('calm');
                          setCalmTool('audio');
                        } else if (target === 'journal') {
                          setSelfSub('journal');
                        } else if (target === 'letters') {
                          setSelfSub('letters');
                        } else if (target === 'helpline') {
                          setIsHelplineOpen(true);
                        }
                      }}
                    />
                  )}

                  {overviewToolTab === 'dates' && (
                    <DifficultDatesCard
                      dates={prefs.difficultDates}
                      onAddDate={addDifficultDate}
                      onToggleNotify={toggleDifficultDateNotify}
                      onRemoveDate={removeDifficultDate}
                      onOpenHelpline={() => setIsHelplineOpen(true)}
                    />
                  )}

                  {overviewToolTab === 'ai' && (
                    <AiCompanionCard
                      language={prefs.language}
                      enabled={prefs.aiCompanionEnabled}
                      consentAccepted={prefs.aiConsentAccepted}
                      onToggleEnabled={toggleAiCompanion}
                      onAcceptConsent={setAiConsentAccepted}
                      onOpenHelpline={() => setIsHelplineOpen(true)}
                      onOpenBreathing={() => {
                        setActiveGroup('calm');
                        setCalmTool('breathe');
                      }}
                      onOpenJournal={() => setSelfSub('journal')}
                    />
                  )}
                </div>
              </div>
            )}

            {selfSub === 'journal' && (
              <JournalView
                lowMotion={prefs.lowMotion}
                onOpenBreathing={() => window.dispatchEvent(new CustomEvent('heali:open-breathing'))}
                onOpenCalmGrounding={() => {
                  setActiveGroup('calm');
                  setCalmTool('grounding');
                }}
              />
            )}

            {selfSub === 'letters' && (
              <UnsentLettersView
                lowMotion={prefs.lowMotion}
                prefillContent={letterPrefill}
                onClearPrefill={() => setLetterPrefill(null)}
              />
            )}

            {selfSub === 'wishes' && <WishTreeView lowMotion={prefs.lowMotion} />}
          </div>
        )}

        {/* ================= GROUP 2: DỊU LẠI ================= */}
        {activeGroup === 'calm' && (
          <div className="animate-fade-in">
            <CalmTabView
              initialTool={calmTool}
              lowMotion={prefs.lowMotion}
              onOpenExUrgeModal={() => setIsExUrgeOpen(true)}
            />
          </div>
        )}

        {/* ================= GROUP 3: CÙNG NGƯỜI KHÁC ================= */}
        {activeGroup === 'community' && (
          <div className="space-y-6 animate-fade-in">
            {/* Closed-beta notice & Sub-navigation */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f1efe5] dark:bg-[#202a22] border border-[#dcdad0] dark:border-[#324236] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-sm text-[#4e624f] dark:text-[#b0c0b2]">
                <Info className="w-4 h-4 text-[#46613e] dark:text-[#98c18e] shrink-0 mt-0.5" />
                <span>{copy.betaNotice}</span>
              </div>
              <div
                role="tablist"
                aria-label="Không gian cộng đồng"
                className="flex items-center gap-1.5 p-1 rounded-xl bg-[#e7e5d9] dark:bg-[#172019] shrink-0"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={communitySub === 'confessions'}
                  onClick={() => setCommunitySub('confessions')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                    communitySub === 'confessions'
                      ? 'bg-[#faf7ef] dark:bg-[#2a382d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                      : 'text-[#576c59] dark:text-[#a6b7a8]'
                  }`}
                >
                  {chrome.communitySubTabs.confessions}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={communitySub === 'stranger_chat'}
                  onClick={() => setCommunitySub('stranger_chat')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                    communitySub === 'stranger_chat'
                      ? 'bg-[#faf7ef] dark:bg-[#2a382d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                      : 'text-[#576c59] dark:text-[#a6b7a8]'
                  }`}
                >
                  {chrome.communitySubTabs.stranger_chat}
                </button>
              </div>
            </div>

            {communitySub === 'confessions' && <ConfessionsFeed lowMotion={prefs.lowMotion} />}
            {communitySub === 'stranger_chat' && <StrangerChatView lowMotion={prefs.lowMotion} />}
          </div>
        )}

        {/* ================= GROUP 4: KHÁM PHÁ ================= */}
        {activeGroup === 'explore' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                role="tablist"
                aria-label="Không gian khám phá"
                className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#ecebe0] dark:bg-[#1f2921] border border-[#dcdad0] dark:border-[#324236]"
              >
                {[
                  { id: 'lake_2d' as const, label: chrome.exploreSubTabs.lake_2d, icon: Waves },
                  { id: '3d_world' as const, label: chrome.exploreSubTabs['3d_world'], icon: Compass },
                  { id: 'spiritual_room' as const, label: chrome.exploreSubTabs.spiritual_room, icon: Sparkles },
                  { id: 'privacy' as const, label: chrome.exploreSubTabs.privacy, icon: ShieldCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = exploreSub === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setExploreSub(item.id)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                        active
                          ? 'bg-[#faf7ef] dark:bg-[#2a382d] text-[#243627] dark:text-[#edf2e8] shadow-sm'
                          : 'text-[#576c59] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {exploreSub === '3d_world' && (
                <button
                  type="button"
                  onClick={() => setExploreSub('lake_2d')}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#222d25] border border-[#dcdad0] dark:border-[#324236] text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{chrome.backTo2d}</span>
                </button>
              )}
            </div>

            {exploreSub === 'lake_2d' && (
              <ExploreLake2DView
                lowMotion={prefs.lowMotion}
                onOpenFloatModal={() => {
                  markFirstUsefulAction();
                  setIsFloatModalOpen(true);
                }}
                onOpen3DWorld={() => {
                  markFirstUsefulAction();
                  setExploreSub('3d_world');
                }}
                onOpenSpiritualRoom={() => {
                  markFirstUsefulAction();
                  setExploreSub('spiritual_room');
                }}
                onOpenPrivacy={() => setExploreSub('privacy')}
                onOpenSendGift={() => {
                  markFirstUsefulAction();
                  setIsSendGiftModalOpen(true);
                }}
                onOpenLanternNight={() => navigatePath('/dem-hoa-dang')}
              />
            )}

            {exploreSub === '3d_world' && (
              <Suspense
                fallback={
                  <div className="rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] p-10 text-center space-y-2">
                    <p className="text-base font-semibold font-serif-healing">
                      Đang mở Khu vườn 3D...
                    </p>
                    <p className="text-sm text-[#576c59] dark:text-[#b0c0b2]">
                      Chỉ tải khi bạn chọn mở để tiết kiệm pin và dung lượng mạng.
                    </p>
                  </div>
                }
              >
                <Sanctuary3DWorld
                  weatherMode={weatherMode}
                  onChangeWeatherMode={setWeatherMode}
                  requestedRoom={requestedRoom}
                  requestedRegion={requestedRegion}
                  isAudioBarVisible={isAudioBarVisible}
                  onInteriorChange={setIsInsideCottage}
                  onOpenFloatModal={() => setIsFloatModalOpen(true)}
                  onOpenAllFeatures={() => setIsAllFeaturesOpen(true)}
                  onTriggerRoomAction={handleTriggerRoomAction}
                  onSelectZone={handle3DZoneSelect}
                />
              </Suspense>
            )}

            {exploreSub === 'spiritual_room' && <SpiritualRoomView lowMotion={prefs.lowMotion} />}

            {exploreSub === 'privacy' && (
              <PrivacyAndSafetyView
                theme={prefs.theme}
                lowMotion={prefs.lowMotion}
                analyticsOptOut={prefs.analyticsOptOut}
                language={prefs.language}
                aiCompanionEnabled={prefs.aiCompanionEnabled}
                onToggleTheme={toggleTheme}
                onToggleLowMotion={toggleLowMotion}
                onToggleAnalyticsOptOut={toggleAnalyticsOptOut}
                onChangeLanguage={setLanguage}
                onToggleAiCompanion={() => toggleAiCompanion()}
                onOpenQuarterlyReport={() => {
                  setQuarterlyModalTab('report');
                  setIsQuarterlyModalOpen(true);
                }}
                onOpenPartnerInquiry={() => {
                  setQuarterlyModalTab('partner');
                  setIsQuarterlyModalOpen(true);
                }}
                onOpenProfileModal={() => setIsProfileOpen(true)}
                onOpenHelplineModal={() => setIsHelplineOpen(true)}
                onReopenOnboarding={reopenOnboarding}
              />
            )}
          </div>
        )}

        {/* Quiet Public Info Footer inside Classic View */}
        <footer className="pt-4 border-t border-[#e2e5d9] dark:border-[#2a382c] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5e7260] dark:text-[#a6b7a8]">
          <span>{copy.realWorldBridge.disclaimer}</span>
          <div className="flex flex-wrap items-center gap-4 font-medium">
            <button type="button" onClick={() => navigatePath('/gioi-thieu')} className="hover:underline">
              {chrome.landingFooterLink}
            </button>
            <button type="button" onClick={() => navigatePath('/dem-hoa-dang')} className="hover:underline">
              {chrome.lanternNightLink}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuarterlyModalTab('report');
                setIsQuarterlyModalOpen(true);
              }}
              className="hover:underline"
            >
              {chrome.quarterlyReportBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveGroup('explore');
                setExploreSub('privacy');
              }}
              className="hover:underline"
            >
              {chrome.privacyLink}
            </button>
          </div>
        </footer>
      </main>
      )}

      {/* Interactive 3D Room Prop Feature Drawer Overlay */}
      {activeRoomDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#121c14]/65"
          onClick={() => setActiveRoomDrawer(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl bg-[#faf7ef] dark:bg-[#19211b] border border-[#dcdad0] dark:border-[#324236] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 border-b border-[#e4e2d6] dark:border-[#2c3a2f] bg-[#f4f2ea] dark:bg-[#1f2921]">
              <div className="flex flex-wrap items-center gap-2">
                {activeRoomDrawer === 'open_journal' || activeRoomDrawer === 'open_mood_checkin' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveRoomDrawer('open_journal')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        activeRoomDrawer === 'open_journal'
                          ? 'bg-[#46613e] text-white'
                          : 'bg-white/80 dark:bg-[#2a382d] text-[#3d5240] dark:text-[#c7d7c9]'
                      }`}
                    >
                      Sổ Nhật Ký
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRoomDrawer('open_mood_checkin')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        activeRoomDrawer === 'open_mood_checkin'
                          ? 'bg-[#46613e] text-white'
                          : 'bg-white/80 dark:bg-[#2a382d] text-[#3d5240] dark:text-[#c7d7c9]'
                      }`}
                    >
                      Tinh Thể Tâm Trạng
                    </button>
                  </>
                ) : activeRoomDrawer === 'open_confessions' || activeRoomDrawer === 'open_stranger_chat' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveRoomDrawer('open_confessions')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        activeRoomDrawer === 'open_confessions'
                          ? 'bg-[#46613e] text-white'
                          : 'bg-white/80 dark:bg-[#2a382d] text-[#3d5240] dark:text-[#c7d7c9]'
                      }`}
                    >
                      Tâm Tình Ẩn Danh
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRoomDrawer('open_stranger_chat')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        activeRoomDrawer === 'open_stranger_chat'
                          ? 'bg-[#46613e] text-white'
                          : 'bg-white/80 dark:bg-[#2a382d] text-[#3d5240] dark:text-[#c7d7c9]'
                      }`}
                    >
                      Bàn Trà Gặp Gỡ 1:1
                    </button>
                  </>
                ) : activeRoomDrawer.startsWith('open_calm_') ? (
                  <>
                    {[
                      { id: 'open_calm_breathe' as const, label: 'Thở 4-7-8' },
                      { id: 'open_calm_grounding' as const, label: 'Neo 5-4-3-2-1' },
                      { id: 'open_calm_audio' as const, label: 'Âm thanh' },
                      { id: 'open_calm_compassion' as const, label: 'Tự thương' },
                      { id: 'open_calm_reframe' as const, label: 'Góc nhìn mới' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveRoomDrawer(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          activeRoomDrawer === tab.id
                            ? 'bg-[#46613e] text-white'
                            : 'bg-white/80 dark:bg-[#2a382d] text-[#3d5240] dark:text-[#c7d7c9]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <span className="text-sm font-bold font-serif-healing text-[#273829] dark:text-[#edf2e8]">
                    {activeRoomDrawer === 'open_letters'
                      ? 'Bưu Điện Ký Ức · Thư chưa gửi'
                      : activeRoomDrawer === 'open_wishes'
                        ? 'Cây Ước Nguyện & Ý Niệm Lành'
                        : activeRoomDrawer === 'open_seven_nights'
                          ? '7 Đêm Tử Tế Cùng Heali'
                          : activeRoomDrawer === 'open_difficult_dates'
                            ? 'Những Ngày Dễ Chùng Lòng'
                            : activeRoomDrawer === 'open_ai_mirror'
                              ? 'Gương AI Đồng Cảm'
                              : activeRoomDrawer === 'open_lake_2d'
                                ? 'Hồ Hoa Đăng (Bản 2D Tiết Kiệm Pin)'
                                : activeRoomDrawer === 'open_privacy'
                                  ? 'Quyền Riêng Tư & An Toàn'
                                  : 'Phòng Tâm Linh Heali'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveRoomDrawer(null)}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e7e5da] dark:bg-[#2a372d] hover:bg-[#dad8cb] text-xs font-semibold text-[#273829] dark:text-[#edf2e8] transition"
              >
                <X className="w-4 h-4" />
                <span>Về phòng 3D</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {activeRoomDrawer === 'open_journal' && (
                <JournalView
                  lowMotion={prefs.lowMotion}
                  embeddedIn3DRoom
                  onOpenBreathing={() => {
                    enter3DRoom('calm');
                    setActiveRoomDrawer('open_calm_breathe');
                  }}
                  onOpenCalmGrounding={() => {
                    enter3DRoom('calm');
                    setActiveRoomDrawer('open_calm_grounding');
                  }}
                />
              )}

              {activeRoomDrawer === 'open_mood_checkin' && (
                <PersonalJourneyDashboard
                  lowMotion={prefs.lowMotion}
                  embeddedIn3DRoom
                  onOpenJournal={() => {
                    enter3DRoom('journal');
                    setActiveRoomDrawer('open_journal');
                  }}
                  onOpenWishes={() => {
                    enter3DRoom('wishes');
                    setActiveRoomDrawer('open_wishes');
                  }}
                  onOpenCalm={() => {
                    enter3DRoom('calm');
                    setActiveRoomDrawer('open_calm_breathe');
                  }}
                  onOpenDailyCard={() => {
                    setActiveRoomDrawer(null);
                    setIsDailyCardModalOpen(true);
                  }}
                  onOpenSendGift={() => {
                    setActiveRoomDrawer(null);
                    setIsSendGiftModalOpen(true);
                  }}
                  lighterFeedbackAnsweredToday={
                    prefs.lighterFeedbackAnsweredAt === new Date().toISOString().slice(0, 10)
                  }
                  onAnswerLighterFeedback={markLighterFeedbackAnswered}
                />
              )}

              {activeRoomDrawer === 'open_letters' && (
                <UnsentLettersView
                  lowMotion={prefs.lowMotion}
                  embeddedIn3DRoom
                  prefillContent={letterPrefill}
                  onClearPrefill={() => setLetterPrefill(null)}
                />
              )}

              {activeRoomDrawer === 'open_wishes' && (
                <WishTreeView lowMotion={prefs.lowMotion} embeddedIn3DRoom />
              )}

              {(activeRoomDrawer === 'open_calm_breathe' ||
                activeRoomDrawer === 'open_calm_audio' ||
                activeRoomDrawer === 'open_calm_grounding' ||
                activeRoomDrawer === 'open_calm_compassion' ||
                activeRoomDrawer === 'open_calm_reframe') && (
                <CalmTabView
                  initialTool={
                    activeRoomDrawer === 'open_calm_audio'
                      ? 'audio'
                      : activeRoomDrawer === 'open_calm_grounding'
                        ? 'grounding'
                        : activeRoomDrawer === 'open_calm_compassion'
                          ? 'compassion'
                          : activeRoomDrawer === 'open_calm_reframe'
                            ? 'reframe'
                            : 'breathe'
                  }
                  lowMotion={prefs.lowMotion}
                  embeddedIn3DRoom
                  onOpenExUrgeModal={() => {
                    setActiveRoomDrawer(null);
                    setIsExUrgeOpen(true);
                  }}
                />
              )}

              {activeRoomDrawer === 'open_confessions' && (
                <ConfessionsFeed lowMotion={prefs.lowMotion} embeddedIn3DRoom />
              )}

              {activeRoomDrawer === 'open_stranger_chat' && (
                <StrangerChatView lowMotion={prefs.lowMotion} embeddedIn3DRoom />
              )}

              {(activeRoomDrawer === 'open_spiritual_tarot' ||
                activeRoomDrawer === 'open_spiritual_tuvi' ||
                activeRoomDrawer === 'open_spiritual_chairs') && (
                <SpiritualRoomView
                  lowMotion={prefs.lowMotion}
                  embeddedIn3DRoom
                  initialSubTab={
                    activeRoomDrawer === 'open_spiritual_tuvi'
                      ? 'tuvi'
                      : activeRoomDrawer === 'open_spiritual_chairs'
                        ? 'chairs'
                        : 'tarot'
                  }
                />
              )}

              {activeRoomDrawer === 'open_seven_nights' && (
                <SevenNightsGentleCard
                  completedNights={prefs.completedChallengeNights}
                  onToggleNight={toggleChallengeNight}
                  onOpenAction={(target) => {
                    markFirstUsefulAction();
                    if (target === 'breathe') {
                      setActiveRoomDrawer('open_calm_breathe');
                    } else if (target === 'grounding') {
                      setActiveRoomDrawer('open_calm_grounding');
                    } else if (target === 'audio') {
                      setActiveRoomDrawer('open_calm_audio');
                    } else if (target === 'journal') {
                      setActiveRoomDrawer('open_journal');
                    } else if (target === 'letters') {
                      setActiveRoomDrawer('open_letters');
                    } else if (target === 'helpline') {
                      setActiveRoomDrawer(null);
                      setIsHelplineOpen(true);
                    }
                  }}
                />
              )}

              {activeRoomDrawer === 'open_difficult_dates' && (
                <DifficultDatesCard
                  dates={prefs.difficultDates}
                  onAddDate={addDifficultDate}
                  onToggleNotify={toggleDifficultDateNotify}
                  onRemoveDate={removeDifficultDate}
                  onOpenHelpline={() => {
                    setActiveRoomDrawer(null);
                    setIsHelplineOpen(true);
                  }}
                />
              )}

              {activeRoomDrawer === 'open_ai_mirror' && (
                <AiCompanionCard
                  language={prefs.language}
                  enabled={prefs.aiCompanionEnabled}
                  consentAccepted={prefs.aiConsentAccepted}
                  onToggleEnabled={toggleAiCompanion}
                  onAcceptConsent={setAiConsentAccepted}
                  onOpenHelpline={() => {
                    setActiveRoomDrawer(null);
                    setIsHelplineOpen(true);
                  }}
                  onOpenBreathing={() => setActiveRoomDrawer('open_calm_breathe')}
                  onOpenJournal={() => setActiveRoomDrawer('open_journal')}
                />
              )}

              {activeRoomDrawer === 'open_lake_2d' && (
                <ExploreLake2DView
                  lowMotion={prefs.lowMotion}
                  onOpenFloatModal={() => {
                    setActiveRoomDrawer(null);
                    setIsFloatModalOpen(true);
                  }}
                  onOpen3DWorld={() => {
                    setActiveRoomDrawer(null);
                    enter3DRoom('lake');
                  }}
                  onOpenSpiritualRoom={() => setActiveRoomDrawer('open_spiritual_tarot')}
                  onOpenPrivacy={() => setActiveRoomDrawer('open_privacy')}
                  onOpenSendGift={() => {
                    setActiveRoomDrawer(null);
                    setIsSendGiftModalOpen(true);
                  }}
                  onOpenLanternNight={() => {
                    setActiveRoomDrawer(null);
                    navigatePath('/dem-hoa-dang');
                  }}
                />
              )}

              {activeRoomDrawer === 'open_privacy' && (
                <PrivacyAndSafetyView
                  theme={prefs.theme}
                  lowMotion={prefs.lowMotion}
                  analyticsOptOut={prefs.analyticsOptOut}
                  language={prefs.language}
                  aiCompanionEnabled={prefs.aiCompanionEnabled}
                  onToggleTheme={toggleTheme}
                  onToggleLowMotion={toggleLowMotion}
                  onToggleAnalyticsOptOut={toggleAnalyticsOptOut}
                  onChangeLanguage={setLanguage}
                  onToggleAiCompanion={() => toggleAiCompanion()}
                  onOpenQuarterlyReport={() => {
                    setActiveRoomDrawer(null);
                    setQuarterlyModalTab('report');
                    setIsQuarterlyModalOpen(true);
                  }}
                  onOpenPartnerInquiry={() => {
                    setActiveRoomDrawer(null);
                    setQuarterlyModalTab('partner');
                    setIsQuarterlyModalOpen(true);
                  }}
                  onOpenProfileModal={() => {
                    setActiveRoomDrawer(null);
                    setIsProfileOpen(true);
                  }}
                  onOpenHelplineModal={() => {
                    setActiveRoomDrawer(null);
                    setIsHelplineOpen(true);
                  }}
                  onReopenOnboarding={() => {
                    setActiveRoomDrawer(null);
                    reopenOnboarding();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile / Tablet Bottom Navigation (3D Room Dock in 3D Mode, 4-Group Nav in Classic Mode) */}
      <nav
        aria-label="Điều hướng di động"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#fafaf4]/96 dark:bg-[#182019]/96 border-t border-[#dfe3d6] dark:border-[#2c3a2e] py-1.5 px-2 pb-safe"
      >
        {appViewMode === '3d_game' ? (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {gameRoomNavItems.map((room) => {
              const Icon = room.icon;
              const isCurrent = current3DRoom === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => enter3DRoom(room.id)}
                  className={`min-h-[46px] min-w-[72px] flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition shrink-0 ${
                    isCurrent
                      ? 'text-white font-semibold bg-[#46613e]'
                      : 'text-[#6c7d6d] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] tracking-tight whitespace-nowrap">
                    {room.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            {primaryGroups.map((group) => {
              const Icon = group.icon;
              const isCurrent = activeGroup === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition ${
                    isCurrent
                      ? 'text-[#46613e] dark:text-[#98c18e] font-semibold bg-[#e6efe2]/70 dark:bg-[#243227]'
                      : 'text-[#6c7d6d] dark:text-[#a6b7a8] hover:text-[#273829] dark:hover:text-[#edf2e8]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] tracking-tight whitespace-nowrap truncate max-w-full">
                    {group.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Floating Audio & Breathing Bar */}
      <AudioPlayerDrawer
        isVisible={isAudioBarVisible}
        onDismiss={() => updateAudioBarVisible(false)}
        onRestore={() => updateAudioBarVisible(true)}
      />

      {/* 3-Step Skippable Onboarding */}
      {!prefs.onboardingDone && (
        <OnboardingFlow
          language={prefs.language}
          onChangeLanguage={setLanguage}
          onComplete={handleOnboardingFinish}
          onOpenHelpline={() => setIsHelplineOpen(true)}
        />
      )}

      {/* Ex-Urge 10-Min Pause Modal */}
      <ExUrgeFlowModal
        isOpen={isExUrgeOpen}
        onClose={() => setIsExUrgeOpen(false)}
        onMoveToUnsentLetter={handleMoveExUrgeToLetter}
        onOpenBreathing={() => {
          setActiveGroup('calm');
          setCalmTool('breathe');
        }}
      />

      {/* Modals */}
      <FloatLanternModal
        isOpen={isFloatModalOpen}
        onClose={() => setIsFloatModalOpen(false)}
        onLanternFloated={() => {}}
      />

      <HelplineModal
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUserUpdated={setCurrentUser}
        theme={prefs.theme}
        lowMotion={prefs.lowMotion}
        language={prefs.language}
        isAudioBarVisible={isAudioBarVisible}
        onToggleTheme={toggleTheme}
        onToggleLowMotion={toggleLowMotion}
        onChangeLanguage={setLanguage}
        onToggleAudioBar={() => updateAudioBarVisible(!isAudioBarVisible)}
      />

      <SendLanternGiftModal
        isOpen={isSendGiftModalOpen}
        onClose={() => setIsSendGiftModalOpen(false)}
        defaultAlias={currentUser?.nickname || ''}
        onOpenPreviewLink={(token) => navigatePath(`/den/${token}`)}
      />

      <DailyReflectionCardModal
        isOpen={isDailyCardModalOpen}
        onClose={() => setIsDailyCardModalOpen(false)}
      />

      <QuarterlyReportModal
        isOpen={isQuarterlyModalOpen}
        onClose={() => setIsQuarterlyModalOpen(false)}
        language={prefs.language}
        initialTab={quarterlyModalTab}
      />

      <AllFeaturesHubModal
        isOpen={isAllFeaturesOpen}
        onClose={() => setIsAllFeaturesOpen(false)}
        onSelectRegion={teleport3DRegion}
        onSelectAction={handleTriggerRoomAction}
        onNavigateRoute={navigatePath}
        onOpenOnboarding={reopenOnboarding}
      />
    </div>
  );
}
