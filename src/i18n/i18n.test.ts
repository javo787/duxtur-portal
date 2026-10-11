import { describe, it, expect } from 'vitest';
import { ru } from './locales/ru';
import { uz } from './locales/uz';
import { tg } from './locales/tg';
import { kk } from './locales/kk';
import { ky } from './locales/ky';
import { T } from './index';
import { createI18n } from './client';

const locales = { uz, tg, kk, ky };

function keysOf(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}

describe('dictionaries', () => {
  // Client components get one language and no fallback to Russian (see client.tsx), so a language must not lack a key.
  for (const [lang, dict] of Object.entries(locales)) {
    it(`${lang} has exactly the keys of ru`, () => {
      const base = new Set(keysOf(ru));
      const own = new Set(keysOf(dict));
      expect([...base].filter(k => !own.has(k))).toEqual([]);
      expect([...own].filter(k => !base.has(k))).toEqual([]);
    });
  }
});

describe('createI18n (client dictionaries)', () => {
  it('gives the same text as the server T() for every key of every language', () => {
    for (const [lang, dict] of Object.entries({ ru, ...locales })) {
      const { t } = createI18n(lang as 'ru', dict);
      for (const key of keysOf(ru)) expect(t(key), `${lang}:${key}`).toBe(T(key, lang));
    }
  });

  it('returns the key for a missing or non-leaf key instead of throwing', () => {
    const { t, lang } = createI18n('uz', uz);
    expect(lang).toBe('uz');
    expect(t('no.such.key')).toBe('no.such.key');
    expect(t('common')).toBe('common'); // a section, not a string
    expect(t('common.verified.deeper')).toBe('common.verified.deeper');
  });
});
