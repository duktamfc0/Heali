import React, { useState } from 'react';
import { ShieldCheck, Leaf, ArrowRight, ArrowLeft, Lock, HeartHandshake } from 'lucide-react';
import { getCopy, type SupportedLanguage } from '../i18n';
import type { OnboardingNeed } from '../hooks/useAppPreferences';

interface OnboardingFlowProps {
  language?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  onComplete: (need: OnboardingNeed | null) => void;
  onOpenHelpline: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  language = 'vi',
  onChangeLanguage,
  onComplete,
  onOpenHelpline,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedNeed, setSelectedNeed] = useState<OnboardingNeed | null>(null);
  const copy = getCopy(language);
  const isEn = language === 'en';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#f4f4ed]/96 dark:bg-[#131a15]/96 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#faf7ef] dark:bg-[#1b241d] border border-[#dedcd0] dark:border-[#324236] shadow-xl p-6 sm:p-8 text-[#273829] dark:text-[#edf2e8] space-y-6 my-auto">
        {/* Top bar inside onboarding: Crisis always 1-tap + Skip */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#e5e2d5] dark:border-[#2e3d31]">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#46613e] dark:text-[#7aa370]" />
            <span className="text-lg font-bold font-serif-healing">heali.</span>
            <span className="text-xs text-[#576c59] dark:text-[#b0c0b2] tabular-nums">
              · {isEn ? `Step ${step}/3` : `Bước ${step}/3`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onChangeLanguage && (
              <button
                type="button"
                onClick={() => onChangeLanguage(isEn ? 'vi' : 'en')}
                className="min-h-[44px] px-2.5 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-xs font-bold"
              >
                {isEn ? 'VI' : 'EN'}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenHelpline}
              className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-[#9b3d2b] hover:bg-[#823020] text-white text-base font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{copy.crisisButtonLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => onComplete(selectedNeed)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium text-[#576c59] dark:text-[#b0c0b2] hover:text-[#273829] dark:hover:text-[#edf2e8] hover:bg-[#eef2e8] dark:hover:bg-[#232f26] transition whitespace-nowrap"
            >
              {copy.onboarding.skipLabel}
            </button>
          </div>
        </div>

        {/* Step 1: Welcome & 3 Promises */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h1
                id="onboarding-title"
                className="text-2xl sm:text-3xl font-bold font-serif-healing text-[#243627] dark:text-[#edf2e8]"
              >
                {copy.onboarding.step1Title}
              </h1>
              <p className="text-base text-[#3c4f3e] dark:text-[#cbd6cc] leading-relaxed">
                {copy.onboarding.step1Subtitle}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] space-y-3">
              <div className="text-sm font-semibold text-[#46613e] dark:text-[#8eb984]">
                {isEn ? 'Three honest promises' : 'Ba lời hứa với bạn'}
              </div>
              <ul className="space-y-2.5 text-base text-[#273829] dark:text-[#edf2e8]">
                {copy.promises.map((promise, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {promise}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-[#576c59] dark:text-[#b0c0b2] leading-relaxed">
              {copy.betaNotice}
            </p>
          </div>
        )}

        {/* Step 2: Today's Need */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h1
                id="onboarding-title"
                className="text-2xl sm:text-3xl font-bold font-serif-healing text-[#243627] dark:text-[#edf2e8]"
              >
                {copy.onboarding.step2Title}
              </h1>
              <p className="text-base text-[#3c4f3e] dark:text-[#cbd6cc] leading-relaxed">
                {copy.onboarding.step2Subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {copy.onboarding.needs.map((need) => {
                const active = selectedNeed === need.id;
                return (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => setSelectedNeed(need.id)}
                    className={`min-h-[88px] p-4 rounded-2xl border text-left transition ${
                      active
                        ? 'bg-[#e6efe2] dark:bg-[#2a3b2d] border-[#46613e] dark:border-[#7aa370] shadow-sm'
                        : 'bg-[#f1efe5] dark:bg-[#232f26] border-[#dcdad0] dark:border-[#324236] hover:border-[#9eb198]'
                    }`}
                  >
                    <div className="text-base font-bold text-[#243627] dark:text-[#edf2e8]">
                      {need.title}
                    </div>
                    <p className="text-sm text-[#4e624f] dark:text-[#b0c0b2] mt-1 leading-relaxed">
                      {need.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Crisis & Privacy Introduction */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h1
                id="onboarding-title"
                className="text-2xl sm:text-3xl font-bold font-serif-healing text-[#243627] dark:text-[#edf2e8]"
              >
                {copy.onboarding.step3Title}
              </h1>
            </div>

            <div className="space-y-3">
              {copy.onboarding.step3Bullets.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] flex items-start gap-3"
                >
                  {idx === 0 ? (
                    <HeartHandshake className="w-5 h-5 text-[#9b3d2b] shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-5 h-5 text-[#46613e] dark:text-[#7aa370] shrink-0 mt-0.5" />
                  )}
                  <p className="text-base text-[#273829] dark:text-[#edf2e8] leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#e5e2d5] dark:border-[#2e3d31]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f1efe5] dark:bg-[#232f26] border border-[#dcdad0] dark:border-[#324236] text-sm font-semibold text-[#273829] dark:text-[#edf2e8] inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back' : 'Quay lại'}</span>
            </button>
          ) : (
            <div className="text-xs text-[#576c59] dark:text-[#b0c0b2]">
              {isEn ? 'No email or phone number required' : 'Không yêu cầu email hay số điện thoại'}
            </div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-base font-semibold inline-flex items-center gap-2 transition"
            >
              <span>{copy.onboarding.nextLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(selectedNeed)}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-base font-semibold inline-flex items-center gap-2 transition"
            >
              <span>{copy.onboarding.finishLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
