export type RiskLevel = 0 | 1 | 2 | 3;

export interface RiskAssessment {
  level: RiskLevel;
  shouldShowSupport: boolean;
  shouldHoldPublicPost: boolean;
  reasonCategory: 'none' | 'distress' | 'passive_ideation' | 'explicit_intent';
}

const CHAR_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a'],
  [/[èéẹẻẽêềếệểễ]/g, 'e'],
  [/[ìíịỉĩ]/g, 'i'],
  [/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o'],
  [/[ùúụủũưừứựửữ]/g, 'u'],
  [/[ỳýỵỷỹ]/g, 'y'],
  [/đ/g, 'd'],
];

const TEENCODE_MAP: Record<string, string> = {
  ko: 'khong',
  k: 'khong',
  kh: 'khong',
  khg: 'khong',
  kg: 'khong',
  hok: 'khong',
  hem: 'khong',
  hong: 'khong',
  dc: 'duoc',
  dk: 'duoc',
  mk: 'minh',
  mik: 'minh',
  m: 'minh',
  t: 'toi',
  tao: 'toi',
  tui: 'toi',
  ng: 'nguoi',
  ngta: 'nguoi ta',
  mn: 'moi nguoi',
  mng: 'moi nguoi',
  j: 'gi',
  vs: 'voi',
  ntn: 'nhu the nao',
  chetmat: 'chet mat',
  muonchet: 'muon chet',
  tutu: 'tu tu',
  tuvans: 'tu van',
  tuvan: 'tu van',
  tu_tu: 'tu tu',
  ketlieu: 'ket lieu',
  bienmat: 'bien mat',
  chansong: 'chan song',
  kiet_suc: 'kiet suc',
};

/**
 * Normalize Vietnamese text (lowercase, strip accents, collapse repeated letters, expand common teencode).
 */
export function normalizeVietnameseText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let s = input.toLowerCase().trim();

  for (const [pattern, replacement] of CHAR_REPLACEMENTS) {
    s = s.replace(pattern, replacement);
  }

  // Replace punctuation with spaces (keep alphanumeric + spaces)
  s = s.replace(/[^a-z0-9\s]/g, ' ');

  // Collapse 3+ repeated characters (or 2+ for common elongated Vietnamese endings like "cheeeet", "khoooong", "buooon")
  s = s.replace(/([a-z])\1{2,}/g, '$1');
  // Handle common double-letter emphasis like "cheet", "buoon", "soong"
  s = s.replace(/\bche+t\b/g, 'chet');
  s = s.replace(/\bs+o+n+g+\b/g, 'song');

  const tokens = s
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => TEENCODE_MAP[tok] ?? tok);

  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

// Harmless everyday Vietnamese hyperbole / idioms containing "chết" or "muốn chết" playfully
const HARMLESS_IDIOM_PATTERNS: RegExp[] = [
  /\bcuoi chet( mat| di duoc| luon| mat thoi)?\b/,
  /\bbuon cuoi chet\b/,
  /\bbuon chet di duoc\b/,
  /\bmet chet( di duoc| mat| mat thoi| roi)?\b/,
  /\bdoi chet( di duoc| mat| mat thoi| roi)?\b/,
  /\bnong chet( di duoc| mat| roi)?\b/,
  /\blanh chet( di duoc| mat| roi)?\b/,
  /\bso chet khiep\b/,
  /\bso chet di duoc\b/,
  /\bngai chet( di duoc| mat)?\b/,
  /\bxau ho chet( di duoc| mat)?\b/,
  /\bchan chet di duoc\b/,
  /\bnang chet\b/,
  /\bkhiep chet\b/,
  /\bthuong chet( di duoc)?\b/,
  /\byeu chet( di duoc)?\b/,
  /\bthich chet( di duoc)?\b/,
  /\bdep chet( nguoi| mat)?\b/,
  /\bngon chet( di duoc| mat)?\b/,
  /\btiec chet( di duoc| mat)?\b/,
  /\bghet chet( di duoc| mat)?\b/,
  /\btuc chet( di duoc| mat)?\b/,
  /\bmat chet\b/,
  /\bche+t may( chua| roi)?\b/,
  /\bchet cha\b/,
  /\bchet tiet\b/,
  /\bchet do\b/,
  /\bchet toi\b/,
  /\bchet mat thoi\b/,
];

