import { rateLimit } from '@/lib/rate-limit';
import { approveLogin, pendingLoginInfo, parseLoginCallback, parseLoginStart, CALLBACK_PREFIX } from '@/lib/edu-telegram-login';
import { callEduBot } from '@/lib/edu-telegram-bot';
import { confirmationMessage } from '@/lib/edu-bot-messages';
import { eduLog, maskRef } from '@/lib/edu-log';

/**
 * Logic of the Duxtur Edu login bot (@duxtur_bot), independent of any web framework.
 *
 * It is called from two places that must behave identically: the Next.js route on Vercel
 * (api/edu-auth/telegram/webhook) and the Render service (services/render-service). The caller checks the webhook
 * secret and always answers Telegram with a 2xx, whatever happens in here.
 */

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type?: string;
}

export interface TelegramUpdate {
  update_id?: number;
  message?: { text?: string; chat?: TelegramChat; from?: TelegramUser };
  callback_query?: {
    id: string;
    data?: string;
    from?: TelegramUser;
    message?: { message_id: number; chat?: TelegramChat };
  };
  [key: string]: unknown;
}

export async function handleEduBotUpdate(update: TelegramUpdate | null | undefined, reqId: string, startedAt: number = Date.now()): Promise<void> {
  const message = update?.message;
  const callbackQuery = update?.callback_query;

  eduLog('webhook', reqId, 'webhook:received', {
    updateId: update?.update_id ?? null,
    kind: message ? 'message' : callbackQuery ? 'callback_query' : Object.keys(update ?? {}).filter((k) => k !== 'update_id').join(',') || 'empty',
    chatType: message?.chat?.type ?? callbackQuery?.message?.chat?.type ?? null,
    textKind: typeof message?.text === 'string' ? (message.text.startsWith('/start') ? 'start-command' : 'text') : null,
  });

  const actorId = message?.from?.id ?? callbackQuery?.from?.id;
  if (actorId) {
    const { success } = await rateLimit(`edu_tg_bot_${actorId}`, 30, 60 * 1000);
    if (!success) {
      eduLog('webhook', reqId, 'webhook:rate-limited', { actorSuffix: String(actorId).slice(-3) }, 'warn');
      return;
    }
  }

  // 1) "/start login_<token>" -> ask for confirmation
  const loginToken = parseLoginStart(message?.text);
  if (loginToken && message?.chat?.type === 'private') {
    const pending = await pendingLoginInfo(loginToken);
    eduLog('webhook', reqId, 'webhook:start-login', {
      tokenRef: maskRef(loginToken),
      pending: !!pending,
      purpose: pending?.purpose ?? null,
      meaning: pending ? 'asking the user to confirm' : 'token unknown or expired (5 min): user is told the link is outdated',
    }, pending ? 'info' : 'warn');
    if (pending) {
      const confirm = confirmationMessage(pending.purpose, pending.requestHint);
      await callEduBot('sendMessage', {
        chat_id: message.chat.id,
        text: confirm.text,
        reply_markup: {
          inline_keyboard: [[{ text: confirm.button, callback_data: `${CALLBACK_PREFIX}${loginToken}` }]],
        },
      }, reqId);
    } else {
      await callEduBot('sendMessage', {
        chat_id: message.chat.id,
        text: 'Ссылка для входа устарела. Вернитесь на сайт и нажмите «Войти через Telegram» ещё раз.',
      }, reqId);
    }
    return;
  }

  // 2) Confirmation button pressed
  const approveToken = parseLoginCallback(callbackQuery?.data);
  if (approveToken && callbackQuery?.from && callbackQuery.message?.chat?.type === 'private') {
    const from = callbackQuery.from;
    const approved = await approveLogin(approveToken, {
      id: from.id,
      firstName: from.first_name || '',
      lastName: from.last_name || undefined,
      username: from.username || undefined,
    });
    eduLog('webhook', reqId, 'webhook:approve-pressed', {
      tokenRef: maskRef(approveToken),
      approved,
      meaning: approved ? 'login marked approved: the polling page can now receive its custom token' : 'token unknown, expired (5 min) or already approved',
    }, approved ? 'info' : 'warn');
    await callEduBot('answerCallbackQuery', {
      callback_query_id: callbackQuery.id,
      text: approved ? 'Вход подтверждён' : 'Ссылка устарела',
    }, reqId);
    await callEduBot('editMessageText', {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      text: approved
        ? '✅ Вход подтверждён. Вернитесь на сайт — вход выполнится автоматически.'
        : '⌛ Ссылка для входа устарела. Начните вход на сайте заново.',
    }, reqId);
    return;
  }

  // 3) Anything else sent to the bot directly
  if (message?.chat?.type === 'private' && typeof message.text === 'string') {
    await callEduBot('sendMessage', {
      chat_id: message.chat.id,
      text: 'Это бот входа в Duxtur. Чтобы войти, откройте duxtur.org (или duxtur.org/edu) и нажмите «Войти через Telegram».',
    }, reqId);
    eduLog('webhook', reqId, 'webhook:generic-reply', {});
  } else if (!loginToken && !approveToken) {
    eduLog('webhook', reqId, 'webhook:ignored', { reason: 'not a private text message, login start or confirmation' });
  }

  eduLog('webhook', reqId, 'webhook:done', { tookMs: Date.now() - startedAt });
}
