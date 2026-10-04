import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getT, T } from '@/i18n';
import FadeIn from '@/components/FadeIn';
import { buildAlternates, BASE_URL } from '@/lib/seo';
import Image from 'next/image';

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
};

export const revalidate = 1800; // ISR — обновление каждые 30 минут

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const { page } = (await searchParams) as { category?: string; page?: string };

  return {
    title: T('blog.title', lang),
    description: T('home.authorsSubtitle', lang),
    alternates: buildAlternates('blog', lang),
    ...(page && parseInt(page) > 1 ? { robots: { index: false, follow: true } } : {}),
    other: {
      'link:rss': `${BASE_URL}/${lang}/feed.xml`,
    },
    openGraph: {
      title: T('blog.title', lang),
      description: T('home.authorsSubtitle', lang),
      type: 'website',
      images: [`${BASE_URL}/og-blog.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: T('blog.title', lang),
      description: T('home.authorsSubtitle', lang),
    },
  };
}

const CATEGORIES = [
  { label: { ru: 'Все',          uz: 'Barchasi',      tg: 'Ҳама',        kk: 'Барлығы',   ky: 'Баары'        }, slug: '',            icon: '📋' },
  { label: { ru: 'Кардиология',  uz: 'Kardiologiya',  tg: 'Кардиология', kk: 'Кардиология', ky: 'Кардиология' }, slug: 'cardiology',  icon: '❤️' },
  { label: { ru: 'Неврология',   uz: 'Nevrologiya',   tg: 'Неврология',  kk: 'Неврология', ky: 'Неврология'  }, slug: 'neurology',   icon: '🧠' },
  { label: { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' }, slug: 'dentistry', icon: '🦷' },
  { label: { ru: 'Педиатрия',    uz: 'Pediatriya',    tg: 'Педиатрия',   kk: 'Педиатрия', ky: 'Педиатрия'   }, slug: 'pediatrics',  icon: '👶' },
  { label: { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' }, slug: 'dermatology', icon: '🩺' },
];

export default async function BlogListPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const t = getT(lang);
  const { category } = await searchParams;

  await dbConnect();
  void Doctor; // ensure Doctor model registered for populate

  const query: any = {};
  if (category) query.category = category;

  const articles: any[] = await Article.find(query)
    .sort({ createdAt: -1 })
    .populate('authorId', 'name image specialty slug')
    .select('slug title overview image authorId createdAt category ratings')
    .lean();

  const dbT = (field: any): string => {
    if (!field) return '';
    return field[lang] || field['ru'] || field['uz'] || field['tg'] || field['kk'] || field['ky'] || '';
  };

  const validArticles = articles.filter((a) => dbT(a.title).length > 0);

  // ── CollectionPage JSON-LD ────────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('blog.title'),
    url: `${BASE_URL}/${lang}/blog`,
    description: t('blog.title'),
    numberOfItems: validArticles.length,
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.org',
      url: BASE_URL,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Duxtur.org', item: `${BASE_URL}/${lang}` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/${lang}/blog` },
        ...(category ? [{ '@type': 'ListItem', position: 3, name: category, item: `${BASE_URL}/${lang}/blog?category=${category}` }] : []),
      ],
    },
    // Топ 5 статей как ItemList для Google Discover
    ...(validArticles.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: validArticles.slice(0, 5).map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE_URL}/${lang}/blog/${a.slug}`,
          name: dbT(a.title),
        })),
      },
    }),
  };

  const countLabel = `${validArticles.length} ${t('common.articles')}`;

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] antialiased selection:bg-[#89f5e7] selection:text-[#00201d] pb-24 md:pb-12 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="bg-[#faf8ff] dark:bg-[#283044] docked full-width top-0 sticky z-50 shadow-sm dark:shadow-none transition-shadow duration-200">
        <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-6">
            <Link href={`/${lang}`} className="flex items-center gap-2 group text-[#00685f] dark:text-[#6bd8cb]">
              <div className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#00685f] group-hover:bg-[#00685f] group-hover:text-white transition-colors duration-150">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">duxtur<span className="text-[#0d9488]">.org</span></span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 pl-4">
               <Link href={`/${lang}/authors`} className="text-[#00685f] dark:text-[#6bd8cb] font-medium px-3 py-1.5 rounded-lg hover:bg-[#eaedff] dark:hover:bg-[#e2e7ff] transition-colors duration-150">
                 {t('nav.authors')}
               </Link>
               <Link href={`/${lang}`} className="text-[#3d4947] dark:text-[#dae2fd] px-3 py-1.5 rounded-lg hover:bg-[#eaedff] dark:hover:bg-[#e2e7ff] transition-colors duration-150">
                 {t('nav.home')}
               </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-8 w-full pt-6">
        {/* HERO */}
        <section className="mb-8">
           <FadeIn>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-[#3d4947] mb-4">
              <Link className="hover:text-[#00685f] transition-colors" href={`/${lang}`}>{t('nav.home')}</Link>
              <span className="text-[#bcc9c6]">/</span>
              <span aria-current="page" className="text-[#00685f] font-semibold">{t('blog.title')}</span>
              {category && (
                <>
                  <span className="text-[#bcc9c6]">/</span>
                  <span aria-current="page" className="text-[#00685f] font-semibold">
                     {t(`blog.category${category.charAt(0).toUpperCase() + category.slice(1)}`)}
                  </span>
                </>
              )}
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-5xl font-extrabold text-[#131b2e] mb-3 tracking-tight font-serif">
                  {t('blog.title')}
                </h1>
                <p className="text-base text-[#3d4947] leading-relaxed">
                  {t('home.authorsSubtitle')}
                </p>
              </div>
              <div className="inline-flex items-center flex-wrap gap-3 px-4 py-2.5 bg-[#f2f3ff] rounded-xl border border-[#bcc9c6]/60 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#131b2e]">
                   <span className="text-[#00685f] font-bold">{countLabel}</span>
                </div>
                 <span className="text-[#bcc9c6]">•</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#131b2e]">
                  <span className="text-[#006398] font-bold">{t('blog.verified')}</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* КАТЕГОРИИ */}
        <section className="mb-10">
          <FadeIn>
            <div
              className="flex items-center gap-2 overflow-x-auto py-1"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}
            >
              {CATEGORIES.map((cat) => {
                const isActive = (category || '') === cat.slug;
                const href = cat.slug ? `/${lang}/blog/c/${cat.slug}` : `/${lang}/blog`;
                return (
                  <Link
                    key={cat.slug}
                    href={href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-[#00685f] text-white shadow-sm hover:bg-[#008378]'
                        : 'bg-white text-[#3d4947] border border-[#bcc9c6] hover:bg-[#f2f3ff] hover:text-[#00685f]'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {t(`blog.category${cat.slug ? cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1) : 'All'}`)}
                  </Link>
                );
              })}
            </div>
          </FadeIn>
        </section>

        {/* СТАТЬИ */}
        {validArticles.length === 0 ? (
          <FadeIn>
            <div className="bg-white rounded-3xl p-20 text-center border border-[#bcc9c6] shadow-sm">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-xl font-bold text-[#3d4947] mb-2">{t('blog.comingSoon')}</p>
              <Link
                href={`/${lang}/register`}
                className="inline-flex mt-6 px-8 py-3 bg-[#00685f] text-white rounded-full font-bold hover:bg-[#008378] transition"
              >
                {t('home.ctaBtn')}
              </Link>
            </div>
          </FadeIn>
        ) : (
          <>
            {/* Первая статья — крупная featured */}
            <FadeIn delay={100}>
              <section className="mb-14">
                <article className="bg-white border border-[#bcc9c6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-full">
                       <Link href={`/${lang}/blog/${validArticles[0].slug}`}>
                        <Image
                          src={validArticles[0].image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900'}
                          alt={dbT(validArticles[0].title)}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-700"
                          priority={true}
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </Link>
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        {validArticles[0].category && validArticles[0].category !== 'general' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur text-[#00685f] text-xs font-semibold rounded-full shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#00685f] animate-pulse"></span>
                            {CATEGORIES.find((c) => c.slug === validArticles[0].category)?.icon}{' '}
                            {t(`blog.category${validArticles[0].category.charAt(0).toUpperCase() + validArticles[0].category.slice(1)}`)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00855d]/10 border border-[#006948]/20 text-[#006948] text-xs font-semibold mb-4">
                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                           </svg>
                           <span>{t('blog.verified')}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-[#131b2e] mb-4 hover:text-[#00685f] transition-colors font-serif leading-tight">
                          <Link href={`/${lang}/blog/${validArticles[0].slug}`}>
                            {dbT(validArticles[0].title)}
                          </Link>
                        </h2>
                        <p className="text-base text-[#3d4947] mb-6 leading-relaxed line-clamp-3">
                          {dbT(validArticles[0].overview)}
                        </p>
                      </div>
                      <div className="pt-6 border-t border-[#eaedff]">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={validArticles[0].authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                              alt={validArticles[0].authorId?.name || 'Doctor'}
                              className="w-12 h-12 rounded-full object-cover border-2 border-[#89f5e7]"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base font-semibold text-[#131b2e]">
                                  {validArticles[0].authorId?.name || 'Dr.'}
                                </span>
                                 <svg className="w-4 h-4 text-[#00685f]" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                 </svg>
                              </div>
                              <p className="text-xs text-[#3d4947]">{dbT(validArticles[0].authorId?.specialty)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                            <Link
                              href={`/${lang}/blog/${validArticles[0].slug}`}
                              className="inline-flex items-center gap-2 bg-[#00685f] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#008378] transition-all active:scale-95 shadow-sm"
                            >
                              <span>{t('blog.readMore')}</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            </FadeIn>

            {/* Остальные — сетка */}
            {validArticles.length > 1 && (
              <section className="mb-14">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#131b2e] font-serif">Latest Peer-Reviewed Articles</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {validArticles.slice(1).map((article, i) => {
                    const avgRating =
                      article.ratings?.length > 0
                        ? (article.ratings.reduce((a: number, b: number) => a + b, 0) / article.ratings.length).toFixed(1)
                        : null;
                    return (
                      <FadeIn key={article._id} delay={i * 60} direction="up">
                        <article className="bg-white border border-[#bcc9c6] rounded-2xl p-6 flex flex-col justify-between hover:border-[#00685f]/50 hover:shadow-md transition-all duration-300 group h-full">
                          <div>
                            <Link href={`/${lang}/blog/${article.slug}`} className="block relative rounded-xl overflow-hidden mb-4 aspect-video">
                              <Image
                                src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                                alt={dbT(article.title)}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                              {article.category && article.category !== 'general' && (
                                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur text-[#00685f] text-xs font-semibold shadow-sm">
                                  {CATEGORIES.find((c) => c.slug === article.category)?.icon}{' '}
                                  {t(`blog.category${article.category.charAt(0).toUpperCase() + article.category.slice(1)}`)}
                                </span>
                              )}
                              {avgRating && (
                                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-yellow-400 text-xs font-bold flex items-center gap-1">
                                  ★ {avgRating}
                                </span>
                              )}
                            </Link>
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00855d]/10 text-[#006948] text-xs font-semibold mb-3">
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                               </svg>
                              <span>{t('blog.verified')}</span>
                            </div>
                            <h4 className="text-lg font-bold text-[#131b2e] group-hover:text-[#00685f] transition-colors mb-2 leading-snug line-clamp-2">
                              <Link href={`/${lang}/blog/${article.slug}`}>
                                {dbT(article.title)}
                              </Link>
                            </h4>
                            {dbT(article.overview) && (
                              <p className="text-sm text-[#3d4947] line-clamp-2 mb-4 leading-relaxed">
                                {dbT(article.overview)}
                              </p>
                            )}
                          </div>
                          <div className="pt-4 border-t border-[#eaedff] flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2 min-w-0">
                               <img
                                  src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                                  alt={article.authorId?.name || 'Doctor'}
                                  className="w-8 h-8 rounded-full object-cover border border-[#bcc9c6] shrink-0"
                                />
                               <span className="text-xs font-semibold text-[#131b2e] truncate">
                                  {article.authorId?.name || 'Dr.'}
                               </span>
                            </div>
                             <span className="text-xs text-[#3d4947] shrink-0">
                                {new Date(article.createdAt).toLocaleDateString(lang, {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                             </span>
                          </div>
                        </article>
                      </FadeIn>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}