import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';

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
