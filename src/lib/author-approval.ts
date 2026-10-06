import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { publishDraftsOf } from '@/lib/author-articles';
import { callEduBot } from '@/lib/edu-telegram-bot';

/**
 * What follows the team approving a doctor:
 *  - an account that came to write as a patient becomes a doctor account (the cabinet opens for it);
 *  - the articles that waited for the check go live;
 *  - a person who signed in with Telegram (no real e-mail to write to) hears about it in the bot.
 *
 * Safe to run twice: the role is only moved from "patient", and a draft is taken out before it is published.
 */
export async function afterDoctorApproved(doctorId: string): Promise<{ published: number }> {
  await dbConnect();
  const doctor = (await Doctor.findById(doctorId).select('userId status').lean()) as
    | { _id: unknown; userId?: unknown; status?: string }
    | null;
  if (!doctor?.userId || doctor.status !== 'approved') return { published: 0 };

  await User.updateOne({ _id: doctor.userId, role: 'patient' }, { $set: { role: 'doctor' } });

  const slugs = await publishDraftsOf(doctor.userId, doctor._id);

  const user = (await User.findById(doctor.userId).select('telegramId').lean()) as { telegramId?: number | null } | null;
  if (user?.telegramId) {
    const text =
      slugs.length > 0
        ? `✅ Ваш профиль врача на duxtur.org подтверждён. Опубликовано статей: ${slugs.length}.`
        : '✅ Ваш профиль врача на duxtur.org подтверждён. Теперь статьи публикуются сразу.';
    await callEduBot('sendMessage', { chat_id: user.telegramId, text });
  }
  return { published: slugs.length };
}
