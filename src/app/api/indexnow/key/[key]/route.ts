import { NextResponse } from 'next/server';
import { getIndexNowKey } from '@/lib/indexnow';

/**
 * Serves the IndexNow key file at /<key>.txt (next.config.ts rewrites the root path here).
 * Only the configured key answers; every other /<something>.txt stays a 404.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const configured = getIndexNowKey();
  if (!configured || key !== configured) {
    return new NextResponse('Not found', { status: 404 });
  }
  return new NextResponse(configured, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
