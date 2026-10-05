'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import TelegramLogin from '@/components/TelegramLogin';

/**
 * "Telegram" card of an account page: says whether Telegram is connected and, if not, offers to connect it so the
 * account can also be opened with Telegram. A person with two accounts (say Google and Telegram) connects here from
 * the one they want to keep.
 */
export default function TelegramConnect({ lang, className = '' }: { lang: string; className?: string }) {
  const { t } = useT(lang);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/telegram-login/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (alive && data) setConnected(!!data.connected);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Not signed in, or the answer has not come yet: nothing to show.
  if (connected === null) return null;

  return (
    <section className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-sm ${className}`}>
      <h2 className="text-lg font-extrabold text-slate-900">Telegram</h2>
      <div className="mt-4">
        {connected ? (
          <p role="status" className="font-bold text-emerald-700">
            {t('telegram.connected')}
          </p>
        ) : (
          <TelegramLogin lang={lang} mode="link" onLinked={() => setConnected(true)} />
        )}
      </div>
    </section>
  );
}
