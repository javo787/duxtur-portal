import { afterEach, describe, expect, it, vi } from 'vitest';
import { customWebhookUrl, expectedWebhookUrl, setWebhookFix, webhookProblems } from './edu-webhook-state';

afterEach(() => vi.unstubAllEnvs());

describe('EDU_BOT_WEBHOOK_URL', () => {
  it('changes nothing when it is not set', () => {
    vi.stubEnv('EDU_BOT_WEBHOOK_URL', '');
    expect(customWebhookUrl()).toBeNull();
    expect(expectedWebhookUrl('www.duxtur.org')).toBe('https://www.duxtur.org/api/edu-auth/telegram/webhook');
  });

  it('points the check at the Render service once the bot lives there', () => {
    vi.stubEnv('EDU_BOT_WEBHOOK_URL', 'https://duxtur-render.onrender.com/telegram/edu/');
    expect(expectedWebhookUrl('www.duxtur.org')).toBe('https://duxtur-render.onrender.com/telegram/edu');
    expect(setWebhookFix('www.duxtur.org').curl).toContain('url=https://duxtur-render.onrender.com/telegram/edu"');
  });

  it.each(['http://duxtur-render.onrender.com/telegram/edu', 'not a url', 'https://x.test/p?secret=1', 'https://u:p@x.test/p', 'https://x.test/p#frag'])(
    'ignores %j and keeps the default',
    (value) => {
      vi.stubEnv('EDU_BOT_WEBHOOK_URL', value);
      expect(customWebhookUrl()).toBeNull();
      expect(expectedWebhookUrl('www.duxtur.org')).toBe('https://www.duxtur.org/api/edu-auth/telegram/webhook');
    },
  );

  it('reports a webhook registered on Vercel as wrong after the move, with a message that names the variable', () => {
    vi.stubEnv('EDU_BOT_WEBHOOK_URL', 'https://duxtur-render.onrender.com/telegram/edu');
    const problems = webhookProblems({ url: 'https://www.duxtur.org/api/edu-auth/telegram/webhook' }, 'www.duxtur.org');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('EDU_BOT_WEBHOOK_URL');
    expect(problems[0]).not.toContain('redirect');
  });

  it('is happy when the webhook is where the variable says', () => {
    vi.stubEnv('EDU_BOT_WEBHOOK_URL', 'https://duxtur-render.onrender.com/telegram/edu');
    expect(webhookProblems({ url: 'https://duxtur-render.onrender.com/telegram/edu' }, 'www.duxtur.org')).toEqual([]);
  });
});
