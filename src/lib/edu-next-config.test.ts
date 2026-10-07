import { describe, it, expect, vi } from 'vitest';

// Load the real next.config.ts and check the routing rules it produces.
vi.mock('@sentry/nextjs', () => ({ withSentryConfig: (cfg: unknown) => cfg }));

async function loadConfig(origin?: string) {
  vi.resetModules();
  if (origin === undefined) delete process.env.EDU_APP_ORIGIN;
  else process.env.EDU_APP_ORIGIN = origin;
  return (await import('../../next.config')).default as any;
}

describe('next.config /edu mount', () => {
  it('is not mounted when EDU_APP_ORIGIN is unset', async () => {
    const cfg = await loadConfig();
    const rewrites = await cfg.rewrites();
    expect(rewrites.beforeFiles ?? []).toEqual([]);
  });

  it('proxies /edu to the origin root, stripping the prefix', async () => {
    const cfg = await loadConfig('https://duxtur-edu.web.app/');
    const { beforeFiles } = await cfg.rewrites();
    expect(beforeFiles).toEqual([
      { source: '/edu', destination: 'https://duxtur-edu.web.app/' },
      { source: '/edu/:path*', destination: 'https://duxtur-edu.web.app/:path*' },
    ]);
  });

  it('serves the IndexNow key file from the site root, and nothing else', async () => {
    // @ts-expect-error Next's compiled path-to-regexp ships no type declarations
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const cfg = await loadConfig();
    const { afterFiles } = await cfg.rewrites();
    expect(afterFiles).toHaveLength(1);
    expect(afterFiles[0].destination).toBe('/api/indexnow/key/:key');

    const re = pathToRegexp(afterFiles[0].source);
    expect(re.test('/a1b2c3d4e5f60718293a4b5c6d7e8f90.txt')).toBe(true);
    for (const path of ['/robots.txt', '/ru/a1b2c3d4e5f60718293a4b5c6d7e8f90.txt', '/short.txt', '/a1b2c3d4e5f60718293a4b5c6d7e8f90.xml']) {
      expect(re.test(path)).toBe(false);
    }
  });

  it('gives /edu its own CSP and keeps the portal CSP off it', async () => {
    // @ts-expect-error Next's compiled path-to-regexp ships no type declarations
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const cfg = await loadConfig('https://duxtur-edu.web.app');
    const rules = await cfg.headers();
    const csp = (r: any) => r.headers.find((h: any) => h.key === 'Content-Security-Policy')?.value as string | undefined;
    const matching = (path: string) => rules.filter((r: any) => pathToRegexp(r.source).test(path) && csp(r));

    const eduRules = matching('/edu/exam');
    expect(eduRules).toHaveLength(1);
    expect(csp(eduRules[0])).toContain('https://apis.google.com');

    expect(matching('/edu')).toHaveLength(1);
    const portalRules = matching('/ru/doctors');
    expect(portalRules).toHaveLength(1);
    expect(csp(portalRules[0])).not.toContain('apis.google.com');
    expect(csp(portalRules[0])).toContain('mapbox');
  });

  it('lets only the portal itself frame the auth bridge, and no other Edu page', async () => {
    // @ts-expect-error Next's compiled path-to-regexp ships no type declarations
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const cfg = await loadConfig('https://duxtur-edu.web.app');
    const rules = await cfg.headers();
    const header = (r: any, key: string) => r.headers.find((h: any) => h.key === key)?.value as string | undefined;
    const matching = (path: string) => rules.filter((r: any) => pathToRegexp(r.source).test(path) && header(r, 'Content-Security-Policy'));

    const bridge = matching('/edu/auth-bridge');
    expect(bridge).toHaveLength(1);
    expect(header(bridge[0], 'Content-Security-Policy')).toContain("frame-ancestors 'self'");
    expect(header(bridge[0], 'X-Frame-Options')).toBe('SAMEORIGIN');

    for (const path of ['/edu/exam', '/edu/dashboard/teacher/articles', '/edu/auth-bridge-other', '/edu/x/auth-bridge']) {
      const rule = matching(path);
      expect(rule, path).toHaveLength(1);
      expect(header(rule[0], 'Content-Security-Policy'), path).toContain("frame-ancestors 'none'");
      expect(header(rule[0], 'X-Frame-Options'), path).toBe('DENY');
    }
  });
});
