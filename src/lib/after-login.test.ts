import { describe, it, expect } from 'vitest';
import { homeAfterLogin } from './after-login';

describe('homeAfterLogin', () => {
  it('sends the portal team to the panel and everybody else to their own place', () => {
    expect(homeAfterLogin('portal_admin', 'ru')).toBe('/ru/admin/portal');
    expect(homeAfterLogin('portal_manager', 'tg')).toBe('/tg/admin/portal');
    expect(homeAfterLogin('clinic', 'ru')).toBe('/ru/clinic/admin');
    expect(homeAfterLogin('doctor', 'ru')).toBe('/ru/admin');
    expect(homeAfterLogin('patient', 'ru')).toBe('/ru/write');
    expect(homeAfterLogin(undefined, 'ru')).toBe('/ru/write');
  });
});
