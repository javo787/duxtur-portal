import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin (duxtur.org/edu) needs no CORS. The allowlist is only for the
 * standalone active_study host during rollout; set EDU_ALLOWED_ORIGINS (comma separated).
 */
function allowedOrigins(): string[] {
  const extra = (process.env.EDU_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return ['https://duxtur.org', 'https://www.duxtur.org', ...extra];
}

export function withEduCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin');
  if (origin && allowedOrigins().includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return res;
}

export function eduPreflight(req: NextRequest): NextResponse {
  return withEduCors(req, new NextResponse(null, { status: 204 }));
}
