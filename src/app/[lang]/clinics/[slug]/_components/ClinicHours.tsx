'use client';

import { useSyncExternalStore } from 'react';
import { useT } from '@/i18n';

type Hours = Record<string, { open: string; close: string; isWorking: boolean }> | undefined;

const BY_GETDAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};
const getMinute = (): number | null => Math.floor(Date.now() / 60_000);
const getServerMinute = (): number | null => null;

const toMinutes = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + (m || 0);
};

/**
 * Hours depend on the visitor's clock, and the page itself is cached (ISR), so anything
 * "today"-related is filled in after mount. Until then the server HTML is the plain schedule.
 * Uses the device's local time: right for patients in the clinic's own region.
 */
export default function ClinicHours({ hours, lang, variant }: { hours: Hours; lang: string; variant: 'status' | 'table' }) {
  const { t } = useT(lang);
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  const now = minute === null ? null : new Date(minute * 60_000);

  if (!hours) return null;
  const todayKey = now ? BY_GETDAY[now.getDay()] : null;

  if (variant === 'status') {
    const today = todayKey ? hours[todayKey] : null;
    if (!now || !today) {
      return (
        <a href="#contacts" className="underline decoration-dotted underline-offset-4">
          {t('clinic.workingHours')}
        </a>
      );
    }
    const cur = now.getHours() * 60 + now.getMinutes();
    const open = toMinutes(today.open);
    let close = toMinutes(today.close);
    if (close <= open) close = 24 * 60; // "00:00" closing means midnight
    let text = t('clinic.closed');
    let isOpen = false;
    if (today.isWorking) {
      if (cur >= open && cur < close) {
        isOpen = true;
        text = t('clinic.openUntil').replace('{time}', today.close);
      } else if (cur < open) {
        text = t('clinic.opensAt').replace('{time}', today.open);
      }
    }
    return (
      <span className="inline-flex items-center gap-2">
        <span className={`size-2 rounded-full ${isOpen ? 'bg-ok' : 'bg-foreground/30'}`} aria-hidden="true" />
        {text}
      </span>
    );
  }

  return (
    <ul className="divide-y divide-border border-t border-border text-[0.9375rem]">
      {WEEK.map((day, i) => {
        const d = hours[day];
        const isToday = day === todayKey;
        return (
          <li key={day} className={`flex justify-between gap-4 px-1 py-2 ${isToday ? 'font-semibold' : 'text-foreground/75'}`}>
            <span className="capitalize">
              {new Date(2024, 0, i + 1).toLocaleDateString(lang, { weekday: 'long' })}
            </span>
            <span className="tabular-nums">{d?.isWorking ? `${d.open}–${d.close}` : t('doctor.dayOff')}</span>
          </li>
        );
      })}
    </ul>
  );
}
