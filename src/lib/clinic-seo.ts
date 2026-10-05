/**
 * SEO building blocks for clinic pages: metadata text, indexability rules and JSON-LD.
 *
 * Everything here is pure (no DB, no React) so it can be unit-tested. The pages only load the data
 * and pass it in.
 */
import { ALLOWED_CITIES, ALLOWED_CLINIC_TYPES, COMMON_SPECIALTIES, type ClinicType, type ClinicWorkingHours } from './clinic-constants';
import { instagramUrl, safeHttpUrl, specialtyId, telegramUrl, whatsappUrl } from './clinic-display';
import { hasRealWorkingHours } from './clinic-hours';
import { BASE_URL, SEO_LANGS, buildBreadcrumbJsonLd, buildPageUrl, type AlternateFilters, type SeoLang } from './seo';
import { facebookHref } from './social';

type LocalizedText = Partial<Record<SeoLang, string>>;
type Translate = (key: string) => string;

export interface ClinicSeoBranch {
  label?: string;
  address: string;
  city?: string;
  phone?: string;
  coordinates?: { lat?: number; lng?: number };
}

/** The subset of a clinic document that SEO needs (a lean Mongoose document satisfies it). */
export interface ClinicSeoInput {
  slug: string;
  type?: string;
  status?: string;
  name?: LocalizedText;
  description?: LocalizedText;
  logo?: string;
  coverImage?: string;
  photos?: string[];
  city?: string;
  address?: string;
  coordinates?: { lat?: number; lng?: number; coordinates?: number[] };
  phone?: string;
  email?: string;
  website?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  workingHours?: ClinicWorkingHours;
  specialties?: string[];
  branches?: ClinicSeoBranch[];
  rating?: { avg?: number; count?: number };
}

export interface ClinicSeoDoctor {
  _id?: unknown;
  name?: string;
  slug?: string;
  specialty?: LocalizedText | string;
}

// ---------------------------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------------------------

// Control, zero-width and bidi characters sneak into scraped data (see the invisible-characters fix).
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g;

export function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(INVISIBLE, ' ').replace(/\s+/g, ' ').trim();
}

