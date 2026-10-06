import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import { buildSitemapEntries } from './sitemap-entries';

/** The matching Google uses: a rule is a path prefix in which "*" matches anything (including "/"). */
function blocked(pathAndQuery: string): boolean {
  const rules = robots().rules;
  const rule = Array.isArray(rules) ? rules[0] : rules;
  return ([] as string[]).concat(rule.disallow ?? []).some((pattern) => {
    const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'));
    return re.test(pathAndQuery);
  });
}

const clinic = (slug: string, over: Record<string, unknown> = {}) => ({
  slug,
  status: 'approved',
  city: 'Душанбе',
  type: 'dental_clinic',
  specialties: ['Кардиология'],
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

describe('sitemap and robots.txt agree', () => {
  const entries = buildSitemapEntries({
    articles: [{ slug: 'a', title: { ru: 'Заголовок на русском', tg: 'Сарлавҳаи тоҷикӣ' } }],
    doctors: [{ slug: 'ivanov', _id: '1', specialty: { ru: 'Кардиология' } }],
    // Enough clinics for city, type and specialty listings to pass the thin-page threshold
    clinics: [clinic('a'), clinic('b'), clinic('c')],
    doctorSpecialties: { cardiology: 'Кардиология', dentistry: 'Стоматология' },
  });

  it('has something to check', () => {
    expect(entries.length).toBeGreaterThan(40);
    expect(entries.some((e) => e.url.includes('/clinics?'))).toBe(true);
  });

  it('lists no URL that robots.txt disallows', () => {
    const offenders = entries
      .map((e) => new URL(e.url.replace(/&amp;/g, '&')))
      .filter((url) => blocked(url.pathname + url.search))
      .map((url) => url.href);
    expect(offenders).toEqual([]);
  });

  it('lists no private area', () => {
    for (const { url } of entries) {
      expect(url).not.toMatch(/^https:\/\/duxtur\.org\/[a-z]{2}\/(login|register|signup|forgot-password|reset-password|search|admin|patient|clinic\/admin)(\/|\?|$)/);
    }
  });
});
