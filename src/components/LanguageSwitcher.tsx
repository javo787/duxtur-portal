'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const pathName = usePathname();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('ru');

  useEffect(() => {
    if (pathName) {
      setCurrentLang(pathName.split('/')[1]);
    }
  }, [pathName]);

  const changeLanguage = (locale: string) => {
    if (!pathName) return;
    const segments = pathName.split('/');
    segments[1] = locale;
    const newUrl = segments.join('/');
    
    // Ставим куки на 1 год
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
    router.push(newUrl);
  };

  const languages = [
    { code: 'ru', label: '🇷🇺 Русский' },
    { code: 'uz', label: '🇺🇿 Oʻzbek' },
    { code: 'tg', label: '🇹🇯 Тоҷикӣ' },
    { code: 'kk', label: '🇰🇿 Қазақ' },
    { code: 'ky', label: '🇰🇬 Кыргыз' },
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600">
        <span className="uppercase">{currentLang}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentLang === lang.code ? 'font-bold text-blue-600' : 'text-gray-700'}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