/** Cuts at a word boundary and adds an ellipsis. Counts code points, so emoji are never split. */
export function truncateAtWord(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  const cut = chars.slice(0, max - 1).join('');
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.\u2013\u2014-]+$/u, '')}…`;
}

function pickText(obj: LocalizedText | undefined, lang: string): string {
  const own = cleanText(obj?.[lang as SeoLang]);
  return own || cleanText(obj?.ru);
}

export function clinicName(clinic: Pick<ClinicSeoInput, 'name'>, lang: string): string {
  return pickText(clinic.name, lang);
}

const lower = (s: string, lang: string) => s.toLocaleLowerCase(lang);

// ---------------------------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------------------------

interface CityInfo {
  country: 'TJ' | 'UZ' | 'KZ' | 'KG';
  /** Name per language where it differs from the Russian one. Missing = use the Russian name. */
  names?: LocalizedText;
}

// Keys are the Russian names stored in the database (ALLOWED_CITIES).
// The non-Russian spellings should be reviewed by native speakers; a missing entry falls back to Russian.
const CITIES: Record<string, CityInfo> = {
  'Душанбе': { country: 'TJ', names: { uz: 'Dushanbe' } },
  'Худжанд': { country: 'TJ', names: { uz: 'Xoʻjand', tg: 'Хуҷанд' } },
  'Куляб': { country: 'TJ', names: { uz: 'Kulob', tg: 'Кӯлоб' } },
  'Бохтар': { country: 'TJ', names: { uz: 'Boxtar' } },
  'Ташкент': { country: 'UZ', names: { uz: 'Toshkent', tg: 'Тошканд' } },
  'Самарканд': { country: 'UZ', names: { uz: 'Samarqand', tg: 'Самарқанд', kk: 'Самарқан' } },
  'Алматы': { country: 'KZ', names: { uz: 'Almati', tg: 'Алмотӣ' } },
  'Астана': { country: 'KZ', names: { uz: 'Ostona', tg: 'Остона' } },
  'Бишкек': { country: 'KG', names: { uz: 'Bishkek', kk: 'Бішкек' } },
};

/** Matches a stored city to the canonical (Russian) name, tolerating case and stray whitespace. */
export function normalizeCity(city?: string): string {
  const cleaned = cleanText(city);
  if (!cleaned) return '';
  return ALLOWED_CITIES.find(c => c.toLowerCase() === cleaned.toLowerCase()) ?? cleaned;
}

export function cityLabel(city: string | undefined, lang: string): string {
  const canonical = normalizeCity(city);
  return CITIES[canonical]?.names?.[lang as SeoLang] ?? canonical;
}

/** ISO 3166-1 alpha-2 code for a known city, otherwise undefined (never a guess). */
export function cityCountry(city?: string): string | undefined {
  return CITIES[normalizeCity(city)]?.country;
}

// ---------------------------------------------------------------------------------------------
// schema.org vocabulary
// ---------------------------------------------------------------------------------------------

const SCHEMA_TYPES: Record<string, string> = {
  hospital: 'Hospital',
  maternity: 'Hospital',
  dental_clinic: 'Dentist',
};

/** The most specific schema.org type for the clinic type; everything else is a MedicalClinic. */
export function clinicSchemaType(type?: string): string {
  return (type && SCHEMA_TYPES[type]) || 'MedicalClinic';
}

// Only specialties with a faithful schema.org MedicalSpecialty value are listed. There is no member for
// ophthalmology (Optometric is a different discipline) and Radiography means ionizing radiation, which is
// wrong for ultrasound and MRI: those are left out rather than mislabelled.
const MEDICAL_SPECIALTY: Record<string, string> = {
  cardiology: 'Cardiovascular',
  neurology: 'Neurologic',
  dentistry: 'Dentistry',
  pediatrics: 'Pediatric',
  dermatology: 'Dermatology',
  surgery: 'Surgical',
  gynecology: 'Gynecologic',
  tests: 'LaboratoryScience',
  general: 'PrimaryCare',
  endocrinology: 'Endocrine',
  urology: 'Urologic',
  orthopedics: 'Musculoskeletal',
  gastroenterology: 'Gastroenterologic',
  ent: 'Otolaryngologic',
  oncology: 'Oncologic',
  genetics: 'Genetic',
  physiotherapy: 'Physiotherapy',
};

export function medicalSpecialties(specialties: string[] | undefined): string[] {
  const out = new Set<string>();
  for (const s of specialties ?? []) {
    const id = specialtyId(s);
    const value = id && MEDICAL_SPECIALTY[id];
    if (value) out.add(`https://schema.org/${value}`);
  }
  return [...out];
}

// ---------------------------------------------------------------------------------------------
// Indexability
// ---------------------------------------------------------------------------------------------

/** An unclaimed import is only worth indexing once it carries text of its own. */
export const MIN_INDEXABLE_DESCRIPTION_CHARS = 80;

/** A listing (city / type / specialty) with fewer clinics than this is a thin page. */
export const MIN_INDEXABLE_LISTING_CLINICS = 3;

export type IndexabilityReason = 'verified' | 'import-with-text' | 'import-thin';

/**
 * Verified clinics are always indexable. A `pre_imported` clinic is only name, address and phone scraped
 * from a directory: indexing hundreds of those is thin, duplicated content, so it stays out of the index
 * until it has a real description of its own (usually when the owner claims it). Links stay followable.
 */
export function clinicIndexability(clinic: Pick<ClinicSeoInput, 'status' | 'description'>): {
  index: boolean;
  reason: IndexabilityReason;
} {
  if (clinic.status !== 'pre_imported') return { index: true, reason: 'verified' };
  const hasText = SEO_LANGS.some(l => cleanText(clinic.description?.[l]).length >= MIN_INDEXABLE_DESCRIPTION_CHARS);
  return hasText ? { index: true, reason: 'import-with-text' } : { index: false, reason: 'import-thin' };
}

// ---------------------------------------------------------------------------------------------
// Clinic page metadata text
// ---------------------------------------------------------------------------------------------

