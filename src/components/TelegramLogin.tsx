'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useT } from '@/i18n';

/**
 * Sign in or register with Telegram, or connect Telegram to the account that is signed in.
 *
 * The person confirms in the bot while this page waits: it polls /api/telegram-login/status (which never uses the
 * login up) and, once the login is approved, signs in with next-auth (mode "login") or calls /link (mode "link").
 * Nothing about the person ever comes from this page: the Telegram id is the one the bot saw.
 */

const POLL_MS = 2000;
const MAX_POLL_FAILURES = 5;

type Phase = 'idle' | 'starting' | 'waiting' | 'finishing' | 'connected' | 'failed';
type FailureKey = 'errorGeneric' | 'errorRate' | 'errorSignIn' | 'errorTaken' | 'errorHasTelegram' | 'errorNotSignedIn' | 'expired';

interface Props {
  lang: string;
  mode: 'login' | 'link';
  /** login: where to go after signing in (a path of this site). */
  callbackUrl?: string;
  /** login: choose the destination by the role the account turned out to have. Wins over callbackUrl. */
  redirectFor?: (role: string | undefined) => string;
  /** link: called once Telegram is connected. */
  onLinked?: () => void;
  /** 'solid' is the Telegram-blue button; 'outline' matches the white buttons of the doctors' login page. */
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  /** Overrides the idle button text. */
  label?: string;
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z" />
    </svg>
  );
}

