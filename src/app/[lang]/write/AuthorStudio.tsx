'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { deleteAuthorDraft, getAuthorDraft, getStudioState, publishMyDrafts } from '@/app/actions/author';
import { WriteTab, type ResumedDraft } from '../admin/_components/WriteTab';
import { AuthorCompletion } from '../admin/_components/AuthorCompletion';
import TelegramLogin from '@/components/TelegramLogin';
import EduContinue, { useEduContinue } from '@/components/EduContinue';
import { useT } from '@/i18n';
import type { AuthorField } from '@/lib/author-profile';
import type { StudioState } from '@/lib/author-types';

/**
 * The writing studio: where "Write an article" in Duxtur Edu (and the doctors' login) lands.
 *
 * Nobody is asked for anything before writing. Signed in to Edu in this browser: the page signs in by itself. Not signed
 * in: the same few ways as everywhere on the portal. The doctor's data is asked once, on one short screen, only when an
 * article is sent and the profile still lacks something (see AuthorCompletion).
 */

const FIELD_NAMES: Record<AuthorField, string> = {
  name: 'фамилия и имя',
  specialty: 'специальность',
  phone: 'телефон',
  documentImage: 'диплом',
};

function Shell({ lang, children, right }: { lang: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/${lang}`} aria-label="duxtur.org" className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="font-extrabold text-gray-900 text-sm">
              duxtur<span className="text-blue-500">.org</span>
            </span>
            <span className="hidden min-[400px]:inline-block text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-100">
              Кабинет автора
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">{right}</div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 pb-16">{children}</main>
    </div>
  );
}

export default function AuthorStudio({ lang }: { lang: string }) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <Shell lang={lang}>
        <div role="status" aria-label="Загрузка" className="space-y-4 pt-6">
          <div className="h-8 w-2/3 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </Shell>
    );
  }
  if (status === 'unauthenticated') return <StudioSignIn lang={lang} />;
  return <StudioHome lang={lang} />;
}

// ─── Not signed in ──────────────────────────────────────────────────────────

function StudioSignIn({ lang }: { lang: string }) {
  const { t } = useT(lang);
  const target = `/${lang}/write`;
  // "Write an article" in Duxtur Edu opens this page with ?from=edu: the person is already known there, so sign in at once.
  const [fromEdu] = useState(() => new URLSearchParams(window.location.search).get('from') === 'edu');
  const edu = useEduContinue({ redirectFor: () => target, auto: fromEdu });

  const waiting = fromEdu && (edu.phase === 'checking' || edu.phase === 'ready' || edu.phase === 'signing');

  return (
    <Shell lang={lang}>
      <div className="max-w-md mx-auto pt-8 sm:pt-14">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{t('eduBridge.studioTitle')}</h1>
        <p className="text-gray-500 mt-2">{t('eduBridge.studioIntro')}</p>

        {waiting ? (
          <div role="status" aria-live="polite" className="mt-8 flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <span className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full shrink-0" aria-hidden="true" />
            <p className="font-bold text-gray-800">
              {edu.phase === 'signing' ? t('eduBridge.signingIn') : t('eduBridge.studioOpening')}
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {edu.phase === 'failed' && edu.failure && (
              <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-2xl text-sm font-medium border border-red-100">
                {t(`eduBridge.${edu.failure}`)}
              </p>
            )}
            {!fromEdu && <EduContinue lang={lang} className="" redirectFor={() => target} />}
            <TelegramLogin lang={lang} mode="login" redirectFor={() => target} />
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: target })}
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 font-bold text-slate-700 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <p className="text-center text-sm text-gray-500 pt-1">
              <Link href={`/${lang}/login`} className="font-bold text-blue-600 hover:underline">Email и пароль</Link>
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

// ─── Signed in ──────────────────────────────────────────────────────────────

function StudioHome({ lang }: { lang: string }) {
  const { data: session, status, update } = useSession();
  const [state, setState] = useState<StudioState | null>(null);
  const [resume, setResume] = useState<ResumedDraft | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [editorCompleting, setEditorCompleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => setState(await getStudioState()), []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // The team approved this person after they signed in: the session still says "patient" until it is asked again.
  // update() without data only re-reads the session; an object makes the server run its "update" step, which reads the
  // role from the database again. Asked once per role, so a refusal can never turn into a request loop.
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const askedForRole = useRef<string | null>(null);
  useEffect(() => {
    // update() does nothing while the session is still loading, so wait for it before asking (and before counting it).
    if (status !== 'authenticated' || !state?.signedIn || !state.role || state.role === sessionRole) return;
    if (askedForRole.current === state.role) return;
    askedForRole.current = state.role;
    void update({});
  }, [state, sessionRole, status, update]);

  const openDraft = async (id: string) => {
    setBusy(true);
    const draft = await getAuthorDraft(id);
    setBusy(false);
    if (!draft.success) return setNotice(draft.error);
    setNotice('');
    setCompleting(false);
    setResume({ id, language: draft.language, data: draft.data });
    setEditorKey(k => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeDraft = async (id: string) => {
    if (!window.confirm('Удалить черновик?')) return;
    setBusy(true);
    await deleteAuthorDraft(id);
    setBusy(false);
    if (resume?.id === id) {
      setResume(null);
      setEditorKey(k => k + 1);
    }
    await refresh();
  };

  const publishAll = async () => {
    setBusy(true);
    const result = await publishMyDrafts();
    setBusy(false);
    setNotice(result.success ? `Опубликовано статей: ${result.published}` : result.error || 'Не удалось опубликовать');
    await refresh();
  };

  const header = (
    <>
      {state?.role === 'doctor' && (
        <Link href={`/${lang}/admin`} className="px-3 py-2 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition">
          Кабинет врача
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: `/${lang}/login` })}
        className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
      >
        Выход
      </button>
    </>
  );

  if (!state) {
    return (
      <Shell lang={lang} right={header}>
        <div role="status" aria-label="Загрузка" className="space-y-4 pt-4">
          <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </Shell>
    );
  }

  if (state.standing === 'blocked') {
    return (
      <Shell lang={lang} right={header}>
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
          <h1 className="font-extrabold text-red-800">Профиль врача не подтверждён</h1>
          <p className="text-sm text-red-700 mt-1">
            Публиковать статьи сейчас нельзя. Напишите в поддержку, чтобы разобраться:{' '}
            <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer" className="font-bold underline">@duxturcom</a>
          </p>
        </div>
      </Shell>
    );
  }

  const drafts = state.drafts;
  const waitingForTeam = state.standing === 'pending' && state.missing.length === 0;

  return (
    <Shell lang={lang} right={header}>
      <div className="space-y-5 pt-4">
        {waitingForTeam && (
          <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <span className="font-bold">Диплом на проверке.</span> Статьи, которые вы отправляете, выйдут сами, как только профиль подтвердят.
          </p>
        )}

        {notice && (
          <p role="status" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">{notice}</p>
        )}

        {drafts.length > 0 && (
          <section aria-labelledby="drafts-title" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="drafts-title" className="font-extrabold text-gray-900">Черновики · {drafts.length}</h2>
              {state.standing === 'approved' && (
                <button type="button" onClick={publishAll} disabled={busy}
                  className="min-h-[40px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition disabled:opacity-60">
                  Опубликовать
                </button>
              )}
            </div>

            {state.standing !== 'approved' && state.missing.length > 0 && !completing && !editorCompleting && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                <p className="text-sm text-amber-900 flex-1">
                  Чтобы отправить: {state.missing.map(f => FIELD_NAMES[f]).join(', ')}.
                </p>
                <button type="button" onClick={() => setCompleting(true)}
                  className="min-h-[40px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition">
                  Заполнить
                </button>
              </div>
            )}

            <ul className="mt-3 divide-y divide-gray-100">
              {drafts.map(d => (
                <li key={d.id} className="py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{d.title || 'Без названия'}</p>
                    <p className="text-xs text-gray-400 uppercase">{d.language}</p>
                  </div>
                  <button type="button" onClick={() => openDraft(d.id)} disabled={busy}
                    className="min-h-[40px] px-3 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition disabled:opacity-60">
                    Продолжить
                  </button>
                  <button type="button" onClick={() => removeDraft(d.id)} disabled={busy} aria-label="Удалить черновик"
                    className="min-h-[40px] min-w-[40px] rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-60">
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {completing && state.missing.length > 0 && (
          <AuthorCompletion
            missing={state.missing}
            accountName={state.name}
            title="Данные врача"
            onDone={async () => { setCompleting(false); setNotice('Отправлено. Команда проверит диплом, статьи выйдут сами.'); await refresh(); }}
            onLater={() => setCompleting(false)}
          />
        )}

        <WriteTab
          key={editorKey}
          lang={lang}
          resume={resume}
          accountName={state.name}
          autoTutorial={false}
          onCompletionChange={setEditorCompleting}
          onChanged={() => { setResume(null); void refresh(); }}
        />
      </div>
    </Shell>
  );
}