// The root layout appends " | Duxtur.org" (13 characters) and Google shows about 60, Cyrillic being wider than Latin.
const TITLE_BUDGET = 47;

export function buildClinicTitle(clinic: ClinicSeoInput, lang: string, t: Translate): string {
  const name = clinicName(clinic, lang);
  const typeLabel = clinic.type ? t(`clinic.type_${clinic.type}`) : '';
  const city = cityLabel(clinic.city, lang);

  const candidates = [
    [name, [typeLabel, city].filter(Boolean).join(', ')],
    [name, city],
  ].map(parts => parts.filter(Boolean).join(' — '));

  return candidates.find(c => Array.from(c).length <= TITLE_BUDGET) ?? name;
}

export function buildClinicDescription(
  clinic: ClinicSeoInput,
  lang: string,
  t: Translate,
): { text: string; own: boolean } {
  const own = pickText(clinic.description, lang);
  if (own) return { text: truncateAtWord(own, 158), own: true };

  // No text of its own: state the facts a searcher wants, built from already-translated labels.
  const name = clinicName(clinic, lang);
  const typeLabel = clinic.type ? t(`clinic.type_${clinic.type}`) : '';
  const city = cityLabel(clinic.city, lang);
  const address = cleanText(clinic.address);
  const phone = cleanText(clinic.phone);

  const parts = [
    `${[name, [typeLabel, city].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}.`,
    address && `${t('clinic.address')}: ${address}.`,
    phone && `${t('booking.phone')}: ${phone}.`,
    `${lower(t('clinic.doctors'), lang)}, ${lower(t('clinic.reviews'), lang)} — Duxtur.org`,
  ].filter(Boolean);

  return { text: truncateAtWord(parts.join(' '), 158), own: false };
}

// ---------------------------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------------------------

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

function absoluteImageUrl(url: string | undefined): string | undefined {
  const cleaned = cleanText(url);
  if (!cleaned) return undefined;
  if (cleaned.startsWith('/')) return `${BASE_URL}${cleaned}`;
  return safeHttpUrl(cleaned) ?? undefined;
}

/**
 * 1200x630 JPEG for link previews. Telegram, WhatsApp and Facebook do not all read AVIF/WebP, and an
 * arbitrary-size upload crops badly. Only Cloudinary URLs can be transformed; others pass through.
 */
export function ogImageUrl(url: string | undefined): { url: string; transformed: boolean } | undefined {
  const abs = absoluteImageUrl(url);
  if (!abs) return undefined;
  const parts = abs.split('/upload/');
  if (!abs.includes('res.cloudinary.com') || parts.length !== 2) return { url: abs, transformed: false };
  const { width, height } = OG_IMAGE_SIZE;
  return { url: `${parts[0]}/upload/c_fill,g_auto,w_${width},h_${height},f_jpg,q_auto/${parts[1]}`, transformed: true };
}

// ---------------------------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------------------------

/**
 * Drops everything that would make a structured-data validator complain: undefined, null, empty strings,
 * empty arrays and objects, NaN. Objects left with nothing but an @type (an empty PostalAddress) go too.
 * Numbers 0 and booleans false are real values and stay.
 */
