import { describe, it, expect } from 'vitest';
import { authConfig } from './auth.config';

// What the guard does for a visit: undefined/true = let through, otherwise where the person is sent.
function visit(path: string, role?: string) {
  const authorized = authConfig.callbacks.authorized as (a: unknown) => unknown;
  const result = authorized({
    auth: role === undefined ? null : { user: { role } },
    request: { nextUrl: new URL(`https://duxtur.org${path}`) },
  });
  return result instanceof Response ? new URL(result.headers.get('location')!).pathname : result;
}

describe('the doctor cabinet (/xx/admin)', () => {
  it('is for doctors', () => {
    expect(visit('/ru/admin', 'doctor')).toBe(true);
  });

  it('sends a signed-out visitor to the login page', () => {
    expect(visit('/ru/admin')).toBe('/ru/login');
  });

  it('sends a signed-in patient (Telegram, Google, Edu) to the writing studio, not round and round through the login page', () => {
    expect(visit('/ru/admin', 'patient')).toBe('/ru/write');
    expect(visit('/tg/admin/', 'patient')).toBe('/tg/write');
  });

  it('sends administrators and clinics to their own places', () => {
    expect(visit('/ru/admin', 'portal_admin')).toBe('/ru/admin/portal');
    expect(visit('/ru/admin', 'clinic')).toBe('/ru/clinic/admin');
  });
});

describe('the login page for somebody who is already signed in', () => {
  it('opens the place of their role', () => {
    expect(visit('/ru/login', 'doctor')).toBe('/ru/admin');
    expect(visit('/ru/login', 'portal_admin')).toBe('/ru/admin/portal');
    expect(visit('/ru/login', 'clinic')).toBe('/ru/clinic/admin');
    expect(visit('/ru/login', 'patient')).toBe('/ru/write');
  });

  it('is open to a signed-out visitor', () => {
    expect(visit('/ru/login')).toBe(true);
  });
});

describe('the writing studio (/xx/write)', () => {
  it('is open to everybody: the page itself signs the person in (Edu, Telegram, Google)', () => {
    expect(visit('/ru/write')).toBe(true);
    expect(visit('/ru/write', 'patient')).toBe(true);
  });
});

describe('the portal administration', () => {
  it('stays for portal administrators', () => {
    expect(visit('/ru/admin/portal', 'portal_admin')).toBe(true);
    expect(visit('/ru/admin/portal', 'doctor')).toBe('/ru/login');
    expect(visit('/ru/admin/portal')).toBe('/ru/login');
  });
});
