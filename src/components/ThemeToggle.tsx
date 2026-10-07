'use client';

import { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

// The `.dark` class on <html> is the single source of truth. It is set before first paint by the inline
// script in [lang]/layout.tsx (saved choice in localStorage "theme", else the system preference).
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains('dark');

const icon = 'absolute inset-0 transition-[transform,opacity] duration-300 ease-premium';

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    const next = !dark;
    localStorage.setItem('theme', next ? 'dark' : 'light');
    const apply = () => document.documentElement.classList.toggle('dark', next);
    // The page cross-fades between the themes where the browser can do it; elsewhere it simply switches
    if (typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Both icons are always there; the one that is not current turns away and fades */}
      <span className="relative size-[18px]" aria-hidden="true">
        <Sun size={18} className={`${icon} ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
        <Moon size={18} className={`${icon} ${dark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      </span>
    </button>
  );
}
