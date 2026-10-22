import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpsOrigin } from './study-api';
import { EDU_CSP } from './edu-csp';

// The real next.config.ts, loaded with different environments (same approach as edu-next-config.test.ts).
vi.mock('@sentry/nextjs', () => ({ withSentryConfig: (cfg: unknown) => cfg }));
vi.mock('next-auth', () => ({ default: () => ({ auth: () => new Response(null) }) }));
vi.mock('@/auth.config', () => ({ authConfig: {} }));

const KEYS = ['EDU_APP_ORIGIN', 'STUDY_API_ORIGIN', 'STUDY_API_CONNECT_ORIGIN'] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

async function loadConfig(env: Partial<Record<(typeof KEYS)[number], string>>) {
  vi.resetModules();
  for (const k of KEYS) {
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  return (await import('../../next.config')).default as any;
}

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const csp = (rule: any) => rule.headers.find((h: any) => h.key === 'Content-Security-Policy')?.value as string;

describe('httpsOrigin', () => {
  it('keeps only an https origin', () => {
    expect(httpsOrigin('https://study-api.onrender.com')).toBe('https://study-api.onrender.com');
    expect(httpsOrigin(' https://study-api.onrender.com/ ')).toBe('https://study-api.onrender.com');
    expect(httpsOrigin('https://study-api.onrender.com/api/study?x=1')).toBe('https://study-api.onrender.com');
    expect(httpsOrigin('https://localhost:8443')).toBe('https://localhost:8443');
  });

  it('treats anything else as not configured', () => {
    for (const bad of [undefined, '', '   ', 'http://study-api.onrender.com', 'study-api.onrender.com', 'javascript:alert(1)', 'ftp://x.y']) {
      expect(httpsOrigin(bad), String(bad)).toBe('');
    }
  });
});

describe('/edu/api/study rewrite', () => {
  const EDU = 'https://duxtur-edu.web.app';
  const API = 'https://study-api.onrender.com';

  it('changes nothing while STUDY_API_ORIGIN is unset', async () => {
    const { beforeFiles } = await (await loadConfig({ EDU_APP_ORIGIN: EDU })).rewrites();
    expect(beforeFiles).toEqual([
      { source: '/edu', destination: `${EDU}/` },
      { source: '/edu/:path*', destination: `${EDU}/:path*` },
    ]);
  });

  it('forwards /edu/api/study/* to the service, above the generic /edu rule (first match wins)', async () => {
    // @ts-expect-error Next's compiled path-to-regexp ships no type declarations
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const { beforeFiles } = await (await loadConfig({ EDU_APP_ORIGIN: EDU, STUDY_API_ORIGIN: `${API}/` })).rewrites();
    expect(beforeFiles).toEqual([
      { source: '/edu/api/study/:path*', destination: `${API}/api/study/:path*` },
      { source: '/edu', destination: `${EDU}/` },
      { source: '/edu/:path*', destination: `${EDU}/:path*` },
    ]);

    const re = pathToRegexp(beforeFiles[0].source);
    for (const path of ['/edu/api/study/sync', '/edu/api/study/auth', '/edu/api/study/lesson-detail']) expect(re.test(path), path).toBe(true);
    for (const path of ['/edu/api/other', '/edu/exam', '/api/study/sync', '/edu/api/studyx']) expect(re.test(path), path).toBe(false);
  });

  it('ignores a value that is not an https origin', async () => {
    const { beforeFiles } = await (await loadConfig({ EDU_APP_ORIGIN: EDU, STUDY_API_ORIGIN: 'http://study-api.onrender.com' })).rewrites();
    expect(beforeFiles).toHaveLength(2);
  });

  it('adds nothing when /edu itself is not mounted', async () => {
    const rewrites = await (await loadConfig({ STUDY_API_ORIGIN: API })).rewrites();
    expect(rewrites.beforeFiles ?? []).toEqual([]);
  });
});

describe('Edu CSP and the Study.tj API origin', () => {
  const EDU = 'https://duxtur-edu.web.app';
  const API = 'https://study-api.onrender.com';

  async function eduRules(env: Parameters<typeof loadConfig>[0]) {
    // @ts-expect-error Next's compiled path-to-regexp ships no type declarations
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const rules = await (await loadConfig(env)).headers();
    return (path: string) => rules.filter((r: any) => pathToRegexp(r.source).test(path) && csp(r));
  }

  it('is exactly the old policy when no connect origin is set', async () => {
    const matching = await eduRules({ EDU_APP_ORIGIN: EDU });
    expect(csp(matching('/edu/exam')[0])).toBe(EDU_CSP);
  });

  it('lets Edu pages (not the auth bridge) call the service when STUDY_API_CONNECT_ORIGIN is set', async () => {
    const matching = await eduRules({ EDU_APP_ORIGIN: EDU, STUDY_API_CONNECT_ORIGIN: API });
    const connect = (rule: any) => csp(rule).split('; ').find((d) => d.startsWith('connect-src '));
    expect(connect(matching('/edu/exam')[0])).toBe(`connect-src 'self' https://*.googleapis.com https://*.firebaseio.com ${API}`);
    expect(connect(matching('/edu/auth-bridge')[0])).not.toContain(API);
    expect(csp(matching('/ru/doctors')[0])).not.toContain(API); // the portal's own pages are untouched
  });
});

describe('proxy matcher', () => {
  it('skips /edu/api/* but still covers every other /edu path and the portal', async () => {
    // @ts-expect-error Next's compiled path-to-regexp ships no type declarations
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const { config } = await import('../middleware');
    const re = pathToRegexp(config.matcher[0]);
    for (const path of ['/edu/api/study/sync', '/edu/api/study/auth', '/api/x', '/_next/static/a.js']) expect(re.test(path), path).toBe(false);
    for (const path of ['/edu', '/edu/exam', '/edu/apiary', '/edu/dashboard/api', '/ru/doctors', '/']) expect(re.test(path), path).toBe(true);
  });
});
