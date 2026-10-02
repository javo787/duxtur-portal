import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import {
  approveLogin,
  isPendingLogin,
  parseLoginCallback,
  parseLoginStart,
  CALLBACK_PREFIX,
} from '@/lib/edu-telegram-login';
import { callEduBot, isValidWebhookSecret } from '@/lib/edu-telegram-bot';
import { describeError, eduLog, maskRef, newReqId, requestFacts } from '@/lib/edu-log';

export const dynamic = 'force-dynamic';

// Webhook of the Duxtur Edu login bot (@duxtur_bot). Register it with setWebhook
// (url = https://<serving host>/api/edu-auth/telegram/webhook, secret_token = EDU_TELEGRAM_BOT_SECRET).
// Use the host that answers WITHOUT a redirect (www.duxtur.org in production): Telegram does not follow redirects.
// GET /api/edu-auth/telegram/health shows the registered URL and the exact command to fix it.
export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const startedAt = Date.now();

  const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!isValidWebhookSecret(secretHeader)) {
    // Telegram retries 401s, so a wrong secret shows up as a burst of these lines.
    eduLog('webhook', reqId, 'webhook:unauthorized', {
      hasSecretHeader: !!secretHeader,
      secretConfigured: !!process.env.EDU_TELEGRAM_BOT_SECRET,
      ...requestFacts(req),
      hint: !process.env.EDU_TELEGRAM_BOT_SECRET
        ? 'EDU_TELEGRAM_BOT_SECRET is not set on Vercel: every update is rejected'
        : !secretHeader
          ? 'request has no X-Telegram-Bot-Api-Secret-Token: not from Telegram, or setWebhook was called without secret_token'
          : 'header differs from EDU_TELEGRAM_BOT_SECRET: re-run setWebhook with the same secret_token',
    }, 'warn');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await req.json();
    const message = update?.message;
    const callbackQuery = update?.callback_query;

    eduLog('webhook', reqId, 'webhook:received', {
      updateId: update?.update_id ?? null,
      kind: message ? 'message' : callbackQuery ? 'callback_query' : Object.keys(update ?? {}).filter(k => k !== 'update_id').join(',') || 'empty',
      chatType: message?.chat?.type ?? callbackQuery?.message?.chat?.type ?? null,
      textKind: typeof message?.text === 'string' ? (message.text.startsWith('/start') ? 'start-command' : 'text') : null,
    });

    const actorId = message?.from?.id ?? callbackQuery?.from?.id;
    if (actorId) {
      const { success } = await rateLimit(`edu_tg_bot_${actorId}`, 30, 60 * 1000);
      if (!success) {
        eduLog('webhook', reqId, 'webhook:rate-limited', { actorSuffix: String(actorId).slice(-3) }, 'warn');
        return NextResponse.json({ ok: true }); // Telegram must always get a 2xx
      }
    }

    // 1) "/start login_<token>" -> ask for confirmation
    const loginToken = parseLoginStart(message?.text);
    if (loginToken && message?.chat?.type === 'private') {
      const pending = await isPendingLogin(loginToken);
      eduLog('webhook', reqId, 'webhook:start-login', {
        tokenRef: maskRef(loginToken),
        pending,
        meaning: pending ? 'asking the user to confirm' : 'token unknown or expired (5 min): user is told the link is outdated',
      }, pending ? 'info' : 'warn');
      if (pending) {
        await callEduBot('sendMessage', {
          chat_id: message.chat.id,
          text:
            '🔐 Вход в Duxtur Edu\n\nЕсли вы только что нажали «Войти через Telegram» на сайте duxtur.org/edu — подтвердите вход.\nЕсли это были не вы, просто проигнорируйте это сообщение.',
          reply_markup: {
            inline_keyboard: [[{ text: '✅ Подтвердить вход', callback_data: `${CALLBACK_PREFIX}${loginToken}` }]],
          },
        }, reqId);
      } else {
        await callEduBot('sendMessage', {
          chat_id: message.chat.id,
          text: 'Ссылка для входа устарела. Вернитесь на сайт и нажмите «Войти через Telegram» ещё раз.',
        }, reqId);
      }
      return NextResponse.json({ ok: true });
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
      return NextResponse.json({ ok: true });
    }

    // 3) Anything else sent to the bot directly
    if (message?.chat?.type === 'private' && typeof message.text === 'string') {
      await callEduBot('sendMessage', {
        chat_id: message.chat.id,
        text: 'Это бот входа в Duxtur Edu. Чтобы войти, откройте duxtur.org/edu и нажмите «Войти через Telegram».',
      }, reqId);
      eduLog('webhook', reqId, 'webhook:generic-reply', {});
    } else if (!loginToken && !approveToken) {
      eduLog('webhook', reqId, 'webhook:ignored', { reason: 'not a private text message, login start or confirmation' });
    }

    eduLog('webhook', reqId, 'webhook:done', { tookMs: Date.now() - startedAt });
    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error);
    eduLog('webhook', reqId, 'webhook:error', { ...describeError(error), tookMs: Date.now() - startedAt }, 'error');
    return NextResponse.json({ ok: true }); // never make Telegram retry-storm
  }
}
