'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useT } from '@/i18n';
import { EduSession, forgetEduSession, loadEduSession } from '@/lib/edu-bridge-client';

/**
 * "Continue as <name>" for a person who is already signed in to Duxtur Edu in this browser.
 *
 * useEduContinue asks the Edu app (hidden frame, same origin) who is signed in there; signing in sends that session's
 * Firebase ID token to the server, which verifies it and opens the person's portal account (see portal-edu-signin.ts).
 * The button shows nothing until Edu answers, and nothing at all when nobody is signed in to Edu here.
 */

type Phase = 'checking' | 'none' | 'ready' | 'signing' | 'failed';
export type EduFailure = 'errorGeneric' | 'errorNotApproved' | 'errorEmailInUse' | 'errorRole';

const FAILURE_BY_CODE: Record<string, EduFailure> = {
  doctor_not_approved: 'errorNotApproved',
  email_in_use: 'errorEmailInUse',
  role_not_allowed: 'errorRole',
};

interface Options {
  /** Where to go once signed in, by the role the account turned out to have. */
  redirectFor: (role: string | undefined) => string;
  /** Sign in as soon as Edu says who is there (the person already asked for the page that needs it). */
  auto?: boolean;
}

export function useEduContinue({ redirectFor, auto = false }: Options) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [session, setSession] = useState<EduSession | null>(null);
  const [failure, setFailure] = useState<EduFailure | null>(null);
  const redirectRef = useRef(redirectFor);
  useEffect(() => {
    redirectRef.current = redirectFor;
  });
  const started = useRef(false);

  const go = useCallback(async (edu: EduSession) => {
    if (started.current) return;
    started.current = true;
    setPhase('signing');
    setFailure(null);
    try {
      const res = await signIn('edu', { idToken: edu.idToken, redirect: false });
      if (!res || res.error || !res.ok) {
        forgetEduSession();
        started.current = false;
        setFailure(FAILURE_BY_CODE[res?.code ?? ''] ?? 'errorGeneric');
        setPhase('failed');
        return;
      }
      const role = ((await getSession())?.user as { role?: string } | undefined)?.role;
      // A full navigation, so every server-rendered part of the page sees the new session cookie.
      window.location.assign(redirectRef.current(role));
    } catch {
      forgetEduSession();
      started.current = false;
      setFailure('errorGeneric');
      setPhase('failed');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    loadEduSession().then(found => {
      if (!alive) return;
      if (!found) return setPhase('none');
      setSession(found);
      setPhase('ready');
      if (auto) void go(found);
    });
    return () => {
      alive = false;
    };
  }, [auto, go]);

  return { phase, session, failure, signInNow: () => session && go(session) };
}

export default function EduContinue({ lang, redirectFor, className = 'mb-6' }: { lang: string; redirectFor: (role: string | undefined) => string; className?: string }) {
  const { t } = useT(lang);
  const { phase, session, failure, signInNow } = useEduContinue({ redirectFor });

  if (phase === 'checking' || phase === 'none' || !session) return null;

  const name = session.name || 'Duxtur Edu';
  const busy = phase === 'signing';

  return (
    <div className={`${className} space-y-2`}>
      <button
        type="button"
        onClick={signInNow}
        disabled={busy}
        className="w-full flex items-center gap-3 p-3 pr-4 rounded-2xl border-2 border-blue-100 bg-blue-50/70 hover:bg-blue-50 text-left transition disabled:opacity-70"
      >
        {session.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.image} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover shrink-0" />
        ) : (
          <span aria-hidden="true" className="w-11 h-11 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0">
            {name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold text-slate-900 leading-snug break-words line-clamp-2">
            {busy ? t('eduBridge.signingIn') : t('eduBridge.continueAs').replace('{name}', name)}
          </span>
          <span className="block text-xs text-slate-500 truncate">{t('eduBridge.subtitle')}</span>
        </span>
        {busy ? (
          <span className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full shrink-0" aria-hidden="true" />
        ) : (
          <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
      {phase === 'failed' && failure && (
        <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-2xl text-sm font-medium border border-red-100">
          {t(`eduBridge.${failure}`)}
        </p>
      )}
    </div>
  );
}