// Explicit negation / past-resolved context where user states they are NOT intending harm
const NEGATION_CONTEXT_PATTERNS: RegExp[] = [
  /\bkhong (co )?(y dinh|bao gio nghi den|muon) (chuyen |viec )?(tu tu|tu van|tu sat|lam hai ban than|chet)\b/,
  /\bchua bao gio (nghi den|muon) (chuyen |viec )?(tu tu|tu van|tu sat|chet)\b/,
  /\bkhong phai (muon|dinh) (chuyen |viec )?(tu tu|chet)\b/,
  /\bngay xua tung (muon chet|nghi quan) nhung (gio|bay gio) (on|khac) roi\b/,
  /\btruoc day tung (muon chet|tu tu) nhung gio (on|binh an|vuot qua)\b/,
];

// Level 3: Explicit intent, plan, preparation, or immediate timeframe
const LEVEL_3_PATTERNS: RegExp[] = [
  /\b(toi|dem|hom) nay (toi |minh |em |anh )?(se )?(tu tu|tu van|tu sat|ket lieu|ra di|nhay cau|nhay lau|cat co tay)\b/,
  /\b(da |dang )?(chuan bi|san sang|mua|cam) (thuoc ngu|thuoc sau|thuoc doc|dao lam|dao|day thung) de (chet|tu tu|ket lieu|ra di)\b/,
  /\b(dinh|se|sap|muon) (uong thuoc ngu|uong thuoc doc|nhay cau|nhay lau|treo co|that co|cat tay|cat co tay)\b/,
  /\b(thu tuyet menh|viet thu tuyet menh|de lai thu cuoi)\b/,
  /\bket lieu (cuoc doi|doi minh|ban than|su song)\b/,
  /\b(tu tu|tu van|tu sat) (ngay|ngay bay gio|dem nay|hom nay|thoi)\b/,
  /\btoi (quyet dinh|se) chet\b/,
  /\bminh (quyet dinh|se) chet\b/,
  /\b(lam sao|cach nao) de (tu tu|chet nhanh|khong dau)\b/,
];

// Level 2: Passive suicidal ideation / wish to cease existing / burden belief
const LEVEL_2_PATTERNS: RegExp[] = [
  /\bkhong (con )?muon song( nua| tiep)?\b/,
  /\bchan song\b/,
  /\bkhong (thay|con) ly do (gi )?(de )?song\b/,
  /\bsong lam gi nua\b/,
  /\bsong de lam gi\b/,
  /\b(toi |minh )?(chi )?muon bien mat\b/,
  /\bbien mat khoi (the gioi|cuoc doi|noi) nay\b/,
  /\buoc gi (bien mat|khong ton tai|ngay mai khong tinh day|ngu luon khong day)\b/,
  /\bchi muon ngu (mot giac )?(khong|ko) bao gio tinh day\b/,
  /\bmoi nguoi se (tot|on|hanh phuc|nhe nhang) hon neu khong co (toi|minh)\b/,
  /\bkhong co (toi|minh) (o day )?(thi )?tot hon\b/,
  /\btoi la ganh nang\b/,
  /\bminh la ganh nang\b/,
  /\btha chet( di)? cho xong\b/,
  /\bchet di cho (nhe|xong|do kho|bot dau)\b/,
  /\bmuon chet( qua| di duoc| mat| roi)?\b/,
  /\bnghi den (chuyen|viec) (tu tu|tu van|tu sat|chet)\b/,
  /\b(tu tu|tu van|tu sat|tu lam hai ban than|lam hai chinh minh)\b/,
  /\bra di vinh vien\b/,
  /\bkhong muon tinh day nua\b/,
];

// Level 1: High emotional distress, exhaustion, helplessness (without clear death ideation)
const LEVEL_1_PATTERNS: RegExp[] = [
  /\b(qua |rat |vo cung )?(tuyet vong|be tac)\b/,
  /\bkhong (the )?(chiu dung|chiu noi|chong do)( duoc)? nua\b/,
  /\b(kiet suc|guc nga|vo vun|nat vun|suy sup) (hoan toan|mat roi|roi)?\b/,
  /\btrong rong qua\b/,
  /\bkhong con ai (ben canh|hieu|can)\b/,
  /\bkhong con loi thoat\b/,
  /\bmet moi den muc khong muon lam gi\b/,
  /\bkhoc (ca dem|suot dem|khong ngung|khong dut)\b/,
  /\btim (nhoi|dau) khong tho noi\b/,
];