export default function TelegramLogin({ lang, mode, callbackUrl, redirectFor, onLinked, variant = 'solid', disabled, label }: Props) {
  const { t } = useT(lang);
  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState<FailureKey | null>(null);
  const [botUrl, setBotUrl] = useState('');

  const login = useRef<{ token: string; pollSecret: string; expiresAt: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const finishing = useRef(false);
  const failures = useRef(0);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stop();
    };
  }, [stop]);

  const fail = useCallback(
    (key: FailureKey) => {
      stop();
      login.current = null;
      if (!alive.current) return;
      setFailure(key);
      setPhase('failed');
    },
    [stop]
  );

  const finish = useCallback(async () => {
    const current = login.current;
    if (!current || finishing.current) return;
    finishing.current = true;
    stop();
    setPhase('finishing');
    try {
      if (mode === 'login') {
        const res = await signIn('telegram', { token: current.token, pollSecret: current.pollSecret, redirect: false });
        if (!res || res.error || !res.ok) return fail('errorSignIn');
        const role = ((await getSession())?.user as { role?: string } | undefined)?.role;
        const target = redirectFor ? redirectFor(role) : callbackUrl || `/${lang}`;
        // A full navigation, so every server-rendered part of the page sees the new session cookie.
        window.location.assign(target);
        return;
      }

      const res = await fetch('/api/telegram-login/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: current.token, pollSecret: current.pollSecret }),
      });
      if (res.ok) {
        login.current = null;
        if (!alive.current) return;
        setPhase('connected');
        onLinked?.();
        return;
      }
      const code = (await res.json().catch(() => ({})))?.code;
      if (code === 'telegram_taken') return fail('errorTaken');
      if (code === 'already_has_telegram') return fail('errorHasTelegram');
      if (code === 'not_signed_in') return fail('errorNotSignedIn');
      if (res.status === 429) return fail('errorRate');
      return fail('errorGeneric');
    } catch {
      return fail('errorGeneric');
    } finally {
      finishing.current = false;
    }
  }, [mode, lang, callbackUrl, redirectFor, onLinked, fail, stop]);

  const poll = useCallback(async () => {
    const current = login.current;
    if (!current || !alive.current || finishing.current) return;
    stop();
    if (Date.now() > current.expiresAt) return fail('expired');

    try {
      const res = await fetch('/api/telegram-login/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: current.token, pollSecret: current.pollSecret, mode }),
      });
      if (res.status === 404) return fail('expired');
      if (res.status === 401) return fail('errorNotSignedIn');
      if (res.status === 429) return fail('errorRate');
      if (!res.ok) throw new Error(`status ${res.status}`);
      failures.current = 0;
      const { status } = await res.json();
      if (status === 'approved') return void finish();
      if (status === 'gone') return fail('expired');
    } catch {
      // A dropped connection or a server hiccup: try again, but not for ever.
      if (++failures.current >= MAX_POLL_FAILURES) return fail('errorGeneric');
    }
    if (alive.current && login.current) timer.current = setTimeout(poll, POLL_MS);
  }, [mode, finish, fail, stop]);

  // Coming back from the Telegram app: ask at once instead of waiting for the next tick (a phone freezes timers).
  useEffect(() => {
    if (phase !== 'waiting') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [phase, poll]);

  const begin = async () => {
    setFailure(null);
    setPhase('starting');
    failures.current = 0;
    try {
      const res = await fetch('/api/telegram-login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (res.status === 429) return fail('errorRate');
      if (res.status === 401) return fail('errorNotSignedIn');
      if (!res.ok) return fail('errorGeneric');
      const data = await res.json();
      login.current = { token: data.token, pollSecret: data.pollSecret, expiresAt: Date.now() + data.expiresInSec * 1000 };
      setBotUrl(data.botUrl);
      setPhase('waiting');
      // Opens the bot where the browser allows it; the visible button below is the way when it does not.
      window.open(data.botUrl, '_blank', 'noopener');
      timer.current = setTimeout(poll, POLL_MS);
    } catch {
      fail('errorGeneric');
    }
  };

  const cancel = () => {
    stop();
    login.current = null;
    setPhase('idle');
    setFailure(null);
  };

  const idleLabel = label ?? (mode === 'login' ? t('auth.loginTelegram') : t('telegram.connect'));
  const solid = 'bg-[#229ED9] hover:bg-[#1a8bbf] text-white';
  const outline = 'border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-700';
  const buttonClass = `w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition disabled:opacity-60 ${variant === 'solid' ? solid : outline}`;

  if (phase === 'connected') {
    return (
      <div role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="font-bold text-emerald-800 flex items-center gap-2">
          <TelegramIcon className="w-5 h-5 text-[#229ED9]" />
          {t('telegram.connected')}
        </p>
        <p className="text-sm text-emerald-700 mt-1">{t('telegram.connectedHint')}</p>
      </div>
    );
  }

  if (phase === 'waiting' || phase === 'finishing') {
    return (
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 space-y-3" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="animate-spin h-5 w-5 border-2 border-[#229ED9] border-t-transparent rounded-full shrink-0" aria-hidden="true" />
          <p className="font-bold text-slate-800">{phase === 'finishing' ? t('telegram.finishing') : t('telegram.waitingTitle')}</p>
        </div>
        {phase === 'waiting' && (
          <>
            <p className="text-sm text-slate-600">{mode === 'login' ? t('telegram.waitingLogin') : t('telegram.waitingLink')}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#229ED9] hover:bg-[#1a8bbf] text-white font-bold text-sm transition"
              >
                <TelegramIcon className="w-4 h-4" />
                {t('telegram.openBot')}
              </a>
              <button
                type="button"
                onClick={cancel}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
              >
                {t('telegram.cancel')}
              </button>
            </div>
            <p className="text-xs text-slate-400">{t('telegram.privacy')}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={begin} disabled={disabled || phase === 'starting'} className={buttonClass}>
        <TelegramIcon className="w-6 h-6 shrink-0" />
        {phase === 'starting' ? t('telegram.starting') : phase === 'failed' ? t('telegram.retry') : idleLabel}
      </button>
      {phase === 'failed' && failure && (
        <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-2xl text-sm font-medium border border-red-100">
          {t(`telegram.${failure}`)}
        </p>
      )}
    </div>
  );
}
