import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { rateLimit } from '@/lib/rate-limit';
import { getArticleActor } from '@/lib/article-access';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const actor = await getArticleActor();
  if (actor.kind === 'denied') {
    return NextResponse.json(actor.status === 401 ? null : { error: actor.error }, { status: actor.status });
  }

  await dbConnect();
  const article = await Article.findOne(actor.kind === 'admin' ? { slug } : { slug, authorId: actor.doctorId }).lean();
  if (!article) return NextResponse.json(null, { status: 404 });

  return NextResponse.json(article);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { slug } = await params;
  const actor = await getArticleActor();
  if (actor.kind === 'denied') {
    return NextResponse.json(actor.status === 401 ? null : { error: actor.error }, { status: actor.status });
  }

  await dbConnect();

  // A doctor edits only their own articles. The super admin edits any article.
  const existing = await Article.findOne(actor.kind === 'admin' ? { slug } : { slug, authorId: actor.doctorId });
  if (!existing) return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });

  const body = await req.json();
  const { language, articleData } = body;
  if (!language || !articleData) {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
  }

  // Обновляем только поля текущего языка
  const update: Record<string, any> = {
    image: articleData.image || existing.image,
    category: articleData.category || existing.category,
    references: Array.isArray(articleData.references) ? articleData.references : existing.references,
    // A doctor's edit goes back to moderation; the super admin's edit keeps the article as it was.
    isVerified: actor.kind === 'admin' ? existing.isVerified : false,
    updatedAt: new Date(),
  };

  const langFields = [
    'title', 'overview',
    'section1_title', 'section1_content',
    'section2_title', 'section2_content',
    'section3_title', 'section3_content',
    'section4_title', 'section4_content',
    'section5_title', 'section5_content',
  ];

  for (const field of langFields) {
    if (articleData[field] !== undefined) {
      update[`${field}.${language}`] = articleData[field];
    }
  }

  // Tags — arrays stored as lang strings
  if (articleData.symptoms) update[`symptoms.${language}`] = articleData.symptoms.join(', ');
  if (articleData.causes) update[`causes.${language}`] = articleData.causes.join(', ');
  if (articleData.treatment) update[`diagnosis_treatment.${language}`] = articleData.treatment.join(', ');

  await Article.updateOne({ slug }, { $set: update });

  return NextResponse.json({ success: true });
}
