import 'server-only';
import type { Model } from 'mongoose';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import Clinic from '@/models/Clinic';

/** How many days the dashboard sparklines show. */
export const TREND_DAYS = 14;
const TIME_ZONE = 'Asia/Dushanbe';

const dayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

/** New documents per day for the last `TREND_DAYS` days (oldest first), zero-filled. */
async function perDay(model: Model<any>, match: Record<string, unknown> = {}): Promise<number[]> {
  const now = Date.now();
  const since = new Date(now - TREND_DAYS * 86_400_000);
  const rows = await model.aggregate<{ _id: string; n: number }>([
    { $match: { ...match, createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIME_ZONE } }, n: { $sum: 1 } } },
  ]);
  const byDay = new Map(rows.map(r => [r._id, r.n]));
  return Array.from({ length: TREND_DAYS }, (_, i) => byDay.get(dayKey(new Date(now - (TREND_DAYS - 1 - i) * 86_400_000))) ?? 0);
}

export interface PortalTrends {
  users: number[];
  doctors: number[];
  articles: number[];
  clinics: number[];
}

const EMPTY = Array.from({ length: TREND_DAYS }, () => 0);

export async function getPortalTrends(): Promise<PortalTrends> {
  try {
    const [users, doctors, articles, clinics] = await Promise.all([
      perDay(User),
      perDay(Doctor, { isEditorial: { $ne: true } }),
      perDay(Article),
      perDay(Clinic),
    ]);
    return { users, doctors, articles, clinics };
  } catch (error) {
    console.error('getPortalTrends error:', error);
    return { users: EMPTY, doctors: EMPTY, articles: EMPTY, clinics: EMPTY };
  }
}

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
