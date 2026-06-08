'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { useSession, signOut } from 'next-auth/react';
import { Locale } from '@/i18n';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function HomeHeader({ lang }: { lang: Locale }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const { visible, scrolled } = useScrollVisibility();

  const role = (session?.user as ExtendedUser)?.role;
  const isDoctor = role === 'doctor' || role === 'portal_admin';

  const navLinks = [
    { href: `/${lang}/blog`,    label: 'Статьи'      },
    { href: `/${lang}/doctors`, label: 'Найти врача' },
    { href: `/${lang}/clinics`, label: 'Клиники'     },
    { href: `/${lang}/search`,  label: 'Поиск'       },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      } ${
        scrolled
          ? 'bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-md shadow-slate-200/20 dark:shadow-slate-950/50'
          : 'bg-white/90 dark:bg-background/90 backdrop-blur-md'
      } border-b border-slate-100 dark:border-white/5`}
      aria-hidden={!visible}
    >
      {/* Accent line */}
      <div className="h-[2px] brand-line" />

      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href={`/${lang}`} className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src="/logo.png"
              alt="Duxtur logo"
              fill
              className="rounded-xl object-contain group-hover:opacity-90 transition"
            />
          </div>
          <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            duxtur<span className="text-blue-600">.org</span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-[13.5px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 group"
            >
              {link.label}
              <span className="absolute bottom-1 left-4 right-4 h-[1.5px] brand-line scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
            </Link>
          ))}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
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
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition px-3 py-2"
                >
                  Выйти
                </button>
              </div>
            )
          ) : (
            <>
              <Link
                href={`/${lang}/login`}
                className="hidden md:block text-[13.5px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition px-3 py-2"
              >
                Войти
              </Link>
              <Link
                href={`/${lang}/register`}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Я врач
              </Link>
            </>
          )}

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Меню"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`h-[1.5px] bg-slate-700 dark:bg-slate-300 rounded transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`h-[1.5px] bg-slate-700 dark:bg-slate-300 rounded transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-[1.5px] bg-slate-700 dark:bg-slate-300 rounded transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-80' : 'max-h-0'}`}>
        <div className="bg-white dark:bg-card border-t border-slate-100 dark:border-white/5 px-5 py-4 space-y-1 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-3 text-[14px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 mt-3 flex flex-col gap-2">
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
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {session.user?.name || session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="flex items-center justify-center py-2.5 text-[14px] font-medium text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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
                  className="flex items-center justify-center py-2.5 text-[14px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
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
