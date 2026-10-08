import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { parseReviewInput } from '@/lib/reviews';
import { ReviewTarget, createReview } from '@/lib/review-service';

/**
 * POST of a review, the same for doctors, clinics and articles: who may write, how often, what is accepted.
 * The answers carry a short `error` code the review form turns into a sentence in the visitor's language.
 */
export async function postReview(request: Request, targetFrom: (body: Record<string, unknown>) => ReviewTarget | null): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  // Only a flood guard: a whole group at one university shares an address. The limit that matters is per person, below.
  const byIp = await rateLimit(`review_ip_${ip}`, 30, 60 * 1000);
  if (!byIp.success) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'auth_required' }, { status: 401 });

  // A person writes a handful of reviews at a time at most, however many addresses they use.
  const byUser = await rateLimit(`review_user_${userId}`, 5, 10 * 60 * 1000);
  if (!byUser.success) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const input = parseReviewInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

  const target = targetFrom(body as Record<string, unknown>);
  if (!target) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  try {
    const result = await createReview(target, userId, input.value);
    if (result.ok) return NextResponse.json({ success: true }, { status: 201 });
    const status = { no_user: 401, not_found: 404, own: 403, duplicate: 409 }[result.code];
    return NextResponse.json({ error: result.code === 'no_user' ? 'auth_required' : result.code }, { status });
  } catch (error) {
    console.error('Review submission error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
