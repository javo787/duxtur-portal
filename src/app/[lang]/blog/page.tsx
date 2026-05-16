import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';
import FadeIn from '@/components/FadeIn';
import { buildAlternates, BASE_URL } from '@/lib/seo';
import Image from 'next/image';

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
};

export const revalidate = 1800; // ISR — обновление каждые 30 минут

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: 'Все статьи — Duxtur.org',
    uz: 'Barcha maqolalar — Duxtur.org',
    tg: 'Ҳамаи мақолаҳо — Duxtur.org',
    kk: 'Барлық мақалалар — Duxtur.org',
    ky: 'Бардык макалалар — Duxtur.org',
  };
  const descs: Record<string, string> = {
    ru: 'Медицинские статьи от практикующих врачей. Кардиология, неврология, педиатрия и другие специализации.',
    uz: 'Amaliyotchi shifokorlardan tibbiy maqolalar. Kardiologiya, nevrologiya, pediatriya.',
    tg: 'Мақолаҳои тиббӣ аз табибони амалкунанда. Кардиология, неврология, педиатрия.',
    kk: 'Тәжірибелі дәрігерлерден медициналық мақалалар. Кардиология, неврология, педиатрия.',
    ky: 'Практикалык дарыгерлерден медициналык макалалар. Кардиология, неврология, педиатрия.',
  };
  return {
    title: titles[lang] || titles.ru,
    description: descs[lang] || descs.ru,
    alternates: buildAlternates('blog', lang),
    openGraph: {
      title: titles[lang] || titles.ru,
      description: descs[lang] || descs.ru,
      type: 'website',
      images: [`${BASE_URL}/og-blog.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[lang] || titles.ru,
      description: descs[lang] || descs.ru,
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

const UI: Record<string, Record<string, string>> = {
  heading:  { ru: 'Все статьи',       uz: 'Barcha maqolalar', tg: 'Ҳамаи мақолаҳо', kk: 'Барлық мақалалар', ky: 'Бардык макалалар' },
  verified: { ru: 'Проверено врачом', uz: 'Tekshirilgan',      tg: 'Тасдиқшуда',     kk: 'Тексерілген',      ky: 'Текшерилген'      },
  read:     { ru: 'Читать',           uz: "O'qish",            tg: 'Хондан',          kk: 'Оқу',              ky: 'Окуу'             },
  empty:    { ru: 'Статьи скоро появятся', uz: 'Maqolalar tez orada', tg: 'Мақолаҳо ба зудӣ', kk: 'Мақалалар жақында', ky: 'Макалалар жакында' },
  author_cta: { ru: 'Стать автором →', uz: 'Muallif bo\'ling →', tg: 'Муаллиф шавед →', kk: 'Автор болу →', ky: 'Автор болуу →' },
  home:     { ru: 'Главная',          uz: 'Bosh sahifa',       tg: 'Асосӣ',           kk: 'Басты',            ky: 'Башкы'            },
  minread:  { ru: 'мин',              uz: 'daq',               tg: 'дақ',             kk: 'мин',              ky: 'мүн'              },
};
const L = (k: string, lang: string) => UI[k]?.[lang] || UI[k]?.ru || '';

// Правильное русское склонение
function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const { lang } = await params;
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

  const t = (field: any): string => {
    if (!field) return '';
    return field[lang] || field['ru'] || field['uz'] || field['tg'] || field['kk'] || field['ky'] || '';
  };

  const validArticles = articles.filter((a) => t(a.title).length > 0);

  // ── CollectionPage JSON-LD ────────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: L('heading', lang),
    url: `${BASE_URL}/${lang}/blog`,
    description: UI.heading[lang],
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
          name: t(a.title),
        })),
      },
    }),
  };

  const countLabel =
    lang === 'ru'
      ? pluralRu(validArticles.length, 'материал', 'материала', 'материалов')
      : `${validArticles.length} ${lang === 'uz' ? 'ta maqola' : lang === 'tg' ? 'мақола' : lang === 'kk' ? 'мақала' : 'макала'}`;

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-gray-900">duxtur<span className="text-blue-600">.org</span></span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              href={`/${lang}/authors`}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium transition hidden md:block"
            >
              {lang === 'ru' ? 'Врачи' : lang === 'uz' ? 'Shifokorlar' : lang === 'tg' ? 'Духтурон' : lang === 'kk' ? 'Дәрігерлер' : 'Дарыгерлер'}
            </Link>
            <Link
              href={`/${lang}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {L('home', lang)}
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white pt-14 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            {/* Breadcrumb in hero */}
            <nav className="flex items-center justify-center gap-1.5 text-xs text-blue-400/70 mb-5" itemScope itemType="https://schema.org/BreadcrumbList">
              <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href={`/${lang}`} itemProp="item" className="hover:text-blue-300 transition">
                  <span itemProp="name">{L('home', lang)}</span>
                </Link>
                <meta itemProp="position" content="1" />
              </span>
              <span>/</span>
              <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <span itemProp="name" className="text-blue-200">Blog</span>
                <meta itemProp="position" content="2" />
              </span>
              {category && (
                <>
                  <span>/</span>
                  <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <span itemProp="name" className="text-blue-200">
                      {CATEGORIES.find((c) => c.slug === category)?.label[lang as keyof (typeof CATEGORIES)[0]['label']] || category}
                    </span>
                    <meta itemProp="position" content="3" />
                  </span>
                </>
              )}
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {L('verified', lang)}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              {L('heading', lang)}
            </h1>
            <p className="text-blue-200 text-base">{countLabel}</p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* КАТЕГОРИИ */}
        <FadeIn>
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-8"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {CATEGORIES.map((cat) => {
              const isActive = (category || '') === cat.slug;
              const href = cat.slug ? `/${lang}/blog?category=${cat.slug}` : `/${lang}/blog`;
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
                  {cat.label[lang as keyof typeof cat.label] || cat.label.ru}
                </Link>
              );
            })}
          </div>
        </FadeIn>

        {/* СТАТЬИ */}
        {validArticles.length === 0 ? (
          <FadeIn>
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-xl font-bold text-gray-700 mb-2">{L('empty', lang)}</p>
              <Link
                href={`/${lang}/register`}
                className="inline-flex mt-6 px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition"
              >
                {L('author_cta', lang)}
              </Link>
            </div>
          </FadeIn>
        ) : (
          <>
            {/* Первая статья — крупная featured */}
            <FadeIn delay={100}>
              <Link href={`/${lang}/blog/${validArticles[0].slug}`} className="group block mb-8">
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition duration-500 md:grid md:grid-cols-5">
                  <div className="md:col-span-3 h-72 md:h-80 overflow-hidden relative">
                    <Image
                      src={validArticles[0].image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900'}
                      alt={t(validArticles[0].title)}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-700"
                      priority={true}
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    {/* Category badge */}
                    {validArticles[0].category && validArticles[0].category !== 'general' && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                          {CATEGORIES.find((c) => c.slug === validArticles[0].category)?.icon}{' '}
                          {CATEGORIES.find((c) => c.slug === validArticles[0].category)?.label[lang as keyof (typeof CATEGORIES)[0]['label']] || validArticles[0].category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 p-8 flex flex-col justify-between relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-extrabold px-3 py-1.5 rounded-full mb-4">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {L('verified', lang)}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight line-clamp-3 mb-3">
                        {t(validArticles[0].title)}
                      </h2>
                      <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                        {t(validArticles[0].overview)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-5 border-t border-gray-100 mt-4">
                      <div className="relative shrink-0">
                        <img
                          src={validArticles[0].authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                          alt={validArticles[0].authorId?.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {validArticles[0].authorId?.name || 'Dr.'}
                        </p>
                        <p className="text-xs text-blue-500">{t(validArticles[0].authorId?.specialty)}</p>
                      </div>
                      <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                        {L('read', lang)}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>

            {/* Остальные — сетка */}
            {validArticles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {validArticles.slice(1).map((article, i) => {
                  const avgRating =
                    article.ratings?.length > 0
                      ? (article.ratings.reduce((a: number, b: number) => a + b, 0) / article.ratings.length).toFixed(1)
                      : null;
                  return (
                    <FadeIn key={article._id} delay={i * 60} direction="up">
                      <Link
                        href={`/${lang}/blog/${article.slug}`}
                        className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition duration-300 h-full"
                      >
                        {/* Фото */}
                        <div className="h-52 overflow-hidden relative shrink-0">
                          <Image
                            src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                            alt={t(article.title)}
                            fill
                            className="object-cover group-hover:scale-110 transition duration-700"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          {/* Бейджи поверх фото */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            <span className="bg-white/95 backdrop-blur-sm text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm w-fit">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {L('verified', lang)}
                            </span>
                            {article.category && article.category !== 'general' && (
                              <span className="bg-blue-600/85 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full w-fit">
                                {CATEGORIES.find((c) => c.slug === article.category)?.icon}{' '}
                                {CATEGORIES.find((c) => c.slug === article.category)?.label[lang as keyof (typeof CATEGORIES)[0]['label']] || article.category}
                              </span>
                            )}
                          </div>
                          {/* Рейтинг поверх фото */}
                          {avgRating && (
                            <div className="absolute bottom-3 right-3">
                              <span className="bg-black/60 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                ★ {avgRating}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Контент */}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-2 flex-1 mb-3 text-base">
                            {t(article.title)}
                          </h3>
                          {t(article.overview) && (
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                              {t(article.overview)}
                            </p>
                          )}
                          <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2 mt-auto">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative shrink-0">
                                <img
                                  src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                                  alt={article.authorId?.name}
                                  className="w-7 h-7 rounded-full object-cover border border-gray-100"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white" />
                              </div>
                              <span className="text-xs text-gray-500 truncate font-medium">
                                {article.authorId?.name || 'Dr.'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">
                              {new Date(article.createdAt).toLocaleDateString('ru', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </FadeIn>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
