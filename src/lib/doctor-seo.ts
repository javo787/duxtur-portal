/**
 * SEO rules for the doctor directory: which URL a filtered listing canonicalizes to, and which specialty
 * pages are worth indexing.
 *
 * Pure (no DB, no React) so it can be unit-tested. The pages only load the data and pass it in.
 * The thresholds live next to the clinic ones in clinic-seo.ts.
 */
import { MIN_INDEXABLE_SPECIALTY_DOCTORS } from './clinic-seo';

type SearchParams = Record<string, string | string[] | undefined>;
type DateLike = Date | string | null | undefined;

/** Filters of /doctors that change WHICH doctors are listed. `sort` and `page` only reorder or slice the same list. */
const LIST_FILTERS = ['city', 'type', 'accepts', 'priceMin', 'priceMax', 'exp', 'lang_spoken', 'lat', 'lng', 'radius'] as const;

const filled = (value: string | string[] | undefined): boolean =>
  Array.isArray(value) ? value.some((v) => v.trim() !== '') : typeof value === 'string' && value.trim() !== '';

/** The page number a URL asks for; anything that is not a number is page 1, as the pages themselves treat it. */
function pageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = parseInt(raw ?? '1', 10);
  return Number.isFinite(n) ? n : 1;
}

/**
 * The path (without the language) a /doctors URL canonicalizes to.
 * `?specialty=cardiology` on its own is exactly the list of the cardiology landing page, so it points there
 * and the landing page collects the signals. Any other filter narrows the list, and the plain directory is
 * the closest page that exists. Sorting and paging never create a page of their own.
 */
export function doctorsListingCanonicalPath(sp: SearchParams, specialtySlugs: readonly string[]): string {
  const specialty = typeof sp.specialty === 'string' ? sp.specialty : undefined;
  const narrowed = LIST_FILTERS.some((key) => filled(sp[key]));
  return specialty && specialtySlugs.includes(specialty) && !narrowed ? `doctors/${specialty}` : 'doctors';
}

/**
 * True when the URL shows the plain first page of the directory: the only variant that is its own canonical
 * and so the only one that declares hreflang (alternates belong to indexable pages only).
 */
export function isPlainDoctorsListing(sp: SearchParams): boolean {
  return (
    !filled(sp.specialty) &&
    !filled(sp.sort) &&
    pageNumber(sp.page) <= 1 &&
    !LIST_FILTERS.some((key) => filled(sp[key]))
  );
}

/** The same for /doctors/<specialty>: a city, a consultation type, a sorting or a later page is a variant of it. */
export function isPlainSpecialtyListing(sp: SearchParams): boolean {
  return !['city', 'type', 'sort'].some((key) => filled(sp[key])) && pageNumber(sp.page) <= 1;
}

/** A specialty page without a single approved doctor is an empty page: noindex, and not in the sitemap. */
export function specialtyIndexable(approvedDoctors: number): boolean {
  return approvedDoctors >= MIN_INDEXABLE_SPECIALTY_DOCTORS;
}

export interface SpecialtyStat {
  slug: string;
  /** Approved doctors the specialty page lists. */
  count: number;
  /** Newest real update among those doctors; undefined when none has a date. */
  lastModified?: Date;
}

function toDate(value: DateLike): Date | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * How many doctors each specialty page would list, computed from the same approved doctors the sitemap
 * already loads. The page filters by the exact Russian name (`specialty.ru`), so this matches on it too.
 * Specialties without a doctor are not in the result.
 */
export function specialtyStats(
  doctors: { specialty?: { ru?: string } | null; updatedAt?: DateLike }[],
  labelsRu: Record<string, string>,
): SpecialtyStat[] {
  const slugByLabel = new Map(Object.entries(labelsRu).map(([slug, ru]) => [ru, slug]));
  const stats = new Map<string, SpecialtyStat>();

  for (const doctor of doctors) {
    const ru = doctor.specialty?.ru;
    const slug = ru ? slugByLabel.get(ru) : undefined;
    if (!slug) continue;
    const stat = stats.get(slug) ?? { slug, count: 0 };
    stat.count += 1;
    const when = toDate(doctor.updatedAt);
    if (when && (!stat.lastModified || when > stat.lastModified)) stat.lastModified = when;
    stats.set(slug, stat);
  }

  return Object.keys(labelsRu)
    .map((slug) => stats.get(slug))
    .filter((stat): stat is SpecialtyStat => !!stat);
}
