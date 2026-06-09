import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const lang = searchParams.get('lang') || 'ru';

    if (!q) return NextResponse.json({ articles: [], doctors: [] });

    let articles: any[] = [];
    let doctors: any[] = [];

    if (type === 'all' || type === 'articles') {
      articles = await Article.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
      .hint({ $**: 'text' }) // Hint to use the text index
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .populate('authorId', 'name image specialty slug')
      .lean();

      if (articles.length === 0) {
        articles = await Article.find({
          $or: [
            { [`title.${lang}`]: { $regex: q, $options: 'i' } },
            { [`overview.${lang}`]: { $regex: q, $options: 'i' } }
          ]
        }).limit(10).populate('authorId', 'name image specialty slug').lean();
      }
    }

    if (type === 'all' || type === 'doctors') {
      doctors = await Doctor.find(
        { status: 'approved', $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
      .hint({ $**: 'text' }) // Hint to use the text index
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .lean();

      if (doctors.length === 0) {
        doctors = await Doctor.find({
          status: 'approved',
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { city: { $regex: q, $options: 'i' } }
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