export function cleanJsonLd(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    const items = value.map(cleanJsonLd).filter(v => v !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = cleanJsonLd(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return Object.keys(out).some(k => k !== '@type') ? out : undefined;
  }
  return value;
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

function normalizeTime(value: unknown): string | null {
  const m = typeof value === 'string' ? /^(\d{1,2}):(\d{2})$/.exec(value.trim()) : null;
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

/** Days with identical hours are merged into one OpeningHoursSpecification (Google's preferred form). */
export function openingHoursSpecification(hours: ClinicWorkingHours | undefined) {
  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return undefined;
  const groups = new Map<string, { days: string[]; opens: string; closes: string }>();
  for (const [key, dayName] of Object.entries(DAY_NAMES)) {
    const day = hours[key as keyof ClinicWorkingHours];
    if (!day?.isWorking) continue;
    const opens = normalizeTime(day.open);
    const closes = normalizeTime(day.close);
    if (!opens || !closes) continue;
    const id = `${opens}-${closes}`;
    const group = groups.get(id) ?? { days: [], opens, closes };
    group.days.push(dayName);
    groups.set(id, group);
  }
  if (!groups.size) return undefined;
  return [...groups.values()].map(g => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: g.days,
    opens: g.opens,
    closes: g.closes,
  }));
}

function validPoint(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const la = typeof lat === 'number' ? lat : NaN;
  const ln = typeof lng === 'number' ? lng : NaN;
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
  if (la === 0 && ln === 0) return null; // the "null island" default of a missing pin
  return { lat: la, lng: ln };
}

function clinicPoint(clinic: Pick<ClinicSeoInput, 'coordinates'>) {
  const c = clinic.coordinates;
  return validPoint(c?.lat ?? c?.coordinates?.[1], c?.lng ?? c?.coordinates?.[0]);
}

const fixed5 = (n: number) => Number(n.toFixed(5)); // Google asks for at least 5 decimal places

function geoNode(point: { lat: number; lng: number } | null) {
  return point ? { '@type': 'GeoCoordinates', latitude: fixed5(point.lat), longitude: fixed5(point.lng) } : undefined;
}

function postalAddress(street: string | undefined, city: string | undefined) {
  const locality = normalizeCity(city);
  return {
    '@type': 'PostalAddress',
    streetAddress: cleanText(street),
    addressLocality: locality,
    addressCountry: cityCountry(locality),
  };
}

export function clinicSameAs(clinic: ClinicSeoInput): string[] {
  const links = [
    clinic.website ? safeHttpUrl(clinic.website) : null,
    clinic.telegram ? telegramUrl(clinic.telegram) : null,
    clinic.instagram ? instagramUrl(clinic.instagram) : null,
    facebookHref(clinic.facebook),
    clinic.whatsapp ? whatsappUrl(clinic.whatsapp) : null,
  ];
  return [...new Set(links.filter((l): l is string => !!l))];
}

function clinicImages(clinic: ClinicSeoInput): string[] {
  const all = [clinic.coverImage, clinic.logo, ...(clinic.photos ?? []).slice(0, 4)]
    .map(absoluteImageUrl)
    .filter((u): u is string => !!u);
  return [...new Set(all)];
}

function doctorEmployee(doc: ClinicSeoDoctor, lang: string) {
  const key = cleanText(doc.slug) || (doc._id ? String(doc._id) : '');
  const specialty = typeof doc.specialty === 'string' ? doc.specialty : pickText(doc.specialty, lang);
  return {
    '@type': 'Person',
    name: cleanText(doc.name),
    jobTitle: cleanText(specialty),
    url: key ? `${BASE_URL}/${lang}/doctor/${key}` : undefined,
  };
}

/** Ratings count only when they are real, visible reviews of a verified clinic. */
function aggregateRating(clinic: ClinicSeoInput) {
  const count = clinic.rating?.count ?? 0;
  const avg = clinic.rating?.avg ?? 0;
  if (clinic.status === 'pre_imported' || count < 1 || avg < 1 || avg > 5) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: Number(avg.toFixed(1)),
    reviewCount: count,
    bestRating: 5,
    worstRating: 1,
  };
}

export function mapsLink(point: { lat: number; lng: number } | null): string | undefined {
  return point ? `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}` : undefined;
}

/**
 * One @graph per clinic page: the clinic (with its branches as separate, linked entities), the page that
 * describes it, and the breadcrumb. Breadcrumb used to be nested inside the clinic, which schema.org does
 * not allow (it is a property of WebPage), and `priceRange: '$$'` was invented for every clinic.
 */
