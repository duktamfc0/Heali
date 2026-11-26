import { useState, useEffect, useCallback } from 'react';

export type OnboardingNeed = 'release' | 'calm' | 'together' | 'quiet';

export interface DifficultDate {
  id: string;
  label: string;
  monthDay: string; // YYYY-MM-DD or MM-DD
  notifyInApp: boolean;
  note?: string;
}

export interface AppPreferences {
  theme: 'light' | 'dark';
  lowMotion: boolean;
  language: 'vi' | 'en';
  onboardingDone: boolean;
  onboardingNeed: OnboardingNeed | null;
  difficultDates: DifficultDate[];
  analyticsOptOut: boolean;
  completedChallengeNights: number[];
  lighterFeedbackAnsweredAt: string | null;
  aiCompanionEnabled: boolean;
  aiConsentAccepted: boolean;
  preferOpenLicenseMusicOnly: boolean;
}

const PREFS_KEY = 'heali_preferences_v1';

function detectSystemReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function loadPreferences(): AppPreferences {
  const defaultPrefs: AppPreferences = {
    theme: 'light',
    lowMotion: detectSystemReducedMotion(),
    language: 'vi',
    onboardingDone: true,
    onboardingNeed: null,
    difficultDates: [],
    analyticsOptOut: false,
    completedChallengeNights: [],
    lighterFeedbackAnsweredAt: null,
    aiCompanionEnabled: true,
    aiConsentAccepted: false,
    preferOpenLicenseMusicOnly: false,
  };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      lowMotion: typeof parsed.lowMotion === 'boolean' ? parsed.lowMotion : defaultPrefs.lowMotion,
      language: parsed.language === 'en' ? 'en' : 'vi',
      onboardingDone: typeof parsed.onboardingDone === 'boolean' ? parsed.onboardingDone : true,
      onboardingNeed: parsed.onboardingNeed ?? null,
      difficultDates: Array.isArray(parsed.difficultDates) ? parsed.difficultDates : [],
      analyticsOptOut: Boolean(parsed.analyticsOptOut),
      completedChallengeNights: Array.isArray(parsed.completedChallengeNights)
        ? parsed.completedChallengeNights.filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 7)
        : [],
      lighterFeedbackAnsweredAt:
        typeof parsed.lighterFeedbackAnsweredAt === 'string' ? parsed.lighterFeedbackAnsweredAt : null,
      aiCompanionEnabled:
        typeof parsed.aiCompanionEnabled === 'boolean' ? parsed.aiCompanionEnabled : true,
      aiConsentAccepted: Boolean(parsed.aiConsentAccepted),
      preferOpenLicenseMusicOnly: Boolean(parsed.preferOpenLicenseMusicOnly),
    };
  } catch {
    return defaultPrefs;
  }
}

export function useAppPreferences() {
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadPreferences());

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore quota errors
    }

    const root = document.documentElement;
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (prefs.lowMotion) {
      root.classList.add('heali-low-motion');
    } else {
      root.classList.remove('heali-low-motion');
    }

    root.lang = prefs.language;
  }, [prefs]);

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const toggleLowMotion = useCallback(() => {
    setPrefs((prev) => ({ ...prev, lowMotion: !prev.lowMotion }));
  }, []);

  const setLanguage = useCallback((language: 'vi' | 'en') => {
    setPrefs((prev) => ({ ...prev, language }));
  }, []);

  const toggleAnalyticsOptOut = useCallback(() => {
    setPrefs((prev) => ({ ...prev, analyticsOptOut: !prev.analyticsOptOut }));
  }, []);

  const toggleAiCompanion = useCallback((forceState?: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      aiCompanionEnabled: typeof forceState === 'boolean' ? forceState : !prev.aiCompanionEnabled,
    }));
  }, []);

  const setAiConsentAccepted = useCallback((accepted: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      aiConsentAccepted: accepted,
      aiCompanionEnabled: accepted ? prev.aiCompanionEnabled : false,
    }));
  }, []);

  const togglePreferOpenLicenseMusicOnly = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      preferOpenLicenseMusicOnly: !prev.preferOpenLicenseMusicOnly,
    }));
  }, []);

  const toggleChallengeNight = useCallback((nightNumber: number) => {
    if (nightNumber < 1 || nightNumber > 7) return;
    setPrefs((prev) => {
      const exists = prev.completedChallengeNights.includes(nightNumber);
      const next = exists
        ? prev.completedChallengeNights.filter((n) => n !== nightNumber)
        : [...prev.completedChallengeNights, nightNumber].sort((a, b) => a - b);
      return { ...prev, completedChallengeNights: next };
    });
  }, []);

  const markLighterFeedbackAnswered = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      lighterFeedbackAnsweredAt: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  const completeOnboarding = useCallback((need: OnboardingNeed | null) => {
    setPrefs((prev) => ({
      ...prev,
      onboardingDone: true,
      onboardingNeed: need,
    }));
  }, []);

  const reopenOnboarding = useCallback(() => {
    setPrefs((prev) => ({ ...prev, onboardingDone: false }));
  }, []);

  const addDifficultDate = useCallback((item: Omit<DifficultDate, 'id'>) => {
    setPrefs((prev) => ({
      ...prev,
      difficultDates: [
        { ...item, id: `dd-${Date.now()}` },
        ...prev.difficultDates.slice(0, 11),
      ],
    }));
  }, []);

  const toggleDifficultDateNotify = useCallback((id: string) => {
    setPrefs((prev) => ({
      ...prev,
      difficultDates: prev.difficultDates.map((d) =>
        d.id === id ? { ...d, notifyInApp: !d.notifyInApp } : d
      ),
    }));
  }, []);

  const removeDifficultDate = useCallback((id: string) => {
    setPrefs((prev) => ({
      ...prev,
      difficultDates: prev.difficultDates.filter((d) => d.id !== id),
    }));
  }, []);

  return {
    prefs,
    toggleTheme,
    toggleLowMotion,
    setLanguage,
    toggleAnalyticsOptOut,
    toggleAiCompanion,
    setAiConsentAccepted,
    togglePreferOpenLicenseMusicOnly,
    toggleChallengeNight,
    markLighterFeedbackAnswered,
    completeOnboarding,
    reopenOnboarding,
    addDifficultDate,
    toggleDifficultDateNotify,
    removeDifficultDate,
  };
}
