import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const { success } = await rateLimit(ip, 30, 60 * 1000); // 30 per minute
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const cookieName = `viewed_${slug}`;

    if (cookieStore.has(cookieName)) {
      return NextResponse.json({ message: 'Already viewed' }, { status: 200 });
    }

    await dbConnect();
    const article = await Article.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Устанавливаем куку на 24 часа
    cookieStore.set(cookieName, 'true', {
      maxAge: 60 * 60 * 24,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return NextResponse.json({ views: article.views }, { status: 200 });
  } catch (error) {
    console.error('View increment error:', error);
    Sentry.captureException(error); console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
