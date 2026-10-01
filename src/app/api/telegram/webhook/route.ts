import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';
import { approveLogin, isPendingLogin, parseLoginCallback, parseLoginStart, CALLBACK_PREFIX } from '@/lib/edu-telegram-login';

export async function POST(req: NextRequest) {
  const secretFromHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  const secretFromQuery = req.nextUrl.searchParams.get('secret');
  const secret = secretFromHeader || secretFromQuery;

  if (secret !== process.env.TELEGRAM_BOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message, callback_query } = body;
    const text = message?.text;
    const chatId = message?.chat?.id || callback_query?.from?.id;

    if (chatId) {
      const { success } = await rateLimit(`telegram_${chatId}`, 30, 60 * 1000); // 30 per minute per chatId
      if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    await dbConnect();

    // ── Duxtur Edu: sign-in confirmation (private chats only) ──────────────────
    const loginToken = parseLoginStart(text);
    if (loginToken && message?.chat?.type === 'private') {
      if (await isPendingLogin(loginToken)) {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: '🔐 Вход в Duxtur Edu\n\nЕсли вы только что нажали «Войти через Telegram» на сайте duxtur.org/edu — подтвердите вход.\nЕсли это были не вы, просто проигнорируйте сообщение.',
          reply_markup: { inline_keyboard: [[{ text: '✅ Подтвердить вход', callback_data: `${CALLBACK_PREFIX}${loginToken}` }]] },
        });
      } else {
        await sendReply(chatId, 'Ссылка для входа устарела. Вернитесь на сайт и нажмите «Войти через Telegram» ещё раз.');
      }
      return NextResponse.json({ ok: true });
    }

    const loginCallbackToken = parseLoginCallback(callback_query?.data);
    if (loginCallbackToken && callback_query?.from && callback_query.message?.chat?.type === 'private') {
      const from = callback_query.from;
      const approved = await approveLogin(loginCallbackToken, {
        id: from.id,
        firstName: from.first_name || '',
        lastName: from.last_name || undefined,
        username: from.username || undefined,
      });
      await callTelegram('answerCallbackQuery', {
        callback_query_id: callback_query.id,
        text: approved ? 'Вход подтверждён' : 'Ссылка устарела',
      });
      await callTelegram('editMessageText', {
        chat_id: callback_query.message.chat.id,
        message_id: callback_query.message.message_id,
        text: approved
          ? '✅ Вход подтверждён. Вернитесь на сайт — вход выполнится автоматически.'
          : '⌛ Ссылка для входа устарела. Начните вход на сайте заново.',
      });
      return NextResponse.json({ ok: true });
    }

    if (text === '/start') {
      await sendReply(chatId, "Добро пожаловать в Duxtur Bot! 🩺\nИспользуйте /appointments для просмотра записей.");
    } else if (text === '/appointments') {
      const doctor = await Doctor.findOne({ telegramChatId: chatId }); // Assume we store this
      if (!doctor) {
        await sendReply(chatId, "Вы не зарегистрированы как врач.");
      } else {
        const today = new Date();
        const appointments = await Appointment.find({
          doctorId: doctor._id,
          date: { $gte: new Date(today.setHours(0,0,0,0)), $lt: new Date(today.setHours(23,59,59,999)) }
        });
        let msg = "📅 Записи на сегодня:\n";
        appointments.forEach(a => msg += `• ${a.timeSlot} - ${a.patientName}\n`);
        await sendReply(chatId, msg || "Записей на сегодня нет.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    Sentry.captureException(error); console.error(error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function sendReply(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

async function callTelegram(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error(`[telegram] ${method} failed with status ${res.status}`);
}
