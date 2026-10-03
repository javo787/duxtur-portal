import { describe, it, expect } from 'vitest';
// The same matcher Next.js uses for redirects/rewrites in next.config.
import { match } from 'next/dist/compiled/path-to-regexp';
import { i18n } from '../i18n-config';
import { EDU_BASE, eduLocaleRedirects, isEduPath } from './edu-routes';

const [rule] = eduLocaleRedirects;
const matcher = match(rule.source);

function redirectTarget(pathname: string): string | null {
  const m = matcher(pathname);
  if (!m) return null;
  const params = m.params as { path?: string[] };
  const rest = params.path?.length ? `/${params.path.join('/')}` : '';
  return `${EDU_BASE}${rest}`;
}

describe('eduLocaleRedirects', () => {
  it('is a temporary redirect (cached permanent redirects would be hard to undo)', () => {
    expect(rule.permanent).toBe(false);
    expect(rule.destination).toBe('/edu/:path*');
  });

  it.each(i18n.locales)('/%s/edu goes to /edu', locale => {
    expect(redirectTarget(`/${locale}/edu`)).toBe('/edu');
    expect(redirectTarget(`/${locale}/edu/`)).toBe('/edu');
  });

  it('keeps the rest of the path', () => {
    expect(redirectTarget('/ru/edu/dashboard/student')).toBe('/edu/dashboard/student');
    expect(redirectTarget('/tg/edu/join')).toBe('/edu/join');
  });

  it('does not touch other pages or look-alike paths', () => {
    expect(redirectTarget('/ru/education')).toBeNull();
    expect(redirectTarget('/ru/edu-news')).toBeNull();
    expect(redirectTarget('/ru/blog')).toBeNull();
    expect(redirectTarget('/edu')).toBeNull(); // already the target
    expect(redirectTarget('/en/edu')).toBeNull(); // not a portal locale
    expect(redirectTarget('/xx/edu')).toBeNull();
  });

  it('the target is recognised as an Edu path, so middleware leaves it alone (no locale redirect loop)', () => {
    expect(isEduPath(redirectTarget('/ru/edu')!)).toBe(true);
    expect(isEduPath(redirectTarget('/uz/edu/join')!)).toBe(true);
  });
});
