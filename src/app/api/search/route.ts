import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';
import { escapeRegExp } from '@/lib/utils/string';
import { i18n } from '@/i18n-config';

/** Longest query we search for; anything beyond is cut so a huge `q` cannot become a huge regex or text scan. */
const MAX_QUERY_LENGTH = 100;

export async function GET(req: NextRequest) {
  // x-forwarded-for is "client, proxy1, proxy2": the rate limit key must be the client alone
  const ip = (req.headers.get('x-forwarded-for') || 'anonymous').split(',')[0].trim();
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim().slice(0, MAX_QUERY_LENGTH);
    const type = searchParams.get('type') || 'all';
    // `lang` becomes part of a field path (title.<lang>), so only known locales are allowed
    const requestedLang = searchParams.get('lang') || 'ru';
    const lang = (i18n.locales as readonly string[]).includes(requestedLang) ? requestedLang : 'ru';

    if (!q) return NextResponse.json({ articles: [], doctors: [] });

    // The query is user text, not a pattern: escape it before it reaches $regex
    const pattern = escapeRegExp(q);

    let articles: any[] = [];
    let doctors: any[] = [];

    if (type === 'all' || type === 'articles') {
      articles = await Article.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
      .hint({ _fts: 'text' }) // Hint to use the text index
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .populate('authorId', 'name image specialty slug')
      .lean();

      if (articles.length === 0) {
        articles = await Article.find({
          $or: [
            { [`title.${lang}`]: { $regex: pattern, $options: 'i' } },
            { [`overview.${lang}`]: { $regex: pattern, $options: 'i' } }
          ]
        }).limit(10).populate('authorId', 'name image specialty slug').lean();
      }
    }

    if (type === 'all' || type === 'doctors') {
      doctors = await Doctor.find(
        { status: 'approved', $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
      .hint({ _fts: 'text' }) // Hint to use the text index
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .lean();

      if (doctors.length === 0) {
        doctors = await Doctor.find({
          status: 'approved',
          $or: [
            { name: { $regex: pattern, $options: 'i' } },
            { city: { $regex: pattern, $options: 'i' } }
          ]
        }).limit(10).lean();
      }
    }

    return NextResponse.json({
      articles,
      doctors,
      totalArticles: articles.length,
      totalDoctors: doctors.length
    });
  } catch (error: any) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
