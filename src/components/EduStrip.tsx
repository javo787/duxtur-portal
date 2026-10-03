'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { shouldShowEduStrip } from '@/lib/edu-strip';
import { EDU_BASE } from '@/lib/edu-routes';

const DISMISS_KEY = 'duxtur_edu_strip_dismissed_v1';

// "Dismissed" lives in localStorage (remembered across visits) with an in-memory fallback when storage is blocked,
// so the close button always works. useSyncExternalStore reads it without setState-in-effect and without a
// hydration mismatch: the server snapshot is always "not dismissed".
let dismissedInMemory = false;
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  if (dismissedInMemory) return true;
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange); // dismissed in another tab
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function dismissStrip() {
  dismissedInMemory = true;
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // storage blocked: dismissed for this page view only
  }
  listeners.forEach(notify => notify());
}

/**
 * Slim strip above every public page with a link to Duxtur Edu (the separate app mounted at /edu).
 * Plain <a>, not next/link: /edu is not a route of this app. Dismissible. Not sticky on purpose, so it never
 * competes with the pages' own sticky headers. Rendered in the server HTML (not "hidden until mounted"), because
 * inserting a 40px bar after hydration would shift the content on every page load; people who dismissed it see it
 * for a single frame.
 */
export default function EduStrip({ text, cta }: { text: string; cta: string }) {
  const pathname = usePathname();
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);

  if (dismissed || !shouldShowEduStrip(pathname)) return null;

  return (
    <div className="print:hidden bg-blue-600 text-white text-[13px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-10 flex items-center justify-center gap-3 py-1.5">
        <a href={EDU_BASE} className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 hover:underline">
          <span className="font-medium text-center">{text}</span>
          <span className="font-semibold whitespace-nowrap">{cta}</span>
        </a>
        <button
          type="button"
          onClick={dismissStrip}
          aria-label="×"
          className="shrink-0 w-8 h-8 -mr-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
