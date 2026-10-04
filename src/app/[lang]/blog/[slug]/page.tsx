import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import ReactMarkdown, { type Components } from 'react-markdown';
import { getT, T } from '@/i18n';
import type { Metadata } from 'next';
import Link from 'next/link';
import ArticleEngagement from '@/components/ArticleEngagement';
import ArticleShare from '@/components/ArticleShare';
import { buildAlternates, BASE_URL, buildBreadcrumbJsonLd } from '@/lib/seo';
import TableOfContents from '@/components/TableOfContents';
import Image from 'next/image';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import ViewCounter from '@/components/ViewCounter';
import { ShieldCheck } from 'lucide-react';
import { clinicSerif } from '@/lib/fonts';
import { btnPrimary, btnQuiet, initials } from '../../clinics/[slug]/_components/shared';

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
  const title = `${t(article.title)} | Duxtur.org`;
  const description = t(article.overview).substring(0, 160);

  const fullText = [
    t(article.overview), t(article.symptoms), t(article.causes),
    t(article.diagnosis_treatment), t(article.prevention),
    ...[1, 2, 3, 4, 5].map((i) => t(article[`section${i}_content`])),
  ].join(' ');
  const readingMinutes = Math.max(1, Math.ceil(fullText.split(' ').length / 200));

const ogImage = article.image
  ? article.image.startsWith('http')
    ? article.image
    : `${BASE_URL}${article.image}`
  : `${BASE_URL}/og?title=${encodeURIComponent(t(article.title))}&author=${encodeURIComponent(article.authorId?.name || 'Duxtur')}&lang=${lang}`;

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
  other: {
    "twitter:label1": "Reading time",
    "twitter:data1": `${readingMinutes} min read`,
    "keywords": article.category || "health, medicine",
    ...(article.image ? { "link:preload:hero": article.image } : {}),
  }
  };
} 

// ─── Markdown → elements ─────────────────────────────────────────────────────
// Explicit components: the project has no typography plugin, so `prose` classes do nothing.
const body = 'text-[1.0625rem] leading-[1.75]';
const md: Components = {
  p: ({ children }) => <p className={`mb-5 ${body}`}>{children}</p>,
  ul: ({ children }) => <ul className={`mb-5 list-disc space-y-2 pl-6 marker:text-foreground/40 ${body}`}>{children}</ul>,
  ol: ({ children }) => <ol className={`mb-5 list-decimal space-y-2 pl-6 marker:text-foreground/50 ${body}`}>{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h3: ({ children }) => <h3 className="mt-8 mb-3 font-clinic text-xl leading-snug font-semibold">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-6 mb-2 font-semibold">{children}</h4>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-primary pl-5 font-clinic text-xl leading-snug">{children}</blockquote>
  ),
  a: ({ href, children }) => {
    const external = !!href && /^https?:/.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="font-medium text-primary underline underline-offset-4"
      >
        {children}
      </a>
    );
  },
};
const mdLead: Components = {
  ...md,
  p: ({ children }) => <p className="mb-4 text-[1.1875rem] leading-8 text-foreground/90">{children}</p>,
};

