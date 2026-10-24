import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

/**
 * Who is calling an article API, and which articles they may touch.
 *
 * - `admin`: the super admin. Any article, and their edits stay published.
 * - `doctor`: an approved doctor. Only their own articles, and an edit sends the article back to moderation.
 * - `denied`: everybody else, with the HTTP status to answer.
 */
export type ArticleActor =
  | { kind: 'admin' }
  | { kind: 'doctor'; doctorId: unknown }
  | { kind: 'denied'; status: 401 | 403 | 404; error: string };

export async function getArticleActor(): Promise<ArticleActor> {
  const session = await auth();
  if (!session?.user?.email) return { kind: 'denied', status: 401, error: 'Unauthorized' };

  if ((session.user as { role?: string }).role === 'portal_admin') return { kind: 'admin' };

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return { kind: 'denied', status: 404, error: 'Пользователь не найден' };

  const doctor = await Doctor.findOne({ userId: user._id });
  if (!doctor) return { kind: 'denied', status: 403, error: 'Нет доступа' };
  if (doctor.status !== 'approved') return { kind: 'denied', status: 403, error: 'Doctor not approved' };

  return { kind: 'doctor', doctorId: doctor._id };
}
