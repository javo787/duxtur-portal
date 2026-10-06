import type { AuthorField, AuthorStanding } from '@/lib/author-profile';

/** What happened when an author pressed "Publish". */
export type SaveOutcome =
  | { success: true; outcome: 'published'; slug: string }
  /** Kept as a draft: `missing` says what the profile still lacks (empty when only the team's check is left). */
  | { success: true; outcome: 'draft' | 'awaiting'; draftId: string; missing: AuthorField[] }
  | { success: false; error: string };

/** The outcomes in which the text was kept or published (everything but an error). */
export type SaveSuccess = Extract<SaveOutcome, { success: true }>;

export interface DraftSummary {
  id: string;
  title: string;
  language: string;
  updatedAt: string;
}

/** Everything the writing studio needs to know about the person who opened it. */
export interface StudioState {
  signedIn: boolean;
  /** Portal role of the account in the database (the session may still say "patient" a little longer). */
  role: string;
  name: string;
  standing: AuthorStanding;
  missing: AuthorField[];
  drafts: DraftSummary[];
}

export const ARTICLE_LANGUAGES = ['ru', 'uz', 'tg', 'ky', 'kk'] as const;
export const MAX_DRAFTS_PER_AUTHOR = 20;
export const MAX_DRAFT_BYTES = 300_000;
