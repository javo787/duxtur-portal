import { isAllowedSourceUrl } from './sources';
import { topicByKey } from './topics';
import { toLocalized, validateLocalized } from './validate';
import { LANGS, type Category, type GeneratedArticle, type Lang, type SourceRef } from './types';

/**
 * The publishing endpoint writes to the database, so it trusts nothing in the request, even behind the
 * secret: texts are validated again, the category comes from the topic list (not from the request), and a
 * source link may only point at the hosts the pipeline reads from.
 */

export const MAX_BODY_BYTES = 400_000;
const MAX_SOURCES = 12;

export type ParsedPayload = { ok: true; value: GeneratedArticle } | { ok: false; errors: string[] };

const clip = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function parsePublishPayload(body: unknown): ParsedPayload {
  if (!body || typeof body !== 'object') return { ok: false, errors: ['body must be a JSON object'] };
  const b = body as Record<string, unknown>;

  const topic = typeof b.topicKey === 'string' ? topicByKey(b.topicKey) : undefined;
  if (!topic) return { ok: false, errors: ['unknown topicKey'] };

  const errors: string[] = [];
  const langsIn = (b.languages && typeof b.languages === 'object' ? b.languages : {}) as Record<string, unknown>;

  const ru = toLocalized(langsIn.ru);
  if (!ru) return { ok: false, errors: ['languages.ru is missing or malformed'] };
  const ruErrors = validateLocalized('ru', ru);
  if (ruErrors.length > 0) errors.push(...ruErrors.map((e) => `ru: ${e}`));

  const languages: GeneratedArticle['languages'] = { ru };
  for (const lang of LANGS as readonly Lang[]) {
    if (lang === 'ru' || langsIn[lang] === undefined) continue;
    const parsed = toLocalized(langsIn[lang]);
    if (!parsed) {
      errors.push(`${lang}: malformed`);
      continue;
    }
    const langErrors = validateLocalized(lang, parsed, ru);
    if (langErrors.length > 0) errors.push(...langErrors.map((e) => `${lang}: ${e}`));
    else languages[lang] = parsed;
  }

  const sources: SourceRef[] = [];
  if (Array.isArray(b.sources)) {
    for (const s of b.sources.slice(0, MAX_SOURCES)) {
      const r = (s ?? {}) as Record<string, unknown>;
      const url = clip(r.url, 500);
      const title = clip(r.title, 300);
      if (!isAllowedSourceUrl(url) || !title) {
        errors.push(`source rejected: ${url.slice(0, 80) || '(no url)'}`);
        continue;
      }
      sources.push({ name: clip(r.name, 120) || 'Source', title, url, license: clip(r.license, 160) });
    }
  }
  if (sources.length < 2) errors.push('at least two valid sources are required');

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { topicKey: topic.key, category: topic.category as Category, languages, sources } };
}