export function buildClinicJsonLd(args: {
  clinic: ClinicSeoInput;
  lang: string;
  t: Translate;
  doctors?: ClinicSeoDoctor[];
}) {
  const { clinic, lang, t } = args;
  const doctors = args.doctors ?? [];
  const url = buildPageUrl(lang, `clinics/${clinic.slug}`);
  const clinicId = `${url}#clinic`;
  const name = clinicName(clinic, lang);
  const type = clinicSchemaType(clinic.type);
  const point = clinicPoint(clinic);
  const description = pickText(clinic.description, lang);

  const hours = hasRealWorkingHours(clinic) ? openingHoursSpecification(clinic.workingHours) : undefined;

  const clinicNode = {
    '@type': type,
    '@id': clinicId,
    name,
    url,
    description: description ? truncateAtWord(description, 500) : undefined,
    image: clinicImages(clinic),
    logo: absoluteImageUrl(clinic.logo),
    telephone: cleanText(clinic.phone),
    email: cleanText(clinic.email),
    address: postalAddress(clinic.address, clinic.city),
    geo: geoNode(point),
    hasMap: mapsLink(point),
    openingHoursSpecification: hours,
    aggregateRating: aggregateRating(clinic),
    sameAs: clinicSameAs(clinic),
    medicalSpecialty: medicalSpecialties(clinic.specialties),
    employee: doctors.slice(0, 20).map(d => doctorEmployee(d, lang)),
  };

  const branchNodes = (clinic.branches ?? []).map((b, i) => ({
    '@type': type,
    '@id': `${url}#branch-${i + 1}`,
    name: [name, cleanText(b.label)].filter(Boolean).join(' — '),
    branchOf: { '@id': clinicId },
    address: postalAddress(b.address, b.city || clinic.city),
    telephone: cleanText(b.phone),
    geo: geoNode(validPoint(b.coordinates?.lat, b.coordinates?.lng)),
  }));

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: 'Duxtur.org', url: `/${lang}` },
    { name: t('clinic.title'), url: `/${lang}/clinics` },
    { name, url: `/${lang}/clinics/${clinic.slug}` },
  ]) as Record<string, unknown>;
  delete breadcrumb['@context'];

  const pageNode = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: buildClinicTitle(clinic, lang, t),
    inLanguage: lang,
    mainEntity: { '@id': clinicId },
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };

  return cleanJsonLd({
    '@context': 'https://schema.org',
    '@graph': [clinicNode, ...branchNodes, pageNode, { ...breadcrumb, '@id': `${url}#breadcrumb` }],
  });
}

// ---------------------------------------------------------------------------------------------
// Directory (listing) pages
// ---------------------------------------------------------------------------------------------

export interface ListingFilters {
  city?: string;
  type?: string;
  specialty?: string;
  q?: string;
  sort?: string;
  page: number;
}

function specialtyLabel(value: string, lang: string, t: Translate): string {
  const id = specialtyId(value);
  if (!id) return cleanText(value);
  const key = `clinic.specialty_${id}`;
  const translated = t(key);
  return translated === key ? (COMMON_SPECIALTIES.find(s => s.id === id)?.label ?? value) : translated;
}

/** "Стоматология — Душанбе": the nominative form people actually type, with no case endings to get wrong. */
export function buildListingHeading(filters: ListingFilters, lang: string, t: Translate): string {
  const parts = [
    filters.type ? t(`clinic.type_${filters.type}`) : t('clinic.title'),
    filters.specialty ? specialtyLabel(filters.specialty, lang, t) : '',
    filters.city ? cityLabel(filters.city, lang) : '',
  ];
  return parts.filter(Boolean).join(' — ');
}

export function buildListingMetadataText(args: { filters: ListingFilters; total: number; lang: string; t: Translate }) {
  const { filters, total, lang, t } = args;
  const heading = buildListingHeading(filters, lang, t);
  const tagline = [t('clinic.address'), t('booking.phone'), t('clinic.reviews')].map(s => lower(s, lang)).join(', ');
  const pageSuffix = filters.page > 1 ? ` (${filters.page})` : '';

  const withTagline = `${heading}: ${tagline}${pageSuffix}`;
  const title = Array.from(withTagline).length <= TITLE_BUDGET ? withTagline : `${heading}${pageSuffix}`;

  const found = total > 0 ? t('clinic.found').replace('{count}', String(total)) : '';
  const description = truncateAtWord([`${heading}.`, found && `${found}.`, t('clinic.directorySubtitle')].filter(Boolean).join(' '), 158);

  return { title, description, heading };
}