function Avatar({ name, src, size }: { name: string; src?: string; size: number }) {
  const style = { width: size, height: size };
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={getOptimizedCloudinaryUrl(src, { width: size * 2, height: size * 2, crop: 'fill' })} alt="" width={size} height={size} style={style} className="shrink-0 rounded-full border border-border object-cover" />
  ) : (
    <span style={style} aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground/60">
      {initials(name)}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  await dbConnect();
  const { slug, lang } = await params;
  const t = getT(lang);
  const article: any = await Article.findOne({ slug })
    .populate('authorId')
    .populate('reviewedById')
    .lean();
  if (!article) notFound();

  const dbT = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  // ── Время чтения ──────────────────────────────────────────────────────────
  const fullText = [
    dbT(article.overview), dbT(article.symptoms), dbT(article.causes),
    dbT(article.diagnosis_treatment), dbT(article.prevention),
    ...[1, 2, 3, 4, 5].map((i) => dbT(article[`section${i}_content`])),
  ].join(' ');
  const wordCount = fullText.split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

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
      ? new Date(d).toLocaleDateString(lang, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;
  const datePublished = fmt(article.createdAt);
  const dateMedicalReview = fmt(article.lastMedicalReview);

  // ── Секции ────────────────────────────────────────────────────────────────
  const legacySections = [
    { id: 'symptoms',   title: t('blog.sectionSymptoms'), content: dbT(article.symptoms)             },
    { id: 'causes',     title: t('blog.sectionCauses'), content: dbT(article.causes)               },
    { id: 'treatment',  title: t('blog.sectionTreatment'), content: dbT(article.diagnosis_treatment)  },
    { id: 'prevention', title: t('blog.sectionPrevention'), content: dbT(article.prevention)           },
  ].filter((s) => s.content && s.content.length > 0);

  const dynamicSections = [1, 2, 3, 4, 5]
    .map((i) => ({
      id: `section${i}`,
      title: dbT(article[`section${i}_title`]),
      content: dbT(article[`section${i}_content`]),
    }))
    .filter((s) => s.title && s.content);

  const sections = dynamicSections.length > 0 ? dynamicSections : legacySections;

  // ── URLs ──────────────────────────────────────────────────────────────────
  const articleUrl = `${BASE_URL}/${lang}/blog/${article.slug}`;
  const authorSlug = article.authorId?.slug || article.authorId?._id;
  const authorUrl = `${BASE_URL}/${lang}/doctor/${authorSlug}`;

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

  // ── Автор, проверяющий, рубрика ───────────────────────────────────────────
  // Никаких выдуманных имён: если автора или проверяющего нет, строки просто нет.
  const author = article.authorId || null;
  const authorHref = author ? `/${lang}/doctor/${author.slug || author._id}` : null;
  const authorSpecialty = dbT(author?.specialty);
  const reviewer = article.reviewedById || null;
  const reviewerName: string = reviewer?.name || article.reviewedBy || '';
  const reviewerHref = reviewer ? `/${lang}/doctor/${reviewer.slug || reviewer._id}` : null;
  const category: string = article.category || '';
  const categoryKey = category ? `blog.category${category[0].toUpperCase()}${category.slice(1)}` : '';
  const categoryLabel = categoryKey && t(categoryKey) !== categoryKey ? t(categoryKey) : '';
  const careQuery = category && category !== 'general' ? `?specialty=${category}` : '';
  // Отметка «проверено» только если материал реально подтверждён администратором
  const showVerified = article.isVerified === true && !reviewerName && !dateMedicalReview;
  const title = dbT(article.title);

  // ── Article JSON-LD ───────────────────────────────────────────────────────
  const articleJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': ['Article', 'MedicalWebPage'],
    headline: dbT(article.title),
    description: dbT(article.overview).substring(0, 160),
    url: articleUrl,
    image: article.image || `${BASE_URL}/og-default.png`,
    thumbnailUrl: article.image || undefined,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    dateReviewed: article.lastMedicalReview || undefined,
    inLanguage: lang,
    isAccessibleForFree: true,
    wordCount: wordCount,
    speakable: {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".article-overview"]
    },
    reviewedBy: article.reviewedById
      ? {
          '@type': 'Person',
          '@id': `${BASE_URL}/${lang}/doctor/${article.reviewedById?.slug || article.reviewedById?._id}`,
          name: article.reviewedById?.name,
          url: `${BASE_URL}/${lang}/doctor/${article.reviewedById?.slug || article.reviewedById?._id}`,
        }
      : undefined,
    author: {
      '@type': 'Person',
      '@id': authorUrl,
      name: article.authorId?.name,
      jobTitle: dbT(article.authorId?.specialty),
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.org',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ReadAction",
      "userInteractionCount": article.views || 0
    },
    hasPart: sections.map(sec => ({
      "@type": "WebPageElement",
      "isAccessibleForFree": true,
      "cssSelector": `#${sec.id}`
    })),
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
    breadcrumb: buildBreadcrumbJsonLd([
      { name: 'Duxtur.org', url: `/${lang}` },
      { name: 'Blog', url: `/${lang}/blog` },
      { name: dbT(article.title), url: `blog/${article.slug}` },
    ]),
  };

  // Убираем undefined поля
  Object.keys(articleJsonLd).forEach(
    (k) => articleJsonLd[k] === undefined && delete articleJsonLd[k]
  );

  return (
    <div className={`${clinicSerif.variable} min-h-screen bg-background text-foreground`}>
      <ViewCounter slug={article.slug} />
      {/* Article Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* FAQ Schema — отдельный тег */}
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 text-sm md:px-8">
        <Link href={`/${lang}`} className="font-clinic text-base font-semibold">
          duxtur<span className="text-primary">.org</span>
        </Link>
        <Link href={`/${lang}/blog`} className="text-foreground/70 hover:text-foreground">
          {t('blog.title')}
        </Link>
      </nav>

      <article className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,44rem)_1fr] lg:gap-x-16">
          <div className="min-w-0">
            <header className="pt-6 md:pt-10">
              {categoryLabel && (
                <p className="text-sm">
                  <Link href={`/${lang}/blog/c/${category}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {categoryLabel}
                  </Link>
                </p>
              )}
              <h1 className="mt-3 font-clinic text-[2rem] leading-[1.12] font-semibold tracking-[-0.01em] text-balance md:text-[2.75rem]">
                {title}
              </h1>

              <div className="mt-6 flex gap-3">
                {author && <Avatar name={author.name || ''} src={author.image} size={48} />}
                <div className="min-w-0 text-sm leading-6">
                  {author && (
                    <p>
                      <span className="text-foreground/65">{t('blog.byAuthor')}: </span>
                      <Link href={authorHref!} className="font-medium hover:underline">
                        {author.name}
                      </Link>
                      {authorSpecialty && <span className="text-foreground/65">, {authorSpecialty}</span>}
                    </p>
                  )}
                  {(reviewerName || dateMedicalReview) && (
                    <p>
                      <span className="text-foreground/65">{t('blog.articleMedicalReview')}: </span>
                      {reviewerName &&
                        (reviewerHref ? (
                          <Link href={reviewerHref} className="font-medium hover:underline">
                            {reviewerName}
                          </Link>
                        ) : (
                          <span className="font-medium">{reviewerName}</span>
                        ))}
                      {dateMedicalReview && <span className="text-foreground/65">{reviewerName ? ` · ${dateMedicalReview}` : dateMedicalReview}</span>}
                    </p>
                  )}
                  <p className="text-foreground/65">
                    {datePublished} · {readingMinutes} {t('blog.articleReadingMin')}
                  </p>
                  {showVerified && (
                    <p className="inline-flex items-center gap-1.5 font-medium text-ok">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      {t('blog.verified')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 hidden md:block">
                <ArticleShare url={articleUrl} title={title} lang={lang} />
              </div>
            </header>

            {article.image && (
              <figure className="mt-8">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[10px] bg-muted">
                  <Image src={article.image} alt={title} fill priority sizes="(min-width: 1024px) 704px, 100vw" className="object-cover" />
                </div>
              </figure>
            )}

            <div className="article-overview mt-8 max-w-[42rem]">
              <ReactMarkdown components={mdLead}>{dbT(article.overview)}</ReactMarkdown>
            </div>

            {sections.length > 1 && (
              <nav aria-label={t('blog.articleContents')} className="mt-6 rounded-[10px] border border-border p-4 lg:hidden">
                <p className="mb-2 text-sm font-semibold">{t('blog.articleContents')}</p>
                <ol className="space-y-1.5 text-[0.9375rem]">
                  {sections.map(sec => (
                    <li key={sec.id}>
                      <a href={`#${sec.id}`} className="text-primary underline-offset-4 hover:underline">
                        {sec.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="mt-10 max-w-[42rem]">
              {sections.map(sec => (
                <section key={sec.id} id={sec.id} className="scroll-mt-6 not-first:mt-12">
                  <h2 className="mb-4 font-clinic text-[1.625rem] leading-tight font-semibold md:text-[1.875rem]">{sec.title}</h2>
                  <ReactMarkdown components={md}>{sec.content}</ReactMarkdown>
                </section>
              ))}
            </div>

            <aside className="mt-12 max-w-[42rem] rounded-[10px] border border-border bg-muted p-5">
              <p className="font-semibold">{t('blog.articleDisclaimer')}</p>
              <p className="mt-1 text-[0.9375rem] leading-6 text-foreground/80">{t('blog.articleDisclaimerText')}</p>
            </aside>

            <section className="mt-6 max-w-[42rem] rounded-[10px] border border-border p-5">
              <p className="font-clinic text-xl font-semibold">{t('blog.needConsult')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/${lang}/doctors${careQuery}`} className={btnPrimary}>
                  {t('doctors.title')}
                </Link>
                <Link href={`/${lang}/clinics${careQuery}`} className={btnQuiet}>
                  {t('clinic.findClinic')}
                </Link>
              </div>
            </section>

            {article.references?.length > 0 && (
              <section className="mt-10 max-w-[42rem]">
                <h2 className="mb-3 font-clinic text-xl font-semibold">{t('blog.articleSources')}</h2>
                <ol className="list-decimal space-y-2 pl-6 text-sm leading-6 text-foreground/75 marker:text-foreground/50">
                  {article.references.map((ref: string, i: number) => {
                    const urlMatch = ref.match(/(?:https?:\/\/)?(?:www\.)[^\s]+/) || ref.match(/https?:\/\/[^\s]+/);
                    const rawUrl = urlMatch ? urlMatch[0] : null;
                    const href = rawUrl && !rawUrl.startsWith('http') ? 'https://' + rawUrl : rawUrl;
                    const label = rawUrl ? ref.replace(rawUrl, '').trim().replace(/^[-–—:]\s*/, '') : ref;
                    return (
                      <li key={i}>
                        {urlMatch ? (
                          <a href={href!} target="_blank" rel="noopener noreferrer" className="break-words text-primary underline-offset-4 hover:underline">
                            {label || ref}
                          </a>
                        ) : (
                          ref
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <div className="max-w-[42rem]">
              <ArticleEngagement
                slug={article.slug}
                initialRating={avgRating}
                initialRatingCount={article.ratings?.length || 0}
                initialLikesUp={article.likesUp || 0}
                initialLikesDown={article.likesDown || 0}
                lang={lang}
              />
            </div>

            <div className="mt-8 max-w-[42rem] border-t border-border pt-6">
              <ArticleShare url={articleUrl} title={title} lang={lang} />
            </div>

            {author && (
              <section className="mt-10 max-w-[42rem] rounded-[10px] border border-border p-5">
                <p className="text-sm text-foreground/65">{t('blog.articleAuthor')}</p>
                <div className="mt-3 flex items-center gap-4">
                  <Avatar name={author.name || ''} src={author.image} size={56} />
                  <div className="min-w-0">
                    <Link href={authorHref!} className="font-clinic text-lg font-semibold hover:underline">
                      {author.name}
                    </Link>
                    {authorSpecialty && <p className="text-sm text-foreground/70">{authorSpecialty}</p>}
                  </div>
                </div>
                <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                  <Link href={authorHref!} className="text-primary underline-offset-4 hover:underline">
                    {t('blog.articleAuthorArticles')}
                  </Link>
                  <Link href={`/${lang}/editorial`} className="text-primary underline-offset-4 hover:underline">
                    {t('nav.editorialPolicy')}
                  </Link>
                </p>
              </section>
            )}
          </div>

          {sections.length > 1 && (
            <aside className="hidden lg:block lg:pt-10">
              <div className="sticky top-6">
                <TableOfContents sections={sections} label={t('blog.articleContents')} />
              </div>
            </aside>
          )}
        </div>

        {relatedArticles.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="mb-6 font-clinic text-2xl font-semibold">{t('blog.articleRelated')}</h2>
            <ul className="grid gap-8 sm:grid-cols-3">
              {relatedArticles.map(rel => (
                <li key={rel._id}>
                  <Link href={`/${lang}/blog/${rel.slug}`} className="group block">
                    {rel.image && (
                      <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                        <Image src={rel.image} alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                      </div>
                    )}
                    <h3 className="font-clinic text-lg leading-snug font-semibold group-hover:underline">{dbT(rel.title)}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{dbT(rel.overview).replace(/[#*`_>]/g, '')}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
