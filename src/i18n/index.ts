import { VI_COPY } from './vi';
import { EN_COPY } from './en';

export type SupportedLanguage = 'vi' | 'en';

export type HealiCopy = typeof VI_COPY | typeof EN_COPY;

export function getCopy(lang: SupportedLanguage): HealiCopy {
  return lang === 'en' ? EN_COPY : VI_COPY;
}

export const UI_CHROME = {
  vi: {
    selfSubTabs: {
      overview: 'Hôm nay',
      journal: 'Nhật ký',
      letters: 'Thư chưa gửi',
      wishes: 'Cây ước',
    },
    exploreSubTabs: {
      lake_2d: 'Hồ hoa đăng',
      '3d_world': 'Khu vườn 3D',
      spiritual_room: 'Phòng tâm linh',
      privacy: 'Quyền riêng tư & An toàn',
    },
    communitySubTabs: {
      confessions: 'Vườn tâm tình',
      stranger_chat: 'Góc gặp gỡ 1:1',
    },
    quarterlyReportBtn: 'Báo cáo cộng đồng theo quý',
    partnerInquiryBtn: 'Hợp tác tổ chức & Trường học',
    landingFooterLink: 'Giới thiệu & Góc hiểu mình',
    lanternNightLink: 'Đêm Hoa Đăng',
    privacyLink: 'Quyền riêng tư',
    languageLabel: 'Ngôn ngữ',
    backTo2d: 'Về góc 2D nhẹ hơn',
  },
  en: {
    selfSubTabs: {
      overview: 'Today',
      journal: 'Journal',
      letters: 'Unsent letters',
      wishes: 'Wish tree',
    },
    exploreSubTabs: {
      lake_2d: 'Lantern lake',
      '3d_world': '3D Garden',
      spiritual_room: 'Reflection room',
      privacy: 'Privacy & Safety',
    },
    communitySubTabs: {
      confessions: 'Confessions',
      stranger_chat: '1:1 Lounge',
    },
    quarterlyReportBtn: 'Quarterly Community Report',
    partnerInquiryBtn: 'Organizations & Schools',
    landingFooterLink: 'About & Self-Care Guides',
    lanternNightLink: 'Lantern Night',
    privacyLink: 'Privacy',
    languageLabel: 'Language',
    backTo2d: 'Back to lighter 2D view',
  },
} as const;
