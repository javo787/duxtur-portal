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

export const dynamic = 'force-dynamic';

// Webhook of the Duxtur Edu login bot (@duxtur_bot). Register it with setWebhook
// (url = https://duxtur.org/api/edu-auth/telegram/webhook, secret_token = EDU_TELEGRAM_BOT_SECRET).
export async function POST(req: NextRequest) {
  if (!isValidWebhookSecret(req.headers.get('X-Telegram-Bot-Api-Secret-Token'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await req.json();
    const message = update?.message;
    const callbackQuery = update?.callback_query;

    const actorId = message?.from?.id ?? callbackQuery?.from?.id;
    if (actorId) {
      const { success } = await rateLimit(`edu_tg_bot_${actorId}`, 30, 60 * 1000);
      if (!success) return NextResponse.json({ ok: true }); // Telegram must always get a 2xx
    }

    // 1) "/start login_<token>" -> ask for confirmation
    const loginToken = parseLoginStart(message?.text);
    if (loginToken && message?.chat?.type === 'private') {
      if (await isPendingLogin(loginToken)) {
        await callEduBot('sendMessage', {
          chat_id: message.chat.id,
          text:
            '🔐 Вход в Duxtur Edu\n\nЕсли вы только что нажали «Войти через Telegram» на сайте duxtur.org/edu — подтвердите вход.\nЕсли это были не вы, просто проигнорируйте это сообщение.',
          reply_markup: {
            inline_keyboard: [[{ text: '✅ Подтвердить вход', callback_data: `${CALLBACK_PREFIX}${loginToken}` }]],
          },
        });
      } else {
        await callEduBot('sendMessage', {
          chat_id: message.chat.id,
          text: 'Ссылка для входа устарела. Вернитесь на сайт и нажмите «Войти через Telegram» ещё раз.',
        });
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
      await callEduBot('answerCallbackQuery', {
        callback_query_id: callbackQuery.id,
        text: approved ? 'Вход подтверждён' : 'Ссылка устарела',
      });
      await callEduBot('editMessageText', {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id,
        text: approved
          ? '✅ Вход подтверждён. Вернитесь на сайт — вход выполнится автоматически.'
          : '⌛ Ссылка для входа устарела. Начните вход на сайте заново.',
      });
      return NextResponse.json({ ok: true });
    }

    // 3) Anything else sent to the bot directly
    if (message?.chat?.type === 'private' && typeof message.text === 'string') {
      await callEduBot('sendMessage', {
        chat_id: message.chat.id,
        text: 'Это бот входа в Duxtur Edu. Чтобы войти, откройте duxtur.org/edu и нажмите «Войти через Telegram».',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error('[edu-bot webhook]', error);
    return NextResponse.json({ ok: true }); // never make Telegram retry-storm
  }
}