/**
 * Strip matched harmless idioms from normalized text so we can still evaluate the remaining sentence.
 * Example: "mệt chết đi được" -> removed, while "mệt chết đi được, tôi không muốn sống nữa" still catches level 2.
 */
function stripHarmlessIdioms(normalized: string): string {
  let cleaned = normalized;
  for (const pat of HARMLESS_IDIOM_PATTERNS) {
    cleaned = cleaned.replace(new RegExp(pat.source, 'g'), ' ');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function detectRisk(rawText: string): RiskAssessment {
  const normalized = normalizeVietnameseText(rawText);
  if (!normalized) {
    return {
      level: 0,
      shouldShowSupport: false,
      shouldHoldPublicPost: false,
      reasonCategory: 'none',
    };
  }

  // Strip benign hyperbole first so phrases like "cười chết mất" or "buồn chết đi được" do not false-positive
  const cleaned = stripHarmlessIdioms(normalized);
  if (!cleaned) {
    return {
      level: 0,
      shouldShowSupport: false,
      shouldHoldPublicPost: false,
      reasonCategory: 'none',
    };
  }

  // Check explicit negation context unless combined with active plan cues
  const hasNegationOnly = NEGATION_CONTEXT_PATTERNS.some((p) => p.test(cleaned));
  const hasLevel3 = LEVEL_3_PATTERNS.some((p) => p.test(cleaned));
  if (hasLevel3 && !hasNegationOnly) {
    return {
      level: 3,
      shouldShowSupport: true,
      shouldHoldPublicPost: true,
      reasonCategory: 'explicit_intent',
    };
  }

  const hasLevel2 = LEVEL_2_PATTERNS.some((p) => p.test(cleaned));
  if (hasLevel2 && !hasNegationOnly) {
    return {
      level: 2,
      shouldShowSupport: true,
      shouldHoldPublicPost: true,
      reasonCategory: 'passive_ideation',
    };
  }

  const hasLevel1 = LEVEL_1_PATTERNS.some((p) => p.test(cleaned));
  if (hasLevel1) {
    return {
      level: 1,
      shouldShowSupport: true,
      shouldHoldPublicPost: false,
      reasonCategory: 'distress',
    };
  }

  return {
    level: 0,
    shouldShowSupport: false,
    shouldHoldPublicPost: false,
    reasonCategory: 'none',
  };
}

const CONTACT_PATTERNS = {
  phone: /(?:\+?84|0)(?:[\s.\-_]*\d){8,10}\b/,
  url: /(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|vn|net|org|io|me|link|info)\b)/i,
  socialHandle: /(?:zalo|facebook|fb|instagram|ig|tele|telegram|tiktok|mess|messenger)\s*[:\-]?\s*[@a-z0-9_.]{3,}|@[a-z0-9_.]{3,}/i,
  moneyTransfer: /\b(?:chuyen\s*khoan|stk|so\s*tai\s*khoan|momo|zalopay|vnpay|vietcombank|techcombank|mb\s*bank|banking|nap\s*tien)\b/i,
};

export interface ContactLeakCheck {
  hasContactOrPayment: boolean;
  reasons: string[];
}

export function detectContactOrPaymentInChat(rawText: string): ContactLeakCheck {
  const normalized = normalizeVietnameseText(rawText);
  const reasons: string[] = [];

  if (CONTACT_PATTERNS.phone.test(rawText)) reasons.push('số điện thoại');
  if (CONTACT_PATTERNS.url.test(rawText)) reasons.push('đường liên kết');
  if (CONTACT_PATTERNS.socialHandle.test(rawText) || CONTACT_PATTERNS.socialHandle.test(normalized)) {
    reasons.push('tài khoản mạng xã hội');
  }
  if (CONTACT_PATTERNS.moneyTransfer.test(normalized)) {
    reasons.push('thông tin chuyển tiền');
  }

  return {
    hasContactOrPayment: reasons.length > 0,
    reasons,
  };
}
