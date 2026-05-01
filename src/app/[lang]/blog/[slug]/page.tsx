import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';
import Link from 'next/link';
import ArticleEngagement from '@/components/ArticleEngagement';
import ShareButtons from '@/components/ShareButtons';
import { buildAlternates } from '@/lib/seo';

const uiLabels: Record<string, Record<string, string>> = {
  verified:        { ru: 'Проверено врачом',    uz: 'Tekshirilgan',          tg: 'Тасдиқшуда',          kk: 'Тексерілген',      ky: 'Текшерилген'        },
  contents:        { ru: 'Содержание',           uz: 'Mundarija',             tg: 'Мундариҷа',           kk: 'Мазмұны',          ky: 'Мазмуну'            },
  sources:         { ru: 'Источники',            uz: 'Manbalar',              tg: 'Сарчашмаҳо',          kk: 'Дереккөздер',      ky: 'Булактар'           },
  back:            { ru: 'Главная',              uz: 'Bosh sahifa',           tg: 'Саҳифаи асосӣ',       kk: 'Басты бет',        ky: 'Башкы бет'          },
  readmin:         { ru: 'мин чтения',           uz: 'daqiqa o\'qish',        tg: 'дақиқаи хондан',      kk: 'мин оқу',          ky: 'мүн окуу'           },
  author:          { ru: 'Об авторе',            uz: 'Muallif haqida',        tg: 'Дар бораи муаллиф',   kk: 'Автор туралы',     ky: 'Автор жөнүндө'      },
  articles:        { ru: 'Все статьи автора →',  uz: 'Muallif maqolalari →',  tg: 'Мақолаҳои муаллиф →', kk: 'Автор мақалалары →', ky: 'Автордун макалалары →' },
  related:         { ru: 'Похожие статьи',       uz: 'O\'xshash maqolalar',   tg: 'Мақолаҳои монанд',    kk: 'Ұқсас мақалалар',  ky: 'Окшош макалалар'    },
  disclaimer:      { ru: 'Важно',                uz: 'Muhim',                 tg: 'Муҳим',               kk: 'Маңызды',          ky: 'Маанилүү'           },
  published:       { ru: 'Опубликовано',         uz: 'Chop etilgan',          tg: 'Нашр шуд',            kk: 'Жарияланды',       ky: 'Жарыяланды'         },
  updated:         { ru: 'Обновлено',            uz: 'Yangilangan',           tg: 'Навсозӣ шуд',         kk: 'Жаңартылды',       ky: 'Жаңыртылды'         },
  medicalReview:   { ru: 'Медицинская проверка', uz: 'Tibbiy tekshiruv',      tg: 'Тафтиши тиббӣ',       kk: 'Медициналық тексеру', ky: 'Медициналык текшерүү' },
  reviewedByLabel: { ru: 'Проверено',            uz: 'Tekshirdi',             tg: 'Тасдиқ шуд',          kk: 'Тексерді',         ky: 'Текшерди'           },
  faqTitle:        { ru: 'Часто задаваемые вопросы', uz: 'Ko\'p so\'raladigan savollar', tg: 'Саволҳои зуд-зуд', kk: 'Жиі қойылатын сұрақтар', ky: 'Көп берилүүчү суроолор' },
  disclaimer_text: {
    ru: 'Эта статья носит информационный характер и не заменяет консультацию врача. При наличии симптомов обратитесь к специалисту.',
    uz: 'Bu maqola ma\'lumot maqsadida bo\'lib, shifokor maslahatini almashtirmaydi.',
    tg: 'Ин мақола иттилоотӣ аст ва ҷойгузини машварати духтур намешавад.',
    kk: 'Бұл мақала ақпараттық сипатта және дәрігер кеңесін алмастырмайды.',
    ky: 'Бул макала маалыматтык мүнөздө жана дарыгердин кеңешин алмаштырбайт.',
  },
};

const L = (key: string, lang: string) => uiLabels[key]?.[lang] || uiLabels[key]?.ru || key;

