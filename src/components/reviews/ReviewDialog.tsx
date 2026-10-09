'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Star, X } from 'lucide-react';
import { useT } from '@/i18n';
import { useEduContinue } from '@/components/EduContinue';
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN, displayName } from '@/lib/reviews';
import { reviewReturnPath } from '@/lib/return-path';

/**
 * "Leave a review" for a doctor, a clinic or an article: one button and one dialog, the same everywhere.
 *
 * Writing needs an account, and the dialog asks for nothing else first:
 *  - signed in to duxtur.org: the form;
 *  - signed in to Duxtur Edu in this browser (the students and teachers): the dialog signs in by itself, in place, so
 *    nothing typed is lost, and the form appears;
 *  - nobody: one button to sign up or sign in, which brings the person back to this page.
 * The review is published at once, under the person's name; "hide the name" turns it into the masked one
 * ("Жа*** Н."). The form shows exactly what will be shown.
 */

export type ReviewSubject =
  | { kind: 'doctor'; id: string }
  | { kind: 'article'; id: string }
  | { kind: 'clinic'; slug: string };

interface Props {
  subject: ReviewSubject;
  /** The doctor's, clinic's or article's name, shown under the title. */
  name: string;
  lang: string;
  className?: string;
  /** Called once the review is published (a list that loaded itself can load again). */
  onPublished?: () => void;
}

const ERROR_KEY: Record<string, string> = {
  rating: 'reviews.errorRating',
  text_short: 'reviews.errorShort',
  text_long: 'reviews.errorLong',
  duplicate: 'reviews.errorDuplicate',
  own: 'reviews.errorOwn',
  rate_limited: 'reviews.errorRate',
  not_found: 'reviews.errorNotFound',
};

