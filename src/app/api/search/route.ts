import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';
import { escapeRegExp } from '@/lib/utils/string';
import { normalizeQuery, SEARCH_LANGS } from '@/lib/search-text';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    // What comes from the URL is never trusted: the text is cleaned and cut, the language must be one of ours
    // (it becomes part of a field name), and the text goes into a pattern only after it is escaped.
    const q = normalizeQuery(searchParams.get('q'));
    const type = searchParams.get('type') || 'all';
    const rawLang = searchParams.get('lang') || 'ru';
    const lang = (SEARCH_LANGS as readonly string[]).includes(rawLang) ? rawLang : 'ru';
    const pattern = escapeRegExp(q);

    if (!q) return NextResponse.json({ articles: [], doctors: [] });

    let articles: unknown[] = [];
    let doctors: unknown[] = [];

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
  } catch (error) {
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
