import { NextRequest, NextResponse } from 'next/server';
import { REQUEST_ID_HEADER } from '@/lib/edu-log';

/**
 * Same-origin (duxtur.org/edu) needs no CORS. The allowlist is only for the
 * standalone active_study host during rollout; set EDU_ALLOWED_ORIGINS (comma separated).
 */
function allowedOrigins(): string[] {
  const extra = (process.env.EDU_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return ['https://duxtur.org', 'https://www.duxtur.org', ...extra];
}

/**
 * State-changing Edu endpoints answer only to pages of duxtur.org itself (or the listed standalone hosts).
 * The session cookie is SameSite=Lax, which already keeps it off cross-site POSTs; this check is the second wall,
 * because linking accounts on a forged request would put a stranger's Edu account behind someone's portal login.
 */
export function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  return !!origin && allowedOrigins().includes(origin);
}

export function withEduCors(req: NextRequest, res: NextResponse, reqId?: string): NextResponse {
  if (reqId) res.headers.set(REQUEST_ID_HEADER, reqId);
  const origin = req.headers.get('origin');
  if (origin && allowedOrigins().includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    // Cross-origin pages can only read headers that are exposed explicitly.
    res.headers.set('Access-Control-Expose-Headers', REQUEST_ID_HEADER);
  }
  return res;
}

export function eduPreflight(req: NextRequest): NextResponse {
  return withEduCors(req, new NextResponse(null, { status: 204 }));
}