const TRIGGER =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export default function ReviewDialog({ subject, name, lang, className = TRIGGER, onPublished }: Props) {
  const { t } = useT(lang);
  const router = useRouter();
  const { data: session, status } = useSession();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const ids = useId();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [hideName, setHideName] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  // The server said the session is gone (it ended while the form was open): ask to sign in again.
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const title = t(`reviews.title${subject.kind === 'doctor' ? 'Doctor' : subject.kind === 'clinic' ? 'Clinic' : 'Article'}`);
  const placeholder = t(`reviews.placeholder${subject.kind === 'doctor' ? 'Doctor' : subject.kind === 'clinic' ? 'Clinic' : 'Article'}`);

  // What will be under the review: the name as it is in the account, or the masked one
  const shownName = displayName(session?.user?.name, hideName) || t('common.patient');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (rating < 1) return setError(t('reviews.errorRating'));
    if (text.trim().length < REVIEW_TEXT_MIN) return setError(t('reviews.errorShort').replace('{min}', String(REVIEW_TEXT_MIN)));

    setSending(true);
    try {
      const clinic = subject.kind === 'clinic';
      const res = await fetch(clinic ? `/api/clinic/${encodeURIComponent(subject.slug)}/review` : '/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(subject.kind === 'doctor' ? { doctorId: subject.id } : subject.kind === 'article' ? { articleId: subject.id } : {}),
          rating,
          text,
          isAnonymous: hideName,
        }),
      });
      if (res.ok) {
        setDone(true);
        onPublished?.();
        // pages the server draws (doctor, article) show the new review
        router.refresh();
        return;
      }

      const code = ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? '';
      if (res.status === 401) return setSignedOut(true);
      const key = ERROR_KEY[code];
      setError(key ? t(key).replace('{min}', String(REVIEW_TEXT_MIN)) : t('reviews.errorGeneric'));
    } catch {
      setError(t('reviews.errorGeneric'));
    } finally {
      setSending(false);
    }
  };

  const needsSignIn = status === 'unauthenticated' || signedOut;

  let body;
  if (done) {
    body = (
      <div className="py-6 text-center" role="status">
        <p className="font-clinic text-xl font-semibold">{t('reviews.thanksTitle')}</p>
        <p className="mt-2 text-foreground/70">{t('reviews.thanksText')}</p>
        <button type="button" onClick={() => setOpen(false)} className={`${TRIGGER} mt-6`}>
          {t('reviews.close')}
        </button>
      </div>
    );
  } else if (status === 'loading') {
    body = (
      <div className="flex justify-center py-12" aria-hidden="true">
        <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  } else if (needsSignIn) {
    body = <SignInStep lang={lang} onSignedIn={() => setSignedOut(false)} />;
  } else {
    body = (
      <form onSubmit={submit} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('reviews.rating')}</legend>
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(star => (
              <label key={star} className="relative flex size-11 cursor-pointer items-center justify-center" onMouseEnter={() => setHover(star)}>
                <input
                  type="radio"
                  name={`${ids}-rating`}
                  value={star}
                  checked={rating === star}
                  onChange={() => setRating(star)}
                  aria-label={t('reviews.ratingStar').replace('{n}', String(star))}
                  className="peer sr-only"
                />
                <Star
                  aria-hidden="true"
                  className={`size-8 transition-colors peer-focus-visible:rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring ${
                    star <= (hover || rating) ? 'fill-amber-500 text-amber-500' : 'text-foreground/25'
                  }`}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${ids}-text`} className="mb-1 block text-sm font-medium">
            {t('reviews.text')}
          </label>
          <textarea
            id={`${ids}-text`}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={REVIEW_TEXT_MAX}
            rows={5}
            placeholder={placeholder}
            aria-describedby={`${ids}-count`}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 leading-6 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
          <p id={`${ids}-count`} className="mt-1 text-right text-xs text-foreground/60 tabular-nums">
            {text.length}/{REVIEW_TEXT_MAX}
          </p>
        </div>

        <div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={hideName}
              onChange={e => setHideName(e.target.checked)}
              className="size-5 accent-[var(--primary)]"
            />
            {t('reviews.hideName')}
          </label>
          <p className="text-sm text-foreground/65">{t('reviews.nameOnSite').replace('{name}', shownName)}</p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)} className={`${TRIGGER} flex-1`}>
            {t('reviews.cancel')}
          </button>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex min-h-11 flex-[2] items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            {sending ? t('reviews.sending') : t('reviews.submit')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {t('reviews.write')}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${ids}-title`}
        onClose={() => setOpen(false)}
        onClick={event => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={`${ids}-title`} className="font-clinic text-xl font-semibold">
                {title}
              </h2>
              <p className="mt-1 truncate text-sm text-foreground/65">{name}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('reviews.close')}
              className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {/* Only while open: the sign-in step looks at the page address and asks Edu who is here. */}
          {open && body}
        </div>
      </dialog>
    </>
  );
}

/**
 * Nobody is signed in. The Edu frame is asked once (only now, not on every page view): when Edu knows the person the
 * sign-in happens here without a click; the button below is for everybody else and is always there.
 */
function SignInStep({ lang, onSignedIn }: { lang: string; onSignedIn: () => void }) {
  const { t } = useT(lang);
  const edu = useEduContinue({ auto: true, onSignedIn });
  const back = reviewReturnPath(window.location.pathname);
  const href = `/${lang}/signup${back ? `?next=${encodeURIComponent(back)}` : ''}`;

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold">{t('reviews.signInTitle')}</p>
        <p className="mt-1 text-sm leading-6 text-foreground/70">{t('reviews.signInText')}</p>
      </div>

      {(edu.phase === 'checking' || edu.phase === 'ready' || edu.phase === 'signing') && (
        <p role="status" className="flex items-center gap-2 text-sm text-foreground/70">
          <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          {edu.phase === 'checking'
            ? t('reviews.checkingEdu')
            : t('reviews.signingInAs').replace('{name}', edu.session?.name || 'Duxtur Edu')}
        </p>
      )}
      {edu.phase === 'failed' && edu.failure && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {t(`eduBridge.${edu.failure}`)}
        </p>
      )}

      <Link
        href={href}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {t('reviews.signInButton')}
      </Link>
    </div>
  );
}