/**
 * Which listing URLs belong in the index. Search (`q`) results and empty pages never do, and a filtered
 * listing needs enough clinics to be more than a thin page. Sorting never creates a new URL (see
 * buildFilterQuery), so it does not matter here.
 */
export function listingIndexable(filters: Pick<ListingFilters, 'city' | 'type' | 'specialty' | 'q'>, total: number): boolean {
  if (filters.q) return false;
  if (total === 0) return false;
  const isFiltered = !!(filters.city || filters.type || filters.specialty);
  return !isFiltered || total >= MIN_INDEXABLE_LISTING_CLINICS;
}

export function buildClinicListJsonLd(args: {
  clinics: { slug: string; name?: LocalizedText }[];
  lang: string;
  name: string;
  filters: AlternateFilters;
  /** Number of clinics on the previous pages, so positions keep counting across pagination. */
  offset: number;
}) {
  const { clinics, lang, name, filters, offset } = args;
  return cleanJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: buildPageUrl(lang, 'clinics', filters),
    itemListElement: clinics.map((c, i) => ({
      '@type': 'ListItem',
      position: offset + i + 1,
      url: `${BASE_URL}/${lang}/clinics/${c.slug}`,
      name: pickText(c.name, lang),
    })),
  });
}

// ---------------------------------------------------------------------------------------------
// Listing facets for the sitemap
// ---------------------------------------------------------------------------------------------

export interface ListingFacet {
  city?: string;
  type?: string;
  specialty?: string;
  /** Clinics the directory shows for this combination. */
  count: number;
  lastModified?: Date;
}

/** Rollout valve: only the biggest facets go into the sitemap (they stay reachable by links either way). */
export const MAX_FACETS_IN_SITEMAP = 100;

/**
 * The city / type / specialty listings that are worth indexing, computed from the same clinics the
 * directory shows. A facet qualifies when it has at least MIN_INDEXABLE_LISTING_CLINICS clinics, which is
 * exactly the rule listingIndexable applies on the page, so sitemap and robots meta never disagree.
 * Combinations: city, type, specialty, city+type, city+specialty (the "УЗИ Душанбе" kind of query).
 */
export type FacetSource = Pick<ClinicSeoInput, 'city' | 'type' | 'specialties'> & { updatedAt?: Date | string | null };

export function indexableListingFacets(clinics: FacetSource[]): ListingFacet[] {
  const groups = new Map<string, ListingFacet>();

  const bump = (facet: Omit<ListingFacet, 'count'>, updatedAt: Date | undefined) => {
    const key = [facet.city ?? '', facet.type ?? '', facet.specialty ?? ''].join('|');
    const group = groups.get(key) ?? { ...facet, count: 0 };
    group.count += 1;
    if (updatedAt && (!group.lastModified || updatedAt > group.lastModified)) group.lastModified = updatedAt;
    groups.set(key, group);
  };

  for (const clinic of clinics) {
    const canonicalCity = normalizeCity(clinic.city);
    const city = ALLOWED_CITIES.includes(canonicalCity) ? canonicalCity : undefined;
    const type = ALLOWED_CLINIC_TYPES.includes(clinic.type as ClinicType) ? clinic.type : undefined;
    const specialties = [...new Set((clinic.specialties ?? []).map(s => specialtyId(s)).filter((id): id is string => !!id))];
    const updated = clinic.updatedAt ? new Date(clinic.updatedAt) : undefined;
    const when = updated && !Number.isNaN(updated.getTime()) ? updated : undefined;

    if (city) bump({ city }, when);
    if (type) bump({ type }, when);
    if (city && type) bump({ city, type }, when);
    for (const specialty of specialties) {
      bump({ specialty }, when);
      if (city) bump({ city, specialty }, when);
    }
  }

  return [...groups.values()]
    .filter(f => listingIndexable(f, f.count))
    .sort((a, b) => b.count - a.count || (a.city ?? '').localeCompare(b.city ?? '') || (a.type ?? '').localeCompare(b.type ?? '') || (a.specialty ?? '').localeCompare(b.specialty ?? ''))
    .slice(0, MAX_FACETS_IN_SITEMAP);
}
