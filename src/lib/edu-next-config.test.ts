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
    expect(await cfg.rewrites()).toEqual([]);
  });

  it('proxies /edu to the origin root, stripping the prefix', async () => {
    const cfg = await loadConfig('https://duxtur-edu.web.app/');
    const { beforeFiles } = await cfg.rewrites();
    expect(beforeFiles).toEqual([
      { source: '/edu', destination: 'https://duxtur-edu.web.app/' },
      { source: '/edu/:path*', destination: 'https://duxtur-edu.web.app/:path*' },
    ]);
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
});
