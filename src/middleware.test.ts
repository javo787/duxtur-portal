import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { authHandler } = vi.hoisted(() => ({
  authHandler: vi.fn(() => new Response(null, { status: 200, headers: { 'x-auth-ran': '1' } })),
}));

vi.mock('next-auth', () => ({ default: () => ({ auth: authHandler }) }));
vi.mock('@/auth.config', () => ({ authConfig: {} }));

import middleware from './middleware';

const req = (path: string, host = 'duxtur.org') => new NextRequest(`https://${host}${path}`);

describe('middleware and /edu', () => {
  it('lets /edu through untouched (no locale redirect, no portal auth)', async () => {
    for (const path of ['/edu', '/edu/exam', '/edu/dashboard/teacher', '/edu/join?code=ABC']) {
      authHandler.mockClear();
      const res = await middleware(req(path));
      expect(res.status, path).toBe(200);
      expect(res.headers.get('location'), path).toBeNull();
      expect(authHandler).not.toHaveBeenCalled();
    }
  });

  it('still redirects other locale-less portal paths', async () => {
    const res = await middleware(req('/doctors'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/ru/doctors');
  });

  it('does not treat look-alike paths as /edu', async () => {
    const res = await middleware(req('/eduardo'));
    expect(res.headers.get('location')).toContain('/ru/eduardo');
  });

  it('keeps localized portal routes on the auth path', async () => {
    authHandler.mockClear();
    await middleware(req('/ru/doctors'));
    expect(authHandler).toHaveBeenCalledTimes(1);
  });

  it('still redirects *.vercel.app, including /edu, to duxtur.org', async () => {
    const res = await middleware(req('/edu/exam', 'duxtur-portal.vercel.app'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://duxtur.org/edu/exam');
  });
});
