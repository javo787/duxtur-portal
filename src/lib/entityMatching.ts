/**
 * Fuzzy name matching for clinic/doctor deduplication.
 *
 * Ported from the product-matching logic in the SalesTracker project
 * (src/utils/productMatching.ts), where it resolves voice-recognized product
 * names against a shop's catalog. Same shape of problem here: a newly
 * scraped clinic/doctor name needs to be checked against records that may
 * already exist in the DB (from a previous import or a different source),
 * where names are never byte-for-byte identical (typos, abbreviations,
 * transliteration differences, "ООО" vs no prefix, etc).
 *
 * Unlike a plain "top match" fuzzy search, this returns a *confidence tier*
 * that maps directly to pipeline/UI behavior:
 *   - exact / fuzzy_confident -> treat as the same entity, skip re-import
 *   - ambiguous               -> don't guess; flag for manual review
 *   - none                    -> genuinely new, safe to import
 *
 * Candidate lists here are expected to be scoped per city (mirrors
 * SalesTracker comparing against one shop's catalog rather than every
 * product nationwide) — small enough that a plain O(n) scan is fine.
 */

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/** Normalized string similarity, 0..1 (1 = identical after trim/lowercase). */
export function similarity(a: string, b: string): number {
  const normA = a.toLowerCase().trim();
  const normB = b.toLowerCase().trim();
  if (normA === normB) return 1;
  const maxLen = Math.max(normA.length, normB.length) || 1;
  return 1 - levenshtein(normA, normB) / maxLen;
}

export type MatchConfidence = 'exact' | 'fuzzy_confident' | 'ambiguous' | 'none';

export interface MatchCandidate {
  id: string;
  name: string;
}

export interface EntityMatchResult {
  confidence: MatchConfidence;
  /** The single confident match (exact or fuzzy_confident), else null. */
  match: MatchCandidate | null;
  /** 2-8 candidates when ambiguous, empty otherwise. */
  candidates: MatchCandidate[];
}

const CONFIDENT_THRESHOLD = 0.8;
const POSSIBLE_THRESHOLD = 0.5;
const CLOSE_WINDOW = 0.05;

/**
 * Matches a candidate name (e.g. a freshly scraped clinic/doctor name)
 * against existing records in the same city.
 *
 * Callers are responsible for extracting the right comparison string per
 * entity — e.g. `clinic.name.ru` for Clinic (multilingual), `doctor.name`
 * for Doctor (flat string) — and scoping `candidates` to the same city
 * before calling this.
 */
export function matchEntityByName(
  queryName: string,
  candidates: MatchCandidate[]
): EntityMatchResult {
  if (!queryName?.trim() || candidates.length === 0) {
    return { confidence: 'none', match: null, candidates: [] };
  }

  const normalizedQuery = queryName.toLowerCase().trim();

  // 1. Exact match on normalized name.
  const exact = candidates.find(c => c.name.toLowerCase().trim() === normalizedQuery);
  if (exact) {
    return { confidence: 'exact', match: exact, candidates: [] };
  }

  // 2. Fuzzy score against every candidate.
  const scored = candidates
    .map(c => ({ candidate: c, score: similarity(normalizedQuery, c.name) }))
    .filter(s => s.score >= POSSIBLE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { confidence: 'none', match: null, candidates: [] };
  }

  // 3. closeMatches = everything within CLOSE_WINDOW of the top score.
  const topScore = scored[0].score;
  const closeMatches = scored.filter(s => s.score >= topScore - CLOSE_WINDOW).map(s => s.candidate);

  // Exactly one confident match -> safe to treat as the same entity.
  if (topScore >= CONFIDENT_THRESHOLD && closeMatches.length === 1) {
    return { confidence: 'fuzzy_confident', match: closeMatches[0], candidates: [] };
  }

  // 2+ close candidates -> don't guess, surface for review.
  if (closeMatches.length > 1) {
    return { confidence: 'ambiguous', match: null, candidates: closeMatches.slice(0, 8) };
  }

  // Single candidate but below the confident threshold -> still needs a human.
  if (topScore >= POSSIBLE_THRESHOLD) {
    return { confidence: 'ambiguous', match: null, candidates: scored.slice(0, 8).map(s => s.candidate) };
  }

  return { confidence: 'none', match: null, candidates: [] };
}
