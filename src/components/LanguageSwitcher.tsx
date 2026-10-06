'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// Each language in its own name; flags are countries, not languages
const LANGUAGES = [
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'tg', label: 'Тоҷикӣ', short: 'TJ' },
  { code: 'uz', label: 'Oʻzbekcha', short: 'UZ' },
  { code: 'kk', label: 'Қазақша', short: 'KZ' },
  { code: 'ky', label: 'Кыргызча', short: 'KG' },
] as const;

const rememberLocale = (locale: string) => {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
};

export default function LanguageSwitcher() {
  const pathName = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = pathName?.split('/')[1] ?? 'ru';
  const current = LANGUAGES.find(l => l.code === currentLang) ?? LANGUAGES[0];

  // Close on outside click and on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const changeLanguage = (locale: string) => {
    if (!pathName) return;
    const segments = pathName.split('/');
    segments[1] = locale;
    rememberLocale(locale);
    setIsOpen(false);
    router.push(segments.join('/'));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={current.label}
        className="inline-flex h-10 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {current.short}
        <ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <ul role="listbox" className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[10px] border border-border bg-popover py-1 text-popover-foreground shadow-lg">
          {LANGUAGES.map(l => (
            <li key={l.code} role="option" aria-selected={l.code === currentLang}>
              <button
                type="button"
                onClick={() => changeLanguage(l.code)}
                className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm transition-colors hover:bg-muted ${
                  l.code === currentLang ? 'font-semibold' : ''
                }`}
              >
                {l.label}
                {l.code === currentLang && <Check className="size-4 text-primary" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
