'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useSession, signOut } from 'next-auth/react';

export default function HomeHeader({ lang }: { lang: string }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const role = (session?.user as any)?.role;
  const isDoctor = role === 'doctor' || role === 'portal_admin';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    { href: `/${lang}/blog`, label: 'Статьи' },
    { href: `/${lang}/doctors`, label: 'Найти врача' },
    { href: `/${lang}/clinics`, label: 'Клиники' },
    { href: `/${lang}/search`, label: 'Поиск' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-md shadow-slate-200/20'
          : 'bg-white/90 backdrop-blur-md'
      } border-b border-slate-100`}
    >
      {/* accent line */}
      <div className="h-[2px] brand-line" />

      <div className="max-w-7xl mx-auto px-5 h-[64px] flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${lang}`} className="flex items-center gap-2.5 group">
  <img
    src="/logo.png"
    alt="Duxtur logo"
    width={36}
    height={36}
    className="rounded-xl object-contain group-hover:opacity-90 transition"
  />
  <span className="text-xl font-extrabold text-gray-900 tracking-tight">
    duxtur<span className="text-blue-600">.org</span>
  </span>
</Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200 group"
            >
              {link.label}
              <span className="absolute bottom-1 left-4 right-4 h-[1.5px] brand-line scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {session ? (
            isDoctor ? (
              <Link
                href={`/${lang}/admin`}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
              >
                Мой кабинет →
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-[13.5px] font-medium text-slate-500 hover:text-red-600 transition px-3 py-2"
                >
                  Выйти
                </button>
              </div>
            )
          ) : (
            <>
              <Link
                href={`/${lang}/login`}
                className="hidden md:block text-[13.5px] font-medium text-slate-500 hover:text-slate-900 transition px-3 py-2"
              >
                Войти
              </Link>
              <Link
                href={`/${lang}/register`}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Я врач
              </Link>
            </>
          )}

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
            aria-label="Меню"
          >
            <div className="w-5 flex flex-col gap-1.5 transition-all duration-200">
              <span className={`h-[1.5px] bg-slate-700 rounded transition-all ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`h-[1.5px] bg-slate-700 rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-[1.5px] bg-slate-700 rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-80' : 'max-h-0'}`}>
        <div className="bg-white border-t border-slate-100 px-5 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 mt-3 flex flex-col gap-2">
            {session ? (
              isDoctor ? (
                <Link
                  href={`/${lang}/admin`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-xl text-[14px] bg-blue-600 hover:bg-blue-700 transition"
                >
                  Мой кабинет →
                </Link>
              ) : (
                <>
                  <div className="px-4 py-2 text-center">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {session.user?.name || session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                    className="flex items-center justify-center py-2.5 text-[14px] font-medium text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition"
                  >
                    Выйти
                  </button>
                </>
              )
            ) : (
              <>
                <Link
                  href={`/${lang}/login`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 text-[14px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Войти
                </Link>
                <Link
                  href={`/${lang}/register`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-xl text-[14px] bg-blue-600 hover:bg-blue-700 transition"
                >
                  Я врач — стать автором
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
