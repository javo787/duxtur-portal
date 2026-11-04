/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';
import FadeIn from '@/components/FadeIn';
import { buildAlternates, buildBreadcrumbJsonLd, buildPageUrl, BASE_URL, safeJsonLd } from '@/lib/seo';
import { getT, T } from '@/i18n';
import Image from 'next/image';
import { LANG_ENDONYMS, resolveListLanguage, type ArticleLang } from '@/lib/article-lang';
import { notFound } from 'next/navigation';
import { cache } from 'react';

type Props = {
  params: Promise<{ lang: string; category: string }>;
};

const CATEGORIES = [
  { label: { ru: 'Все',          uz: 'Barchasi',      tg: 'Ҳама',        kk: 'Барлығы',   ky: 'Баары'        }, slug: '',            icon: '📋' },
  { label: { ru: 'Кардиология',  uz: 'Kardiologiya',  tg: 'Кардиология', kk: 'Кардиология', ky: 'Кардиология' }, slug: 'cardiology',  icon: '❤️' },
  { label: { ru: 'Неврология',   uz: 'Nevrologiya',   tg: 'Неврология',  kk: 'Неврология', ky: 'Неврология'  }, slug: 'neurology',   icon: '🧠' },
  { label: { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' }, slug: 'dentistry', icon: '🦷' },
  { label: { ru: 'Педиатрия',    uz: 'Pediatriya',    tg: 'Педиатрия',   kk: 'Педиатрия', ky: 'Педиатрия'   }, slug: 'pediatrics',  icon: '👶' },
  { label: { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' }, slug: 'dermatology', icon: '🩺' },
];

// Built at deploy time, so without this a category stays as it was built ("0 articles", noindex) until the next deploy.
// The editor actions also revalidate it on save; this is the safety net for every other way an article changes.
export const revalidate = 1800;

/** The articles the page lists: one language each, and only those with a title in it. Metadata and page share it,
 * so "noindex" and "0 articles" can never disagree. cache(): one database query per request for both. */
const listedArticles = cache(async (category: string, lang: string) => {
  await dbConnect();
  void Doctor;
  const articles: any[] = await Article.find({ category })
    .sort({ createdAt: -1 })
    .populate('authorId', 'name image specialty slug')
    .select('slug title overview image authorId createdAt category ratings')
    .lean();
  return articles
    .map((a) => ({ ...a, _lang: resolveListLanguage(a, lang).contentLang as ArticleLang }))
    .filter((a) => (a.title?.[a._lang] || '').trim().length > 0);
});

export async function generateStaticParams() {
  const languages = ['ru', 'uz', 'tg', 'kk', 'ky'];
  const categories = CATEGORIES.filter(c => c.slug).map(c => c.slug);
  return languages.flatMap(lang => categories.map(category => ({ lang, category })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category } = await params;
  const categoryInfo = CATEGORIES.find(c => c.slug === category);
  if (!categoryInfo) return notFound();

  const categoryName = T(`blog.category${category.charAt(0).toUpperCase() + category.slice(1)}`, lang);
  const path = `blog/c/${category}`;
  // An empty category ("Статьи скоро появятся") is a page with no content: kept out of the index (and out of the
  // sitemap, see sitemap-entries.ts) until its first article. follow: its links to the blog and doctors still count.
  const empty = (await listedArticles(category, lang)).length === 0;

  return {
    title: categoryName,
    description: `${categoryName}. ${T('blog.description', lang)}`,
    alternates: empty ? { canonical: buildPageUrl(lang, path) } : buildAlternates(path, lang),
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { lang, category } = await params;
  const t = getT(lang);
  const categoryInfo = CATEGORIES.find(c => c.slug === category);
  if (!categoryInfo) notFound();

  // One language per article, marked when it is not the reader's (same rule as the blog index)
  const validArticles = await listedArticles(category, lang);
  const dbT = (a: { _lang: string }, field: Record<string, string> | undefined | null): string => field?.[a._lang] || '';
  const categoryName = t(`blog.category${category.charAt(0).toUpperCase() + category.slice(1)}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    url: `${BASE_URL}/${lang}/blog/c/${category}`,
    description: `${categoryName} — Duxtur.org`,
    numberOfItems: validArticles.length,
    // Same names as the visible breadcrumb, in the page language
    breadcrumb: Object.fromEntries(
      Object.entries(
        buildBreadcrumbJsonLd([
          { name: t('nav.home'), url: `/${lang}` },
          { name: t('nav.articles'), url: `/${lang}/blog` },
          { name: categoryName, url: `/${lang}/blog/c/${category}` },
        ]),
      ).filter(([key]) => key !== '@context'), // nested inside CollectionPage, which already has it
    ),
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-gray-900">duxtur<span className="text-blue-600">.org</span></span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href={`/${lang}/blog`} className="text-sm text-gray-500 hover:text-gray-900 font-medium transition">
              {t('nav.articles')}
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white pt-14 pb-16 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <nav aria-label="Breadcrumb" className="mb-5 text-xs text-blue-400/70">
              <ol className="flex items-center justify-center gap-1.5">
                <li><Link href={`/${lang}`} className="hover:text-blue-300 transition">{t('nav.home')}</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href={`/${lang}/blog`} className="hover:text-blue-300 transition">{t('nav.articles')}</Link></li>
                <li aria-hidden="true">/</li>
                <li><span aria-current="page" className="text-blue-200">{categoryName}</span></li>
              </ol>
            </nav>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              {categoryName}
            </h1>
            <p className="text-blue-200 text-base">{validArticles.length} {t('common.articles')}</p>
            {/* Articles and doctors of one specialty link to each other: a crawler (and a reader) can walk from the text to the people */}
            <Link href={`/${lang}/doctors/${category}`} className="mt-5 inline-block text-sm font-semibold text-blue-200 underline underline-offset-4 transition hover:text-white">
              {t('nav.findDoctor')}: {categoryName} →
            </Link>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* КАТЕГОРИИ (Subset from main blog page) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.slug;
            const href = cat.slug ? `/${lang}/blog/c/${cat.slug}` : `/${lang}/blog`;
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span>{cat.icon}</span>
                  {t(`blog.category${cat.slug ? cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1) : 'All'}`)}
              </Link>
            );
          })}
        </div>

        {validArticles.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-gray-700 mb-2">{t('blog.comingSoon')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {validArticles.map((article, i) => (
              <FadeIn key={article._id} delay={i * 60} direction="up">
                <Link
                  href={`/${lang}/blog/${article.slug}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition duration-300 h-full"
                >
                  <div className="h-52 overflow-hidden relative shrink-0">
                    <Image
                      src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                      alt={dbT(article, article.title)}
                      fill
                      className="object-cover group-hover:scale-110 transition duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {article._lang !== lang && (
                      <span lang={article._lang} className="mb-2 self-start rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                        {LANG_ENDONYMS[article._lang as ArticleLang]}
                      </span>
                    )}
                    <h3 lang={article._lang !== lang ? article._lang : undefined} className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-2 flex-1 mb-3 text-base">
                      {dbT(article, article.title)}
                    </h3>
                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                          alt={article.authorId?.name}
                          className="w-7 h-7 rounded-full object-cover border border-gray-100"
                        />
                        <span className="text-xs text-gray-500 truncate font-medium">{article.authorId?.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(article.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
