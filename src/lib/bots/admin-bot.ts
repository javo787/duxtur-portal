import { timingSafeEqual } from 'node:crypto';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Logic of the admin/doctor bot (TELEGRAM_BOT_TOKEN): /start and /appointments. Framework-independent, shared by the
 * Next.js route (api/telegram/webhook) and the Render service. Outgoing notifications to the admin
 * (src/lib/telegram.ts) are NOT part of this: they are sent by the request handlers that create appointments.
 */

export interface AdminBotUpdate {
  message?: { text?: string; chat?: { id: number | string } };
  callback_query?: { from?: { id: number | string } };
  [key: string]: unknown;
}

/**
 * The webhook secret arrives in the X-Telegram-Bot-Api-Secret-Token header or, for webhooks registered the old way,
 * in ?secret=. Compared in constant time; fails closed when TELEGRAM_BOT_SECRET is not configured.
 */
export function isAdminWebhookAuthorized(headerSecret: string | null, querySecret: string | null, expected: string | undefined = process.env.TELEGRAM_BOT_SECRET): boolean {
  const given = headerSecret || querySecret;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type AdminBotResult = 'ok' | 'rate_limited';

export async function handleAdminBotUpdate(update: AdminBotUpdate): Promise<AdminBotResult> {
  const { message, callback_query } = update;
  const text = message?.text;
  const chatId = message?.chat?.id || callback_query?.from?.id;

  if (chatId) {
    const { success } = await rateLimit(`telegram_${chatId}`, 30, 60 * 1000); // 30 per minute per chatId
    if (!success) return 'rate_limited';
  }

  await dbConnect();

  if (text === '/start') {
    await sendReply(chatId, 'Добро пожаловать в Duxtur Bot! 🩺\nИспользуйте /appointments для просмотра записей.');
  } else if (text === '/appointments') {
    const doctor = await Doctor.findOne({ telegramChatId: chatId }); // Assume we store this
    if (!doctor) {
      await sendReply(chatId, 'Вы не зарегистрированы как врач.');
    } else {
      const today = new Date();
      const appointments = await Appointment.find({
        doctorId: doctor._id,
        date: { $gte: new Date(today.setHours(0, 0, 0, 0)), $lt: new Date(today.setHours(23, 59, 59, 999)) },
      });
      let msg = '📅 Записи на сегодня:\n';
      appointments.forEach((a) => (msg += `• ${a.timeSlot} - ${a.patientName}\n`));
      await sendReply(chatId, msg || 'Записей на сегодня нет.');
    }
  }

  return 'ok';
}

async function sendReply(chatId: number | string | undefined, text: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
