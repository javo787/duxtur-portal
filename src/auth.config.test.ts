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

describe('coming back from Duxtur Edu (?next=/edu)', () => {
  it('sends a signed-in person from the login or signup page straight back to Edu', () => {
    expect(visit('/ru/signup?next=/edu', 'patient')).toBe('/edu');
    expect(visit('/ru/login?next=/edu', 'doctor')).toBe('/edu');
    expect(visit('/tg/signup?next=/edu/dashboard/teacher', 'patient')).toBe('/edu/dashboard/teacher');
  });

  it('never sends anybody anywhere but Edu', () => {
    expect(visit('/ru/login?next=https://evil.example', 'doctor')).toBe('/ru/admin');
    expect(visit('/ru/login?next=//evil.example', 'patient')).toBe('/ru/write');
    expect(visit('/ru/login?next=/admin/portal', 'portal_admin')).toBe('/ru/admin/portal');
  });

  it('leaves a signed-out visitor on the page', () => {
    expect(visit('/ru/signup?next=/edu')).toBe(true);
    expect(visit('/ru/login?next=/edu')).toBe(true);
  });

  it('does not touch other pages', () => {
    expect(visit('/ru/blog?next=/edu', 'patient')).toBe(true);
  });
});