// ─── ISR: регенерация каждые 6 часов ────────────────────────────────────────
export const revalidate = 21600;

// ─── Static params: pre-build топ статей ────────────────────────────────────
export async function generateStaticParams() {
  await dbConnect();
  const articles = await Article.find({})
    .select('slug')
    .limit(50)
    .lean();
  const langs = ['ru', 'uz', 'tg', 'kk', 'ky'];
  return articles.flatMap((a: any) =>
    langs.map((lang) => ({ slug: a.slug, lang }))
  );
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}): Promise<Metadata> {
  await dbConnect();
  const { slug, lang } = await params;
  const article = await Article.findOne({ slug }).lean() as any;
  if (!article) return { title: 'Not Found' };
  const t = (f: any) => (f && (f[lang] || f['ru'])) || '';
  const title = `${t(article.title)} | Duxtur.com`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://duxtur-portal.vercel.app";
  const description = t(article.overview).substring(0, 160);
const ogImage = article.image
  ? article.image.startsWith('http')
    ? article.image
    : `${baseUrl}${article.image}`
  : `${baseUrl}/og-default.png`;

return {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [ogImage],
    type: 'article',
    publishedTime: article.createdAt
      ? new Date(article.createdAt).toISOString()
      : undefined,
    modifiedTime: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : undefined,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
  alternates: buildAlternates(`blog/${slug}`, lang),
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  await dbConnect();
  const { slug, lang } = await params;
  const article: any = await Article.findOne({ slug })
    .populate('authorId')
    .populate('reviewedById')
    .lean();
  if (!article) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur-portal.vercel.app';

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  // ── Время чтения ──────────────────────────────────────────────────────────
  const fullText = [
    t(article.overview), t(article.symptoms), t(article.causes),
    t(article.diagnosis_treatment), t(article.prevention),
    ...[1, 2, 3, 4, 5].map((i) => t(article[`section${i}_content`])),
  ].join(' ');
  const readingMinutes = Math.max(1, Math.ceil(fullText.split(' ').length / 200));

  // ── Средний рейтинг ───────────────────────────────────────────────────────
  const avgRating =
    article.ratings?.length > 0
      ? Math.round(
          (article.ratings.reduce((a: number, b: number) => a + b, 0) /
            article.ratings.length) *
            10
        ) / 10
      : 0;

  // ── Похожие статьи — по категории, fallback по автору ────────────────────
  let relatedArticles: any[] = [];
  if (article.category) {
    relatedArticles = await Article.find({
      category: article.category,
      slug: { $ne: slug },
    })
      .limit(3)
      .select('slug title image overview')
      .lean();
  }
  if (relatedArticles.length === 0) {
    relatedArticles = await Article.find({
      authorId: article.authorId?._id,
      slug: { $ne: slug },
    })
      .limit(3)
      .select('slug title image overview')
      .lean();
  }

  // ── Даты ──────────────────────────────────────────────────────────────────
  const fmt = (d: any) =>
    d
      ? new Date(d).toLocaleDateString('ru', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;
  const datePublished = fmt(article.createdAt);
  const dateUpdated = fmt(article.updatedAt);
  const dateMedicalReview = fmt(article.lastMedicalReview);

  // ── Секции ────────────────────────────────────────────────────────────────
  const legacySections = [
    { id: 'symptoms',   title: { ru: 'Симптомы',     uz: 'Belgilar',      tg: 'Аломатҳо',  kk: 'Белгілер',  ky: 'Белгилер'   }, content: t(article.symptoms)             },
    { id: 'causes',     title: { ru: 'Причины',      uz: 'Sabablar',      tg: 'Сабабҳо',   kk: 'Себептер',  ky: 'Себептер'   }, content: t(article.causes)               },
    { id: 'treatment',  title: { ru: 'Лечение',      uz: 'Davolash',      tg: 'Табобат',   kk: 'Емдеу',     ky: 'Дарылоо'    }, content: t(article.diagnosis_treatment)  },
    { id: 'prevention', title: { ru: 'Профилактика', uz: 'Profilaktika',  tg: 'Пешгирӣ',  kk: 'Алдын алу', ky: 'Алдын алуу' }, content: t(article.prevention)           },
  ]
    .filter((s) => s.content && s.content.length > 0)
    .map((s) => ({ ...s, title: s.title[lang as keyof typeof s.title] || s.title.ru }));

  const dynamicSections = [1, 2, 3, 4, 5]
    .map((i) => ({
      id: `section${i}`,
      title: t(article[`section${i}_title`]),
      content: t(article[`section${i}_content`]),
    }))
    .filter((s) => s.title && s.content);

  const sections = dynamicSections.length > 0 ? dynamicSections : legacySections;

  // ── URLs ──────────────────────────────────────────────────────────────────
  const articleUrl = `${baseUrl}/${lang}/blog/${article.slug}`;
  const authorSlug = article.authorId?.slug || article.authorId?._id;
  const authorUrl = `${baseUrl}/${lang}/doctor/${authorSlug}`;

  // ── FAQ из секций (для Google "People Also Ask") ──────────────────────────
  const faqSections = sections.slice(0, 4);
  const faqJsonLd = faqSections.length > 1
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqSections.map((sec) => ({
          '@type': 'Question',
          name: sec.title,
          acceptedAnswer: {
            '@type': 'Answer',
            text: sec.content.replace(/[#*`_]/g, '').substring(0, 500),
          },
        })),
      }
    : null;

  // ── Article JSON-LD ───────────────────────────────────────────────────────
  const articleJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': ['Article', 'MedicalWebPage'],
    headline: t(article.title),
    description: t(article.overview).substring(0, 160),
    url: articleUrl,
    image: article.image,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    dateReviewed: article.lastMedicalReview || article.updatedAt,
    inLanguage: lang,
    reviewedBy: article.reviewedById
      ? {
          '@type': 'Person',
          '@id': `${baseUrl}/${lang}/doctor/${article.reviewedById?.slug || article.reviewedById?._id}`,
          name: article.reviewedById?.name,
          url: `${baseUrl}/${lang}/doctor/${article.reviewedById?.slug || article.reviewedById?._id}`,
        }
      : undefined,
    author: {
      '@type': 'Person',
      '@id': authorUrl,
      name: article.authorId?.name,
      jobTitle: t(article.authorId?.specialty),
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.com',
      url: baseUrl,
      logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` },
    },
    ...(avgRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        ratingCount: article.ratings?.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Duxtur.com', item: `${baseUrl}/${lang}` },
        { '@type': 'ListItem', position: 2, name: 'Blog',       item: `${baseUrl}/${lang}/blog` },
        { '@type': 'ListItem', position: 3, name: t(article.title), item: articleUrl },
      ],
    },
  };

  // Убираем undefined поля
  Object.keys(articleJsonLd).forEach(
    (k) => articleJsonLd[k] === undefined && delete articleJsonLd[k]
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* FAQ Schema — отдельный тег */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/${lang}`} className="font-extrabold text-blue-600 text-xl">
            duxtur<span className="text-gray-300 font-light">.com</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}/blog`}
              className="text-sm text-gray-400 hover:text-gray-700 font-medium transition hidden md:block"
            >
              Blog
            </Link>
            <Link
              href={`/${lang}`}
              className="text-sm text-gray-400 hover:text-gray-700 font-medium transition"
            >
              ← {L('back', lang)}
            </Link>
          </div>
        </div>
      </header>

      <article className="pb-24">

        {/* HERO */}
        <div className="relative w-full h-72 md:h-[460px] bg-gray-900 overflow-hidden">
          <img
            src={article.image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200'}
            alt={t(article.title)}
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="bg-green-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {L('verified', lang)}
              </span>
              <span className="text-white/60 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readingMinutes} {L('readmin', lang)}
              </span>
              {avgRating > 0 && (
                <span className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                  ★ {avgRating}
                  <span className="text-white/40 font-normal ml-0.5">({article.ratings?.length})</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight max-w-3xl">
              {t(article.title)}
            </h1>
          </div>
        </div>

        {/* АВТОР + ДАТЫ + ПОДЕЛИТЬСЯ */}
        <div className="max-w-5xl mx-auto px-6 py-5 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <Link
              href={`/${lang}/doctor/${article.authorId?.slug || article.authorId?._id}`}
              className="flex items-center gap-3 group"
            >
              <img
                src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={article.authorId?.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-blue-100 group-hover:border-blue-400 transition"
              />
              <div>
                <p className="font-bold text-gray-900 group-hover:text-blue-600 transition text-sm leading-tight">
                  {article.authorId?.name || 'Dr. Expert'}
                </p>
                <p className="text-xs text-blue-500 mt-0.5">{t(article.authorId?.specialty) || 'Врач'}</p>
              </div>
            </Link>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{L('published', lang)}</span>
                <span className="text-xs text-gray-600 font-semibold mt-0.5">{datePublished}</span>
              </div>
              {dateUpdated && dateUpdated !== datePublished && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{L('updated', lang)}</span>
                  <span className="text-xs text-gray-600 font-semibold mt-0.5">{dateUpdated}</span>
                </div>
              )}
              {dateMedicalReview && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-green-600 font-medium uppercase tracking-wider">{L('medicalReview', lang)}</span>
                  <span className="text-xs text-green-700 font-semibold mt-0.5">{dateMedicalReview}</span>
                </div>
              )}
              {article.reviewedById ? (
                <Link
                  href={`/${lang}/doctor/${article.reviewedById?.slug || article.reviewedById?._id}`}
                  className="inline-flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-2.5 py-1.5 rounded-full font-medium hover:bg-green-100 transition"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {L('reviewedByLabel', lang)}: <span className="font-bold ml-1">{article.reviewedById?.name}</span>
                </Link>
              ) : article.reviewedBy ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-2.5 py-1.5 rounded-full font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {L('reviewedByLabel', lang)}: {article.reviewedBy}
                </span>
              ) : null}
              <ShareButtons url={articleUrl} title={t(article.title)} lang={lang} />
            </div>
          </div>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ЛЕВАЯ ЧАСТЬ */}
          <div className="lg:col-span-8">

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-8">
              <ol className="flex items-center gap-1.5 flex-wrap text-xs text-gray-400">
                <li><Link href={`/${lang}`} className="hover:text-blue-600 transition font-medium">Duxtur.com</Link></li>
                <li className="select-none">/</li>
                <li><Link href={`/${lang}/blog`} className="hover:text-blue-600 transition font-medium">Blog</Link></li>
                <li className="select-none">/</li>
                <li className="text-gray-600 line-clamp-1 max-w-xs">{t(article.title)}</li>
              </ol>
            </nav>

            {/* Overview */}
            <div className="text-lg leading-8 text-gray-700 mb-10 font-medium border-l-4 border-blue-200 pl-6 italic">
              <ReactMarkdown>{t(article.overview)}</ReactMarkdown>
            </div>

            {/* Оглавление */}
            {sections.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-6 mb-12 border border-blue-100">
                <h3 className="font-extrabold text-sm text-blue-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full" />
                  {L('contents', lang)}
                </h3>
                <ul className="space-y-2">
                  {sections.map((sec, i) => (
                    <li key={sec.id}>
                      <a
                        href={`#${sec.id}`}
                        className="flex items-center gap-3 text-blue-700 hover:text-blue-900 font-medium group text-sm py-1"
                      >
                        <span className="w-6 h-6 rounded-full bg-white text-blue-600 text-xs font-extrabold flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition">
                          {i + 1}
                        </span>
                        <span className="group-hover:underline">{sec.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Секции */}
            <div className="space-y-14">
              {sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-20">
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-blue-500 rounded-full shrink-0" />
                    {sec.title}
                  </h2>
                  <div className="prose prose-lg prose-slate max-w-none text-gray-700 leading-8">
                    <ReactMarkdown
                      components={{
                        strong: ({ node, ...props }) => <strong className="font-extrabold text-gray-900" {...props} />,
                        ul: ({ node, ...props }) => <ul className="space-y-3 list-none pl-0 my-4" {...props} />,
                        li: ({ node, ...props }) => (
                          <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                            <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-blue-500 font-extrabold text-xs">✓</span>
                            <div className="flex-1">{props.children}</div>
                          </li>
                        ),
                      }}
                    >
                      {sec.content}
                    </ReactMarkdown>
                  </div>
                </section>
              ))}
            </div>

            {/* Дисклеймер */}
            <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="font-extrabold text-amber-800 text-sm mb-1">{L('disclaimer', lang)}</p>
                <p className="text-amber-700 text-sm leading-relaxed">{L('disclaimer_text', lang)}</p>
              </div>
            </div>

            {/* Источники */}
            {article.references?.length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-100">
                <h4 className="font-extrabold text-gray-400 mb-4 text-xs uppercase tracking-widest">
                  {L('sources', lang)}
                </h4>
                <ul className="space-y-2">
                  {article.references.map((ref: string, i: number) => {
                    const urlMatch = ref.match(/(?:https?:\/\/)?(?:www\.)[^\s]+/) || ref.match(/https?:\/\/[^\s]+/);
                    const rawUrl = urlMatch ? urlMatch[0] : null;
                    const href = rawUrl && !rawUrl.startsWith('http') ? 'https://' + rawUrl : rawUrl;
                    const label = rawUrl ? ref.replace(rawUrl, '').trim().replace(/^[-–—:]\s*/, '') : ref;
                    return (
                      <li key={i} className="flex gap-3 text-sm text-gray-500">
                        <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                        {urlMatch ? (
                          <a href={href!} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline leading-relaxed">
                            {label || ref}
                          </a>
                        ) : (
                          <span className="leading-relaxed">{ref}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Engagement */}
            <ArticleEngagement
              slug={article.slug}
              initialRating={avgRating}
              initialRatingCount={article.ratings?.length || 0}
              initialLikesUp={article.likesUp || 0}
              initialLikesDown={article.likesDown || 0}
              lang={lang}
            />

            {/* Поделиться внизу */}
            <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <ShareButtons url={articleUrl} title={t(article.title)} lang={lang} />
            </div>
          </div>

          {/* САЙДБАР */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-5">

              {/* Карточка автора */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 text-white">
                  <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3">{L('author', lang)}</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={article.authorId?.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20"
                    />
                    <div>
                      <p className="font-extrabold text-white leading-tight">{article.authorId?.name || 'Dr. Expert'}</p>
                      <p className="text-blue-300 text-sm mt-0.5">{t(article.authorId?.specialty) || 'Врач'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <span className="bg-green-100 text-green-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 w-fit">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {L('verified', lang)}
                  </span>
                  <Link
                    href={`/${lang}/doctor/${article.authorId?.slug || article.authorId?._id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition"
                  >
                    {L('articles', lang)}
                  </Link>
                </div>
              </div>

              {/* Рейтинг */}
              {avgRating > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-4xl font-extrabold text-gray-900">{avgRating}</p>
                  <div className="flex justify-center my-2 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{article.ratings?.length} оценок</p>
                </div>
              )}

              {/* Похожие статьи */}
              {relatedArticles.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-extrabold text-gray-900 text-sm mb-4 uppercase tracking-wider">
                    {L('related', lang)}
                  </h3>
                  <div className="space-y-3">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel._id}
                        href={`/${lang}/blog/${rel.slug}`}
                        className="flex gap-3 group hover:bg-gray-50 p-2 rounded-xl transition"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                          <img
                            src={rel.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200'}
                            alt={t(rel.title)}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                            {t(rel.title)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
