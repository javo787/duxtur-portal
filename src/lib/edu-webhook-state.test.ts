import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { expectedWebhookUrl, logWebhookState, resetWebhookStateThrottle, servingHostOf, setWebhookFix, webhookProblems } from './edu-webhook-state';

const BOT_TOKEN = '123456:VERY_SECRET_BOT_TOKEN-x';
const WWW_URL = 'https://www.duxtur.org/api/edu-auth/telegram/webhook';

let logs: string[];

function lines(): Record<string, unknown>[] {
  return logs.map(l => JSON.parse(l)).filter(l => l.event === 'start:webhook-state');
}

function stubTelegram(result: Record<string, unknown> | { ok: false; error_code: number; description: string }) {
  const fn = vi.fn(async () => new Response(JSON.stringify('ok' in result ? result : { ok: true, result })));
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  logs = [];
  vi.spyOn(console, 'log').mockImplementation((l: string) => void logs.push(String(l)));
  vi.spyOn(console, 'warn').mockImplementation((l: string) => void logs.push(String(l)));
  vi.spyOn(console, 'error').mockImplementation((l: string) => void logs.push(String(l)));
  resetWebhookStateThrottle();
  delete process.env.VERCEL_ENV;
  process.env.EDU_TELEGRAM_BOT_TOKEN = BOT_TOKEN;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.EDU_TELEGRAM_BOT_TOKEN;
  delete process.env.VERCEL_ENV;
});

describe('webhookProblems', () => {
  it('is empty when the webhook is on the serving host and Telegram reports no errors', () => {
    expect(webhookProblems({ url: WWW_URL, pending_update_count: 0 }, 'www.duxtur.org')).toEqual([]);
  });

  it('says nothing is registered', () => {
    expect(webhookProblems({ url: '' }, 'www.duxtur.org')[0]).toContain('no webhook is registered');
  });

  it('explains the redirect trap when the webhook is on the bare domain but www serves', () => {
    const p = webhookProblems({ url: 'https://duxtur.org/api/edu-auth/telegram/webhook' }, 'www.duxtur.org');
    expect(p).toHaveLength(1);
    expect(p[0]).toContain('does not follow redirects');
    expect(p[0]).toContain('www.duxtur.org');
  });

  it('adds Telegram\'s own delivery error and the backlog', () => {
    const p = webhookProblems(
      { url: WWW_URL, pending_update_count: 4, last_error_message: 'Wrong response from the webhook: 308 Permanent Redirect' },
      'www.duxtur.org'
    );
    expect(p.join(' ')).toContain('308 Permanent Redirect');
    expect(p.join(' ')).toContain('4 updates are waiting');
  });
});

describe('helpers', () => {
  it('prefers x-forwarded-host and takes the first of a list', () => {
    expect(servingHostOf(new Headers({ host: 'a.example', 'x-forwarded-host': 'www.duxtur.org, proxy.internal' }))).toBe('www.duxtur.org');
    expect(servingHostOf(new Headers({ host: 'duxtur.org' }))).toBe('duxtur.org');
  });

  it('builds the fix with placeholders only', () => {
    const fix = setWebhookFix('www.duxtur.org');
    expect(fix.curl).toContain(`url=${expectedWebhookUrl('www.duxtur.org')}`);
    expect(fix.curl).toContain('<TOKEN>');
    expect(fix.browserUrl).toContain('<EDU_TELEGRAM_BOT_SECRET>');
  });
});

describe('logWebhookState', () => {
  it('logs "broken" at warn level with the problems and the exact fix when the webhook is on the redirecting host', async () => {
    stubTelegram({ url: 'https://duxtur.org/api/edu-auth/telegram/webhook', pending_update_count: 0 });
    await logWebhookState('req1', 'www.duxtur.org');
    const [line] = lines();
    expect(line.status).toBe('broken');
    expect(line.registeredUrl).toBe('https://duxtur.org/api/edu-auth/telegram/webhook');
    expect(line.expectedUrl).toBe(WWW_URL);
    expect(String((line.problems as string[])[0])).toContain('does not follow redirects');
    expect(JSON.stringify(line.fix)).toContain(`url=${WWW_URL}`);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('logs "ok" at info level when everything matches', async () => {
    stubTelegram({ url: WWW_URL, pending_update_count: 0 });
    await logWebhookState('req1', 'www.duxtur.org');
    expect(lines()[0].status).toBe('ok');
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('never writes the bot token or the secret to the logs', async () => {
    stubTelegram({ url: '', pending_update_count: 0 });
    await logWebhookState('req1', 'www.duxtur.org');
    expect(logs.join('\n')).not.toContain('VERY_SECRET_BOT_TOKEN');
  });

  it('reports a rejected bot token with Telegram\'s description, at error level', async () => {
    stubTelegram({ ok: false, error_code: 401, description: 'Unauthorized' });
    await logWebhookState('req1', 'www.duxtur.org');
    const [line] = lines();
    expect(line.status).toBe('error');
    expect(line.telegramErrorCode).toBe(401);
    expect(String(line.hint)).toContain('@BotFather');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('reports a network failure without leaking the token that is inside the request URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error(`fetch failed: https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`); }));
    await logWebhookState('req1', 'www.duxtur.org');
    const [line] = lines();
    expect(line.status).toBe('error');
    expect(logs.join('\n')).not.toContain('VERY_SECRET_BOT_TOKEN');
  });

  it('says so when the bot token is not configured, without calling Telegram', async () => {
    delete process.env.EDU_TELEGRAM_BOT_TOKEN;
    const fn = stubTelegram({ url: WWW_URL });
    await logWebhookState('req1', 'www.duxtur.org');
    expect(lines()[0].status).toBe('skipped');
    expect(fn).not.toHaveBeenCalled();
  });

  it('asks Telegram at most once per 5 minutes per instance', async () => {
    const fn = stubTelegram({ url: WWW_URL });
    const t0 = 1_000_000;
    await logWebhookState('a', 'www.duxtur.org', t0);
    await logWebhookState('b', 'www.duxtur.org', t0 + 60_000);
    expect(fn).toHaveBeenCalledTimes(1);
    await logWebhookState('c', 'www.duxtur.org', t0 + 5 * 60_000 + 1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stays silent on preview deployments', async () => {
    process.env.VERCEL_ENV = 'preview';
    const fn = stubTelegram({ url: '' });
    await logWebhookState('req1', 'duxtur-portal-git-x.vercel.app');
    expect(fn).not.toHaveBeenCalled();
    expect(lines()).toHaveLength(0);
  });
});
