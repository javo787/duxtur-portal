import { describe, expect, it } from 'vitest';
import { parsePublishPayload } from './payload';
import { makeArticle } from './test-fixtures';

const SOURCES = [
  { name: 'MedlinePlus (NLM)', title: 'High Blood Pressure', url: 'https://medlineplus.gov/highbloodpressure.html', license: 'x' },
  { name: 'Europe PMC: J, 2024', title: 'Review', url: 'https://doi.org/10.1000/abc', license: 'Open access (cc by)' },
];

const body = (over: Record<string, unknown> = {}) => ({
  topicKey: 'hypertension',
  languages: { ru: makeArticle('ru'), uz: makeArticle('uz'), tg: makeArticle('tg'), kk: makeArticle('kk'), ky: makeArticle('ky') },
  sources: SOURCES,
  ...over,
});

describe('parsePublishPayload', () => {
  it('accepts a complete article', () => {
    const r = parsePublishPayload(body());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.value.languages).sort()).toEqual(['kk', 'ky', 'ru', 'tg', 'uz']);
      expect(r.value.sources).toHaveLength(2);
    }
  });

  it('accepts Russian alone', () => {
    expect(parsePublishPayload(body({ languages: { ru: makeArticle('ru') } })).ok).toBe(true);
  });

  it('takes the category from the topic list, whatever the request says', () => {
    const r = parsePublishPayload(body({ category: 'dentistry' }));
    expect(r.ok && r.value.category).toBe('cardiology');
  });

  it.each([null, 'text', 42, [], {}])('rejects a body that is %j', (b) => {
    expect(parsePublishPayload(b).ok).toBe(false);
  });

  it('rejects an unknown topic', () => {
    expect(parsePublishPayload(body({ topicKey: 'made-up' }))).toEqual({ ok: false, errors: ['unknown topicKey'] });
  });

  it('requires Russian', () => {
    const r = parsePublishPayload(body({ languages: { uz: makeArticle('uz') } }));
    expect(r).toEqual({ ok: false, errors: ['languages.ru is missing or malformed'] });
  });

  it('re-validates the texts on the server (a leaked secret must not be able to publish junk)', () => {
    const evil = makeArticle('ru');
    evil.sections[0].content += ' <script>steal()</script> Принимайте 500 мг. https://spam.example';
    const r = parsePublishPayload(body({ languages: { ru: evil } }));
    // tags are stripped by sanitization, but the dose and the link are still rejected
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors.join()).toMatch(/dose/);
  });

  it('rejects a translation in the wrong script', () => {
    const r = parsePublishPayload(body({ languages: { ru: makeArticle('ru'), uz: makeArticle('ru') } }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors.join()).toMatch(/uz: Uzbek must be Latin/);
  });

  it('only accepts source links on the allowed hosts and needs at least two sources', () => {
    const bad = parsePublishPayload(body({ sources: [SOURCES[0], { ...SOURCES[1], url: 'https://evil.example.com/x' }] }));
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.errors.join()).toMatch(/source rejected/);

    const few = parsePublishPayload(body({ sources: [SOURCES[0]] }));
    expect(few.ok).toBe(false);
    expect(!few.ok && few.errors).toContain('at least two valid sources are required');
  });

  it('clips oversized source fields instead of storing them', () => {
    const r = parsePublishPayload(body({ sources: [{ ...SOURCES[0], title: 'x'.repeat(5000) }, SOURCES[1]] }));
    expect(r.ok && r.value.sources[0].title.length).toBe(300);
  });
});
