/**
 * Local offline draft & difficult-date persistence for PWA resilience.
 * Drafts stay strictly on-device until the user saves/syncs them.
 */

const JOURNAL_DRAFT_KEY = 'heali_draft_journal_v1';
const LETTER_DRAFT_KEY = 'heali_draft_letter_v1';

export interface JournalDraft {
  title: string;
  content: string;
  moodScore: number;
  emotions: string[];
  gratitude: string;
  selfCareAction: string;
  updatedAt: string;
}

export interface LetterDraft {
  recipient: 'ex' | 'self' | 'family' | 'friend' | 'someone';
  recipientName: string;
  title: string;
  content: string;
  updatedAt: string;
}

export function saveJournalDraft(draft: Omit<JournalDraft, 'updatedAt'>): void {
  try {
    const hasContent =
      draft.title.trim().length > 0 ||
      draft.content.trim().length > 0 ||
      draft.gratitude.trim().length > 0 ||
      draft.selfCareAction.trim().length > 0;
    if (!hasContent) {
      localStorage.removeItem(JOURNAL_DRAFT_KEY);
      return;
    }
    localStorage.setItem(
      JOURNAL_DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
    );
  } catch {
    // ignore storage quota errors
  }
}

export function loadJournalDraft(): JournalDraft | null {
  try {
    const raw = localStorage.getItem(JOURNAL_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JournalDraft;
  } catch {
    return null;
  }
}

export function clearJournalDraft(): void {
  try {
    localStorage.removeItem(JOURNAL_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function saveLetterDraft(draft: Omit<LetterDraft, 'updatedAt'>): void {
  try {
    const hasContent = draft.title.trim().length > 0 || draft.content.trim().length > 0;
    if (!hasContent) {
      localStorage.removeItem(LETTER_DRAFT_KEY);
      return;
    }
    localStorage.setItem(
      LETTER_DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
    );
  } catch {
    // ignore
  }
}

export function loadLetterDraft(): LetterDraft | null {
  try {
    const raw = localStorage.getItem(LETTER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LetterDraft;
  } catch {
    return null;
  }
}

export function clearLetterDraft(): void {
  try {
    localStorage.removeItem(LETTER_DRAFT_KEY);
  } catch {
    // ignore
  }
}
