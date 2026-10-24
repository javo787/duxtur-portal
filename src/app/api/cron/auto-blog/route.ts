import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { MAX_BODY_BYTES, parsePublishPayload } from '@/lib/auto-blog/payload';
import { DuplicateTopicError, afterPublish, planNext, saveGenerated } from '@/lib/auto-blog/publish';
import { topicByKey } from '@/lib/auto-blog/topics';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Auto-blog endpoint. The slow part (reading sources, writing and translating with Gemini) runs in a GitHub
 * Action (.github/workflows/auto-blog.yml, scripts/auto-blog.ts), which has no 60-second limit. This route is
 * the part that needs the database, and it is called twice per run:
 *
 *   GET  ?force=1&skip=a,b   "is it time, and what should the article be about?"
 *   POST {topicKey, languages, sources}   "here is the finished article, validate and publish it"
 *
 * Both need `Authorization: Bearer $CRON_SECRET`. AUTO_BLOG_ENABLED=false pauses everything without a deploy.
 */

const disabled = () => ['false', '0', 'off'].includes((process.env.AUTO_BLOG_ENABLED ?? '').trim().toLowerCase());

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get('authorization'), process.env.CRON_SECRET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (disabled()) return NextResponse.json({ due: false, reason: 'disabled' });

  const params = req.nextUrl.searchParams;
  const skip = (params.get('skip') ?? '').split(',').map((s) => s.trim()).filter((s) => topicByKey(s));

  try {
    return NextResponse.json(await planNext({ force: params.get('force') === '1', skip }));
  } catch (error) {
    console.error('[AUTO-BLOG] plan failed', error);
    return NextResponse.json({ error: 'plan failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get('authorization'), process.env.CRON_SECRET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (disabled()) return NextResponse.json({ published: false, reason: 'disabled' });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload too large' }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parsePublishPayload(body);
  if (!parsed.ok) return NextResponse.json({ error: 'Validation failed', details: parsed.errors }, { status: 422 });

  try {
    const published = await saveGenerated(parsed.value);
    const after = await afterPublish(parsed.value, published);
    return NextResponse.json({ published: true, ...published, ...after }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateTopicError) {
      return NextResponse.json({ published: false, reason: 'duplicate-topic', topicKey: error.message }, { status: 409 });
    }
    console.error('[AUTO-BLOG] publish failed', error);
    return NextResponse.json({ error: 'publish failed' }, { status: 500 });
  }
}
