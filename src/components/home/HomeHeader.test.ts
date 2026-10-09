import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Each test sets the session it needs
const session = vi.hoisted(() => ({ value: { data: null as unknown, status: 'unauthenticated' } }));
vi.mock('next-auth/react', () => ({
  useSession: () => session.value,
  signOut: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/ru',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import HomeHeader from './HomeHeader';

function anchors(html: string) {
  return [...html.matchAll(/<a\s[^>]*?href="([^"]+)"[^>]*?>/g)].map(m => {
    const tag = m[0];
    return { href: m[1], className: /class="([^"]*)"/.exec(tag)?.[1] ?? '' };
  });
}

const render = () =>
  renderToStaticMarkup(
    createElement(HomeHeader, {
      lang: 'ru',
      labels: { articles: 'Статьи', findDoctor: 'Найти врача', clinics: 'Клиники', search: 'Поиск', login: 'Войти', logout: 'Выйти', becomeAuthor: 'Я врач', myOffice: 'Мой кабинет', menu: 'Меню' },
      eduLabel: 'Студентам',
      eduTeacherLabel: 'Преподавателям',
    })
  );
const html = render();

describe('HomeHeader Edu links', () => {
  it('desktop has the students link, the burger menu has students and teachers', () => {
    const edu = anchors(html).filter(a => a.href === '/edu');
    expect(edu).toHaveLength(3); // desktop students + menu students + menu teachers
    expect(html).toContain('Студентам');
    expect(html).toContain('Преподавателям');
  });

  it('are styled exactly like the other nav links (not the blue accent)', () => {
    const all = anchors(html);
    const regular = new Set(all.filter(a => a.href === '/ru/blog').map(a => a.className)); // desktop + menu variants
    expect(regular.size).toBe(2);

    for (const link of all.filter(a => a.href === '/edu')) {
      expect(regular.has(link.className), `unexpected style: ${link.className}`).toBe(true);
      expect(link.className).not.toMatch(/blue|semibold/);
    }
  });
});

describe('HomeHeader session states', () => {
  it('shows the anonymous buttons while the session is still loading (never an empty header)', () => {
    session.value = { data: null, status: 'loading' };
    const loading = render();
    expect(loading).toContain('Войти');
    expect(loading).toContain('Я врач');
    expect(loading).not.toContain('Мой кабинет');
  });

  it('shows the office link to a signed-in doctor', () => {
    session.value = { data: { user: { name: 'Dr', role: 'doctor' } }, status: 'authenticated' };
    const doctor = render();
    expect(doctor).toContain('Мой кабинет');
    expect(anchors(doctor).some(a => a.href === '/ru/admin')).toBe(true);
    expect(doctor).not.toContain('Войти');
  });
});
