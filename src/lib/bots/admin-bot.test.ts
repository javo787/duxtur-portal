import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ rateLimit: vi.fn(), dbConnect: vi.fn(), findDoctor: vi.fn(), findAppointments: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: h.rateLimit }));
vi.mock('@/lib/mongodb', () => ({ default: h.dbConnect }));
vi.mock('@/models/Doctor', () => ({ default: { findOne: h.findDoctor } }));
vi.mock('@/models/Appointment', () => ({ default: { find: h.findAppointments } }));

import { handleAdminBotUpdate, isAdminWebhookAuthorized } from './admin-bot';

describe('isAdminWebhookAuthorized', () => {
  it('accepts the secret from the Telegram header or, for old registrations, from ?secret=', () => {
    expect(isAdminWebhookAuthorized('s3cret', null, 's3cret')).toBe(true);
    expect(isAdminWebhookAuthorized(null, 's3cret', 's3cret')).toBe(true);
  });

  it('rejects wrong, missing and different-length secrets', () => {
    expect(isAdminWebhookAuthorized('nope', null, 's3cret')).toBe(false);
    expect(isAdminWebhookAuthorized('s3cret-and-more', null, 's3cret')).toBe(false);
    expect(isAdminWebhookAuthorized(null, null, 's3cret')).toBe(false);
  });

  it('fails closed when the secret is not configured', () => {
    expect(isAdminWebhookAuthorized('anything', null, undefined)).toBe(false);
    expect(isAdminWebhookAuthorized('', null, '')).toBe(false);
  });
});

describe('handleAdminBotUpdate', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot-token');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(new Response('{}'));
    h.rateLimit.mockResolvedValue({ success: true });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const sentText = () => JSON.parse(fetchMock.mock.calls[0][1].body as string).text as string;

  it('greets on /start', async () => {
    expect(await handleAdminBotUpdate({ message: { text: '/start', chat: { id: 42 } } })).toBe('ok');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.telegram.org/botbot-token/sendMessage');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ chat_id: 42 });
    expect(sentText()).toContain('Добро пожаловать в Duxtur Bot');
  });

  it('tells an unknown chat it is not a registered doctor', async () => {
    h.findDoctor.mockResolvedValue(null);
    await handleAdminBotUpdate({ message: { text: '/appointments', chat: { id: 7 } } });
    expect(h.findDoctor).toHaveBeenCalledWith({ telegramChatId: 7 });
    expect(sentText()).toBe('Вы не зарегистрированы как врач.');
  });

  it("lists the doctor's appointments for today", async () => {
    h.findDoctor.mockResolvedValue({ _id: 'doc1' });
    h.findAppointments.mockResolvedValue([{ timeSlot: '10:00', patientName: 'Анна' }, { timeSlot: '11:30', patientName: 'Бахтиёр' }]);
    await handleAdminBotUpdate({ message: { text: '/appointments', chat: { id: 7 } } });
    expect(h.findAppointments.mock.calls[0][0]).toMatchObject({ doctorId: 'doc1' });
    expect(sentText()).toBe('📅 Записи на сегодня:\n• 10:00 - Анна\n• 11:30 - Бахтиёр\n');
  });

  it('stops at the rate limit before touching the database or Telegram', async () => {
    h.rateLimit.mockResolvedValue({ success: false });
    expect(await handleAdminBotUpdate({ message: { text: '/start', chat: { id: 1 } } })).toBe('rate_limited');
    expect(h.rateLimit).toHaveBeenCalledWith('telegram_1', 30, 60_000);
    expect(h.dbConnect).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores other messages', async () => {
    expect(await handleAdminBotUpdate({ message: { text: 'hello', chat: { id: 1 } } })).toBe('ok');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
