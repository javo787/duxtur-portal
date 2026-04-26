'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function LanguageSwitcher() {
  const pathName = usePathname();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('ru');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathName) {
      setCurrentLang(pathName.split('/')[1]);
    }
  }, [pathName]);

  // Закрывать при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (locale: string) => {
    if (!pathName) return;
    const segments = pathName.split('/');
    segments[1] = locale;
    const newUrl = segments.join('/');
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
    setIsOpen(false);
    router.push(newUrl);
  };

  const languages = [
    { code: 'ru', label: '🇷🇺 Русский',  short: 'RU' },
    { code: 'uz', label: '🇺🇿 Oʻzbek',   short: 'UZ' },
    { code: 'tg', label: '🇹🇯 Тоҷикӣ',   short: 'TJ' },
    { code: 'kk', label: '🇰🇿 Қазақ',    short: 'KZ' },
    { code: 'ky', label: '🇰🇬 Кыргыз',   short: 'KG' },
  ];

  const current = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
      >
        <span>{current.short}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition ${
                currentLang === lang.code
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang.label}
              {currentLang === lang.code && (
                <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
