'use client';

import Link from 'next/link';
import { Languages } from 'lucide-react';
import { LANG_ENDONYMS, type ArticleLang } from '@/lib/article-lang';
import { btnPrimary } from '@/app/[lang]/clinics/[slug]/_components/shared';

interface Props {
  slug: string;
  /** Language the text on this page is actually in. */
  contentLang: ArticleLang;
  /** Other languages the article exists in. */
  others: ArticleLang[];
  title: string;
  body: string;
  switchLabel: string;
  alsoLabel: string;
}

/**
 * Shown when the article has no version in the reader's language. The text is already on screen in
 * the language it exists in, so nobody lands on an empty page; this explains it and offers to move
 * the whole site to that language. Plain links, so it works without JavaScript; the click also
 * stores the choice, like the header language switcher does.
 */
export default function ArticleLanguageNotice({ slug, contentLang, others, title, body, switchLabel, alsoLabel }: Props) {
  const remember = (l: ArticleLang) => {
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000;SameSite=Lax`;
  };

  return (
    <aside role="note" className="mt-6 rounded-[10px] border border-border bg-muted p-4 md:mt-8 md:p-5">
      <p className="flex items-center gap-2 font-semibold">
        <Languages className="size-4 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1 text-[0.9375rem] leading-6 text-foreground/80">{body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href={`/${contentLang}/blog/${slug}`} hrefLang={contentLang} onClick={() => remember(contentLang)} className={btnPrimary}>
          {switchLabel}
        </Link>
        {others.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 text-sm">
            <span className="text-foreground/65">{alsoLabel}</span>
            {others.map(l => (
              <Link
                key={l}
                href={`/${l}/blog/${slug}`}
                hrefLang={l}
                onClick={() => remember(l)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {LANG_ENDONYMS[l]}
              </Link>
            ))}
          </p>
        )}
      </div>
    </aside>
  );
}
