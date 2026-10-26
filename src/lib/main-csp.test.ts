import { afterEach, describe, expect, it, vi } from 'vitest';
import { mainCsp } from './main-csp';

vi.mock('@sentry/nextjs', () => ({ withSentryConfig: (cfg: unknown) => cfg }));
vi.mock('next-auth', () => ({ default: () => ({ auth: () => new Response(null) }) }));
vi.mock('@/auth.config', () => ({ authConfig: {} }));

// The policy the site shipped before the card service existed. Anything not asked for must stay exactly like this.
const POLICY_BEFORE = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com https://cdn-icons-png.flaticon.com https://*.tile.openstreetmap.org https://*.mapbox.com; media-src 'self' https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.mapbox.com https://api.cloudinary.com; frame-src 'self';";

const connectSrc = (policy: string) => policy.split('; ').find((d) => d.startsWith('connect-src '));

describe('mainCsp', () => {
  it('is byte-for-byte the previous policy when no origin is added', () => {
    expect(mainCsp()).toBe(POLICY_BEFORE);
  });

  it('adds origins to connect-src only', () => {
    const policy = mainCsp(['https://duxtur-render.onrender.com']);
    expect(connectSrc(policy)).toBe("connect-src 'self' https://*.mapbox.com https://api.cloudinary.com https://duxtur-render.onrender.com;".slice(0, -1));
    expect(policy.replace(' https://duxtur-render.onrender.com', '')).toBe(POLICY_BEFORE);
  });

  it('ignores empty entries', () => {
    expect(mainCsp(['', ''])).toBe(POLICY_BEFORE);
  });
});

describe('next.config: card service in the CSP', () => {
  const saved = process.env.NEXT_PUBLIC_CARD_SERVICE_URL;
  afterEach(() => {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_CARD_SERVICE_URL;
    else process.env.NEXT_PUBLIC_CARD_SERVICE_URL = saved;
  });

  async function mainRuleCsp(value: string | undefined): Promise<string> {
    vi.resetModules();
    if (value === undefined) delete process.env.NEXT_PUBLIC_CARD_SERVICE_URL;
    else process.env.NEXT_PUBLIC_CARD_SERVICE_URL = value;
    const config = (await import('../../next.config')).default as any;
    const rules = (await config.headers()) as any[];
    const main = rules.find((r: any) => r.source.startsWith('/((?!edu/'));
    return main.headers.find((h: any) => h.key === 'Content-Security-Policy').value;
  }

  it('lets the browser call the configured service', async () => {
    expect(connectSrc(await mainRuleCsp('https://duxtur-render.onrender.com'))).toContain('https://duxtur-render.onrender.com');
  });

  it('drops a path, so only the origin goes into the policy', async () => {
    const policy = await mainRuleCsp('https://duxtur-render.onrender.com/card?x=1');
    expect(connectSrc(policy)?.endsWith(' https://duxtur-render.onrender.com')).toBe(true);
    expect(policy).not.toContain('/card?x=1');
  });

  it.each([undefined, '', 'http://duxtur-render.onrender.com', 'not a url', "https://x.com; script-src *"])('stays unchanged for %j', async (value) => {
    const policy = await mainRuleCsp(value);
    expect(policy).toBe(POLICY_BEFORE);
  });
});
