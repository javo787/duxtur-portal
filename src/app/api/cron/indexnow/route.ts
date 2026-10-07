import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import sitemap from '@/app/sitemap';
import { submitToIndexNow } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_WINDOW_HOURS = 26; // daily cron plus a little overlap; resubmitting a URL is harmless
const MAX_WINDOW_HOURS = 24 * 30;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed: without a secret nobody may trigger submissions
  const given = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Daily: tells IndexNow about every sitemap URL whose lastmod falls in the window.
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
 *   ?hours=N  window size (default 26, max 720)
 *   ?all=1    every URL in the sitemap, e.g. once after the first deploy
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const all = params.get('all') === '1';
  const hoursParam = Number(params.get('hours'));
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? Math.min(hoursParam, MAX_WINDOW_HOURS) : DEFAULT_WINDOW_HOURS;
  const since = Date.now() - hours * 60 * 60 * 1000;

  try {
    const entries = await sitemap();
    const urls = entries
      .filter((e) => all || (e.lastModified !== undefined && new Date(e.lastModified).getTime() >= since))
      .map((e) => e.url);

    const result = await submitToIndexNow(urls);
    return NextResponse.json(
      { mode: all ? 'all' : `last ${hours}h`, candidates: urls.length, ...result },
      { status: result.skipped === 'no-key' ? 503 : 200 },
    );
  } catch (error) {
    console.error('[INDEXNOW] cron failed', error);
    return NextResponse.json({ error: 'IndexNow cron failed' }, { status: 500 });
  }
}
