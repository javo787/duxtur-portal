'use client';

import { useState } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function HomeHeader({ lang }: { lang: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${lang}/blog`, label: 'Статьи' },
    { href: `/${lang}/authors`, label: 'Авторы' },
    { href: `/${lang}/search`, label: 'Поиск' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Логотип */}
        <Link href={`/${lang}`} className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">
            duxtur<span className="text-blue-600">.com</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href={`/${lang}/register`}
            className="hidden md:flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition shadow-md shadow-blue-200 active:scale-95">
            Я врач
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          {/* Mobile burger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition">
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition">
              {link.label}
            </Link>
          ))}
          <Link href={`/${lang}/register`}
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center gap-2 mt-3 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition">
            Я врач — Стать автором →
          </Link>
        </div>
      )}
    </header>
  );
}
