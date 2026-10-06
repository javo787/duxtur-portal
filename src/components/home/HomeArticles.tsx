import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { getT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import { LANG_ENDONYMS, resolveListLanguage, type ArticleLang } from '@/lib/article-lang';
import { btnPrimary } from '@/app/[lang]/clinics/[slug]/_components/shared';
import SectionHeader from './SectionHeader';

type Ml = Record<string, string> | null | undefined;
type ListedArticle = {
  _id: string;
  slug: string;
  title?: Ml;
  overview?: Ml;
  image?: string;
  category?: string;
  isVerified?: boolean;
  authorId?: { name?: string; specialty?: Ml } | null;
};

const excerpt = (md: string) => md.replace(/[#*`_>\[\]]/g, '').replace(/\s+/g, ' ').trim();

function Meta({ category, verified, foreign }: { category: string; verified: string; foreign: { code: string; name: string } | null }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      {category && <span className="font-medium text-primary">{category}</span>}
      {verified && (
        <span className="inline-flex items-center gap-1 font-medium text-ok">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {verified}
        </span>
      )}
      {foreign && <span lang={foreign.code}>{foreign.name}</span>}
    </p>
  );
}

function Byline({ name, specialty }: { name: string; specialty: string }) {
  if (!name) return null;
  return (
    <p className="text-sm">
      <span className="font-medium">{name}</span>
      {specialty && <span className="text-muted-foreground">, {specialty}</span>}
    </p>
  );
}

export default function HomeArticles({ lang, articles, dict }: { lang: string; articles: ListedArticle[]; dict: Record<string, string> }) {
  const t = getT(lang);

  // One language per article, taken from the same text; marked when it is not the reader's
  const items = articles
    .map(a => ({ a, l: resolveListLanguage(a, lang).contentLang as ArticleLang }))
    .filter(({ a, l }) => !!a.title?.[l]);

  if (items.length === 0) {
    return (
      <section className="border-b border-border py-16 text-center md:py-24">
        <div className="mx-auto max-w-xl px-4">
          <p className="font-clinic text-2xl font-semibold">{t('home.articlesComingSoon')}</p>
          <p className="mt-2 text-muted-foreground">{t('home.articlesComingSoonSub')}</p>
          <Link href={`/${lang}/register`} className={`${btnPrimary} mt-6`}>
            {t('home.articlesBecomeFirst')}
          </Link>
        </div>
      </section>
    );
  }

  const specialtyOf = (a: ListedArticle) => a.authorId?.specialty?.[lang] || a.authorId?.specialty?.ru || '';
  const categoryOf = (a: ListedArticle) => {
    if (!a.category || a.category === 'general') return '';
    const key = `blog.category${a.category[0].toUpperCase()}${a.category.slice(1)}`;
    return t(key) === key ? '' : t(key);
  };
  const metaProps = (a: ListedArticle, l: ArticleLang) => ({
    category: categoryOf(a),
    verified: a.isVerified ? dict.blog_verified : '',
    foreign: l !== lang ? { code: l, name: LANG_ENDONYMS[l] } : null,
  });
  const bylineProps = (a: ListedArticle) => ({ name: a.authorId?.name ?? '', specialty: specialtyOf(a) });

  const [first, ...rest] = items;
  const feat = first.a;

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeader title={dict.blog_title} href={`/${lang}/blog`} linkLabel={t('nav.allArticles')} />

        {/* Featured: the newest article, with its picture only if it has one */}
        <article data-reveal="" className={`group relative grid overflow-hidden rounded-[10px] border border-border bg-card transition-colors duration-300 ease-premium hover:border-foreground/25 ${feat.image ? 'md:grid-cols-[1.1fr_1fr]' : ''}`}>
          {feat.image && (
            <div className="relative aspect-[16/10] bg-muted md:aspect-auto md:min-h-[22rem]">
              <Image
                src={getOptimizedCloudinaryUrl(feat.image, { width: 900, height: 600, crop: 'fill' })}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 560px, 100vw"
                className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.035]"
              />
            </div>
          )}
          <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
            <Meta {...metaProps(feat, first.l)} />
            <h3 lang={first.l !== lang ? first.l : undefined} className="font-clinic text-[1.625rem] leading-[1.15] font-semibold tracking-[-0.01em] text-balance md:text-[2.125rem]">
              <Link href={`/${lang}/blog/${feat.slug}`} className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                {feat.title?.[first.l]}
              </Link>
            </h3>
            {feat.overview?.[first.l] && (
              <p lang={first.l !== lang ? first.l : undefined} className="line-clamp-3 max-w-[56ch] leading-7 text-muted-foreground">
                {excerpt(feat.overview[first.l])}
              </p>
            )}
            <Byline {...bylineProps(feat)} />
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline underline-offset-4">
              {dict.read_more} <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-premium group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </article>

        {rest.length > 0 && (
          <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(0, 6).map(({ a, l }, i) => (
              <li key={a._id} data-reveal="" style={{ '--i': i % 3 } as React.CSSProperties} className="border-t border-border pt-5 transition-colors duration-300 ease-premium has-[a:hover]:border-foreground/40">
                <article className="group relative flex h-full flex-col gap-2.5">
                  <Meta {...metaProps(a, l)} />
                  <h3 lang={l !== lang ? l : undefined} className="font-clinic text-xl leading-snug font-semibold text-balance">
                    <Link href={`/${lang}/blog/${a.slug}`} className="after:absolute after:inset-0 group-hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                      {a.title?.[l]}
                    </Link>
                  </h3>
                  {a.overview?.[l] && (
                    <p lang={l !== lang ? l : undefined} className="line-clamp-2 text-[0.9375rem] leading-6 text-muted-foreground">
                      {excerpt(a.overview[l])}
                    </p>
                  )}
                  <Byline {...bylineProps(a)} />
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
