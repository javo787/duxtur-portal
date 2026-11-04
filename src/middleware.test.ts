import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { authHandler } = vi.hoisted(() => ({
  authHandler: vi.fn(() => new Response(null, { status: 200, headers: { 'x-auth-ran': '1' } })),
}));

vi.mock('next-auth', () => ({ default: () => ({ auth: authHandler }) }));
vi.mock('@/auth.config', () => ({ authConfig: {} }));

import middleware from './middleware';

// The main host answers the requests; the bare domain only redirects to it (see "the bare domain" below).
const req = (path: string, host = 'www.duxtur.org') => new NextRequest(`https://${host}${path}`);

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

  it('still redirects *.vercel.app, including /edu, to the main host (www.duxtur.org)', async () => {
    const res = await middleware(req('/edu/exam', 'duxtur-portal.vercel.app'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://www.duxtur.org/edu/exam');
  });
});

describe('the bare domain', () => {
  it('redirects to the main host permanently (308), keeping the path and the query', async () => {
    for (const [path, expected] of [
      ['/ru', 'https://www.duxtur.org/ru'],
      ['/ru/blog/c/dentistry', 'https://www.duxtur.org/ru/blog/c/dentistry'],
      ['/ru/clinics?city=%D0%94&type=clinic', 'https://www.duxtur.org/ru/clinics?city=%D0%94&type=clinic'],
      ['/doctors', 'https://www.duxtur.org/doctors'],
    ] as const) {
      authHandler.mockClear();
      const res = await middleware(req(path, 'duxtur.org'));
      expect(res.status, path).toBe(308);
      expect(res.headers.get('location'), path).toBe(expected);
      expect(authHandler).not.toHaveBeenCalled();
    }
  });

  it('redirects /edu as well, before any other rule', async () => {
    const res = await middleware(req('/edu/exam', 'duxtur.org'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://www.duxtur.org/edu/exam');
  });

  it('does not redirect the main host to itself', async () => {
    authHandler.mockClear();
    const res = await middleware(req('/ru', 'www.duxtur.org'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    expect(authHandler).toHaveBeenCalledTimes(1);
  });

  it('does not touch a look-alike host', async () => {
    const res = await middleware(req('/ru', 'notduxtur.org'));
    expect(res.headers.get('location')).toBeNull();
  });
});
