import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const isPendingLogin = vi.fn();
const approveLogin = vi.fn();
const callEduBot = vi.fn();

// edu-telegram-login imports these at load time; the real ones need MONGODB_URI.
vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/TelegramLogin', () => ({ default: {} }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn().mockResolvedValue({ success: true, count: 1 }) }));
vi.mock('@/lib/edu-telegram-bot', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-telegram-bot')>('@/lib/edu-telegram-bot');
  return { ...actual, callEduBot: (...a: unknown[]) => callEduBot(...a) };
});
vi.mock('@/lib/edu-telegram-login', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edu-telegram-login')>('@/lib/edu-telegram-login');
  return {
    ...actual,
    isPendingLogin: (...a: unknown[]) => isPendingLogin(...a),
    approveLogin: (...a: unknown[]) => approveLogin(...a),
  };
});

import { POST } from './route';

const TOKEN = 'c'.repeat(32);
const SECRET = 'test-secret_123';

function call(body: unknown, secret: string | null = SECRET) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret !== null) headers['X-Telegram-Bot-Api-Secret-Token'] = secret;
  return POST(
    new NextRequest('https://duxtur.org/api/edu-auth/telegram/webhook', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  );
}

const privateMsg = (text: string) => ({
  message: { text, chat: { id: 77, type: 'private' }, from: { id: 77, first_name: 'Ali' } },
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.EDU_TELEGRAM_BOT_SECRET = SECRET;
});

describe('edu bot webhook', () => {
  it('rejects requests without the correct secret', async () => {
    expect((await call(privateMsg('/start'), null)).status).toBe(401);
    expect((await call(privateMsg('/start'), 'wrong-secret')).status).toBe(401);
    expect(callEduBot).not.toHaveBeenCalled();
  });

  it('fails closed when the secret is not configured', async () => {
    delete process.env.EDU_TELEGRAM_BOT_SECRET;
    expect((await call(privateMsg('/start'), 'anything')).status).toBe(401);
  });

  it('asks for confirmation on /start login_<token>', async () => {
    isPendingLogin.mockResolvedValue(true);
    const res = await call(privateMsg(`/start login_${TOKEN}`));
    expect(res.status).toBe(200);
    const [method, payload] = callEduBot.mock.calls[0];
    expect(method).toBe('sendMessage');
    expect(payload.chat_id).toBe(77);
    expect(payload.reply_markup.inline_keyboard[0][0].callback_data).toBe(`el:${TOKEN}`);
    expect(approveLogin).not.toHaveBeenCalled(); // /start alone never approves
  });

  it('says the link is stale when the login is not pending', async () => {
    isPendingLogin.mockResolvedValue(false);
    await call(privateMsg(`/start login_${TOKEN}`));
    expect(callEduBot.mock.calls[0][1].text).toContain('устарела');
    expect(callEduBot.mock.calls[0][1].reply_markup).toBeUndefined();
  });

  it('ignores login deep links outside private chats', async () => {
    const body = { message: { text: `/start login_${TOKEN}`, chat: { id: -5, type: 'group' }, from: { id: 1, first_name: 'X' } } };
    await call(body);
    expect(isPendingLogin).not.toHaveBeenCalled();
  });

  it('approves with the Telegram identity of whoever pressed the button', async () => {
    approveLogin.mockResolvedValue(true);
    const res = await call({
      callback_query: {
        id: 'cb1',
        data: `el:${TOKEN}`,
        from: { id: 555, first_name: 'Ali', last_name: 'Karimov', username: 'ali_k' },
        message: { message_id: 9, chat: { id: 555, type: 'private' } },
      },
    });
    expect(res.status).toBe(200);
    expect(approveLogin).toHaveBeenCalledWith(TOKEN, { id: 555, firstName: 'Ali', lastName: 'Karimov', username: 'ali_k' });
    const methods = callEduBot.mock.calls.map(c => c[0]);
    expect(methods).toEqual(['answerCallbackQuery', 'editMessageText']);
  });

  it('does not approve malformed callback data', async () => {
    await call({
      callback_query: { id: 'cb', data: 'el:not-a-token', from: { id: 1, first_name: 'A' }, message: { message_id: 1, chat: { id: 1, type: 'private' } } },
    });
    expect(approveLogin).not.toHaveBeenCalled();
  });

  it('replies with a hint to other private messages and still returns 200', async () => {
    const res = await call(privateMsg('hello'));
    expect(res.status).toBe(200);
    expect(callEduBot.mock.calls[0][1].text).toContain('duxtur.org/edu');
  });
});
