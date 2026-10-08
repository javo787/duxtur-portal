import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { listPublicReviews } from '@/lib/review-service';
import { postReview } from '@/lib/review-http';

// Reviews of a doctor (doctorId) or an article (articleId). Clinics have their own address: /api/clinic/[slug]/review.

function pick(value: unknown): string | null {
  return typeof value === 'string' && mongoose.isValidObjectId(value) ? value : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = pick(searchParams.get('doctorId'));
  const articleId = pick(searchParams.get('articleId'));

  if (!doctorId && !articleId) return NextResponse.json({ error: 'Missing doctorId or articleId' }, { status: 400 });

  try {
    const reviews = await listPublicReviews(doctorId ? { doctorId } : { articleId }, {
      page: Number(searchParams.get('page')),
      limit: Number(searchParams.get('limit')),
    });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Reviews fetch error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return postReview(request, body => {
    const doctorId = pick(body.doctorId);
    const articleId = pick(body.articleId);
    // Exactly one subject.
    if (doctorId && !articleId) return { kind: 'doctor', id: doctorId };
    if (articleId && !doctorId) return { kind: 'article', id: articleId };
    return null;
  });
}
