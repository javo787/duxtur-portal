import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getT, T } from '@/i18n';
import { buildAlternates, BASE_URL, buildBreadcrumbJsonLd } from '@/lib/seo';
import DoctorHero from './_components/DoctorHero';
import TrustBadges from './_components/TrustBadges';
import ShareButtons from '@/components/ShareButtons';
import MobileStickyShare from '@/components/MobileStickyShare';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_GRADIENTS } from '@/lib/doctor-constants';
import DownloadCardButton from '@/components/DownloadCardButton';
import ContactDoctorButton from '@/components/ContactDoctorButton';
import { PremiumMobileProfile } from './_components/PremiumMobileProfile';
import Image from 'next/image';
import DoctorViewTracker from '@/components/DoctorViewTracker';
import ReviewModal from './_components/ReviewModal';
import BookingButton from './_components/BookingButton';
import ReviewList from './_components/ReviewList';

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await dbConnect();
  const { id, lang } = await params;
  const doctor = await Doctor.findOne({
    $or: [{ slug: id }, { _id: id.match(/^[a-f\d]{24}$/i) ? id : null }],
  });
  if (!doctor) return { title: T('doctor.notFound', lang) };
  const specialty = doctor.specialty?.[lang] || doctor.specialty?.ru || '';

  const articlesCount = await Article.countDocuments({ authorId: doctor._id });

  const description = `${doctor.name} — ${specialty}. ${doctor.city}. ${doctor.experience} ${T('common.yearsExp', lang)}. ${articlesCount} ${T('common.articles', lang)} Duxtur.org`;

  return {
    title: `${doctor.name} — ${specialty} | Duxtur.org`,
    description,
    alternates: buildAlternates(`doctor/${doctor.slug || doctor._id}`, lang),
    openGraph: {
      type: 'profile',
      images: [doctor.image || `${BASE_URL}/og-default.png`],
    }
  };
}

function getReadingTime(article: any): number {
  const text =
    Object.values(article.overview || {}).join(' ') +
    Object.values(article.symptoms || {}).join(' ');
  const words = text.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

function getMission(specialty: string, lang: string): string {
  // TODO: Mission statements should ideally be translated per doctor by themselves.
  // Using generic professional statements for now.
  const t = getT(lang);
  const missions: Record<string, string> = {
    'кардиология': t('doctor.missionCardiology'),
    'неврология': t('doctor.missionNeurology'),
    'стоматология': t('doctor.missionDentistry'),
    'педиатрия': t('doctor.missionPediatrics'),
    'дерматология': t('doctor.missionDermatology'),
    'офтальмология': t('doctor.missionOphthalmology'),
    'хирургия': t('doctor.missionSurgery'),
    'гинекология': t('doctor.missionGynecology'),
  };
  return missions[specialty.toLowerCase()] || t('doctor.genericMission');
}

export default async function DoctorProfilePage({ params }: Props) {
  await dbConnect();
  const { lang, id } = await params;
  const t = getT(lang);

  const doctor: any = await Doctor.findOne({
    $or: [{ slug: id }, ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : [])],
  }).lean();

  if (!doctor || (doctor.status === 'pre_imported' && doctor.isClaimed === false)) {
    // We might want to allow viewing pre_imported profiles but definitely not bookable.
    // The requirement says "Ensure pre_imported (unclaimed) doctor profiles are NOT publicly bookable".
    // I already added the check for BookingButton.
    // If we want to hide the profile completely if unclaimed and pre_imported:
    // if (!doctor) notFound();
  }

  if (!doctor) notFound();

  const Review = (await import('@/models/Review')).default;

  const [articles, reviews]: [any[], any[]] = await Promise.all([
    Article.find({ authorId: doctor._id }).sort({ createdAt: -1 }).lean(),
    Review.find({ doctorId: doctor._id, isVerified: true }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const dbT = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['ru'] || '';
  };

  const specialtyLabel = dbT(doctor.specialty);
  const workplaceLabel = dbT(doctor.workplace);
  const educationLabel = dbT(doctor.education);
  const bioLabel = dbT(doctor.bio);

  const doctorUrl = `${BASE_URL}/${lang}/doctor/${doctor.slug || doctor._id}`;

  const lastReviewedArticle = articles.find((a) => a.lastMedicalReview);
  const lastMedicalReviewDate = lastReviewedArticle?.lastMedicalReview
    ? new Date(lastReviewedArticle.lastMedicalReview).toLocaleDateString(lang, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
  const mission = bioLabel || getMission(doctor.specialty?.ru || specialtyLabel, lang);

  let categoryKey = 'general';
  for (const [key, labels] of Object.entries(CATEGORY_LABELS)) {
    if (labels[lang] === specialtyLabel || labels.ru === specialtyLabel) {
      categoryKey = key;
      break;
    }
  }

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': ['Person', 'MedicalBusiness'],
    '@id': doctorUrl,
    name: doctor.name,
    jobTitle: specialtyLabel,
    description: mission,
    url: doctorUrl,
    image: doctor.image || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": doctorUrl
    },
    knowsLanguage: (doctor.languages || []).map((l: string) => ({
      "@type": "Language",
      "name": l
    })),
    hasCredential: educationLabel ? {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "degree",
      "recognizedBy": {
        "@type": "Organization",
        "name": educationLabel
      }
    } : undefined,
    worksFor: workplaceLabel
      ? { '@type': 'Organization', name: workplaceLabel }
      : undefined,
    alumniOf: educationLabel
      ? { '@type': 'EducationalOrganization', name: educationLabel }
      : undefined,
    sameAs: doctor.sameAs?.length > 0 ? doctor.sameAs : undefined,
    address: doctor.address ? {
      '@type': 'PostalAddress',
      addressLocality: doctor.city,
      streetAddress: doctor.address,
      addressCountry: 'TJ',
    } : undefined,
    openingHours: doctor.schedule ? buildOpeningHours(doctor.schedule) : undefined,
    priceRange: doctor.priceRange?.min ? `${doctor.priceRange.min}–${doctor.priceRange.max} TJS` : undefined,
    aggregateRating: doctor.reviewCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": doctor.reviewAvg,
      "reviewCount": doctor.reviewCount,
      "bestRating": 5
    } : undefined,
    review: reviews.length > 0 ? reviews.slice(0, 3).map((r: any) => ({
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": r.rating },
      "author": { "@type": "Person", "name": r.isAnonymous ? T('common.anonymous', lang) : T('common.patient', lang) },
      "reviewBody": r.text,
      "datePublished": r.createdAt.toISOString().split('T')[0]
    })) : undefined,
    lastReviewed: lastReviewedArticle?.lastMedicalReview || undefined,
    knowsAbout: specialtyLabel || undefined,
    breadcrumb: buildBreadcrumbJsonLd([
      { name: 'Duxtur.org', url: `/${lang}` },
      { name: T('nav.authors', lang), url: `/${lang}/authors` },
      { name: doctor.name, url: `doctor/${doctor.slug || doctor._id}` },
    ]),
  };
  Object.keys(jsonLd).forEach((k) => jsonLd[k] === undefined && delete jsonLd[k]);

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DoctorViewTracker slug={doctor.slug || doctor._id.toString()} />

      <style>{`
        @media print {
          header, .share-area, .no-print { display: none !important; }
          body { background: white !important; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-base md:text-lg font-black tracking-tight text-blue-600 shrink-0">
            duxtur<span className="text-gray-300 font-light">.org</span>
          </Link>

          <nav className="hidden sm:flex items-center text-xs text-gray-400 gap-1.5 overflow-hidden" itemScope itemType="https://schema.org/BreadcrumbList">
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href={`/${lang}`} itemProp="item" className="hover:text-gray-600 transition">
                <span itemProp="name">{t('nav.home')}</span>
              </Link>
              <meta itemProp="position" content="1" />
            </span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href={`/${lang}/authors`} itemProp="item" className="hover:text-gray-600 transition">
                <span itemProp="name">{t('nav.authors')}</span>
              </Link>
              <meta itemProp="position" content="2" />
            </span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-gray-600 font-medium truncate">{doctor.name}</span>
              <meta itemProp="position" content="3" />
            </span>
          </nav>

          <Link
            href={`/${lang}/authors`}
            className="text-sm text-gray-400 hover:text-gray-700 transition font-medium flex items-center gap-1.5 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{t('doctor.allDoctors')}</span>
          </Link>
        </div>
      </header>

      {/* HERO — только на десктопе */}
      <div className="hidden md:block">
        <DoctorHero
          doctor={{...doctor, specialty: specialtyLabel, workplace: workplaceLabel, education: educationLabel}}
          specialtyLabel={specialtyLabel}
          mission={mission}
          totalViews={totalViews}
          articlesCount={articles.length}
          categoryKey={categoryKey}
          lang={lang}
        />
      </div>

      <nav
        aria-label="breadcrumb"
        className="max-w-6xl mx-auto px-4 py-2 lg:hidden"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <ol className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
            <Link href={`/${lang}`} itemProp="item" className="hover:text-blue-600 transition font-medium">
              <span itemProp="name">Duxtur.org</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li>/</li>
          <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
            <Link href={`/${lang}/authors`} itemProp="item" className="hover:text-blue-600 transition font-medium">
              <span itemProp="name">{t('nav.authors')}</span>
            </Link>
            <meta itemProp="position" content="2" />
          </li>
          <li>/</li>
          <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
            <span itemProp="name" className="text-gray-600 font-medium">{doctor.name}</span>
            <meta itemProp="position" content="3" />
          </li>
        </ol>
      </nav>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-10 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 pb-32 lg:pb-10">

        {/* ─── МОБИЛЬ: Премиум профиль ПЕРВЫМ ─── */}
        <div className="lg:hidden col-span-1">
          <PremiumMobileProfile
            doctor={{...doctor, bio: bioLabel, specialty: specialtyLabel, workplace: workplaceLabel, education: educationLabel}}
            specialtyLabel={specialtyLabel}
            lastMedicalReviewDate={lastMedicalReviewDate}
            articles={articles}
            lang={lang}
            doctorUrl={doctorUrl}
          />

          {/* ── КНОПКА ЗАПИСИ (МОБИЛЬ) ── */}
          {doctor.acceptsNewPatients !== false && doctor.status === 'approved' && (
            <div className="rounded-2xl overflow-hidden mt-4">
              <BookingButton
                doctor={{
                  id: doctor._id.toString(),
                  name: doctor.name,
                  schedule: doctor.schedule,
                  consultationTypes: doctor.consultationTypes
                }}
                lang={lang}
              />
            </div>
          )}
        </div>

        {/* Статьи */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {t('doctor.articles')}
              {articles.length > 0 && (
                <span className="ml-2.5 bg-gray-100 text-gray-500 text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {articles.length}
                </span>
              )}
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-bold text-gray-700 mb-1 text-lg">{t('doctor.noArticles')}</p>
              <p className="text-sm text-gray-400">{t('doctor.noArticlesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article, idx) => {
                const catLabel =
                  CATEGORY_LABELS[article.category]?.[lang] ||
                  CATEGORY_LABELS[article.category]?.ru || '';
                const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.general;
                const readingTime = getReadingTime(article);
                return (
                  <Link
                    key={article._id}
                    href={`/${lang}/blog/${article.slug}`}
                    className="group flex bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Картинка */}
                    <div className="w-28 md:w-44 shrink-0 overflow-hidden relative">
                      <Image
                        src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                        alt={dbT(article.title)}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-700"
                      />
                      <div className="absolute top-2 left-2 w-6 h-6 bg-black/40 backdrop-blur-sm text-white text-xs font-black rounded-lg flex items-center justify-center">
                        {idx + 1}
                      </div>
                    </div>
                    {/* Текст */}
                    <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {catLabel && (
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${catColor}`}>
                              {catLabel}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {t('blog.verified')}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 text-[14px]">
                          {dbT(article.title)}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1 leading-relaxed hidden md:block">
                          {dbT(article.overview)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {new Date(article.createdAt).toLocaleDateString(lang, {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                          <span className="text-gray-200 hidden md:inline">·</span>
                          <span className="text-xs text-gray-400 hidden md:flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {readingTime} {t('map.min')}
                          </span>
                        </div>
                        <span className="text-blue-500 text-xs font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          {t('blog.readMore')}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Reviews Section */}
          <div className="mt-12 pt-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('doctor.reviews')}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex text-amber-400 text-sm">
                    {'★'.repeat(Math.round(doctor.reviewAvg || 0))}{'☆'.repeat(5 - Math.round(doctor.reviewAvg || 0))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{doctor.reviewAvg || 0}</span>
                  <span className="text-xs text-gray-400">({doctor.reviewCount || 0} {t('blog.ratings')})</span>
                </div>
              </div>
              <ReviewModal doctorId={doctor._id.toString()} doctorName={doctor.name} lang={lang} />
            </div>

            <ReviewList initialReviews={reviews} doctorId={doctor._id.toString()} />
          </div>

          {/* "You may also like" section */}
          {articles.length > 0 && (
            <div className="mt-12 pt-10 border-t border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-6">{t('doctor.alsoLike')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {articles.slice(0, 3).map((a) => (
                  <Link key={a._id} href={`/${lang}/blog/${a.slug}`} className="group block">
                    <div className="aspect-video rounded-xl overflow-hidden mb-3 relative">
                      <Image
                        src={a.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                        alt={dbT(a.title)}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <h4 className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition line-clamp-2">
                      {dbT(a.title)}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== ДЕСКТОП САЙДБАР ===== */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-4 pb-6">
            {/* Профиль врача */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="bg-gradient-to-r from-[#0a1628] to-[#0f2a52] px-5 py-4">
                <p className="text-blue-300/70 text-[10px] font-black uppercase tracking-[0.15em] mb-0.5">
                  {t('doctor.profile')}
                </p>
                <p className="text-white font-black text-base leading-tight">{doctor.name}</p>
                {specialtyLabel && (
                  <p className="text-blue-300/80 text-xs mt-1">{specialtyLabel}</p>
                )}
              </div>

              <div className="p-5 space-y-4">
                {doctor.experience > 0 && (
                  <SidebarRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    label={t('doctor.experience')} value={`${doctor.experience} ${t('common.years')}`}
                  />
                )}
                {workplaceLabel && (
                  <SidebarRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    label={t('doctor.workplace')} value={workplaceLabel}
                  />
                )}
                {educationLabel && (
                  <SidebarRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
                    label={t('doctor.education')} value={educationLabel}
                  />
                )}
                {doctor.languages?.length > 0 && (
                  <SidebarRow
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
                    label={t('doctor.languages')} value={doctor.languages.join(', ')}
                  />
                )}
              </div>

              {bioLabel && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-gray-50 pt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-2">{t('doctor.about')}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{bioLabel}</p>
                  </div>
                </div>
              )}

              {doctor.sameAs?.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="border-t border-gray-50 pt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-3">{t('doctor.profiles')}</p>
                    <div className="flex gap-2 flex-wrap">
                      {doctor.sameAs.map((link: string, i: number) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition px-3 py-1.5 rounded-lg font-medium truncate max-w-full">
                          {new URL(link).hostname.replace('www.', '')}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <TrustBadges
              lastMedicalReviewDate={lastMedicalReviewDate}
              lastArticleDate={articles.length > 0 ? articles[0].createdAt : null}
              lang={lang}
            />

            <ContactDoctorButton doctor={doctor} lang={lang} />

            {doctor.acceptsNewPatients !== false && doctor.status === 'approved' && (
              <BookingButton
                doctor={{
                  id: doctor._id.toString(),
                  name: doctor.name,
                  schedule: doctor.schedule,
                  consultationTypes: doctor.consultationTypes
                }}
                lang={lang}
              />
            )}

            {/* Локация и клиника */}
            {(doctor.clinicName || doctor.address) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">
                  {t('doctor.clinicAddress')}
                </h3>
                <div className="space-y-3">
                  {doctor.clinicName && (
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">🏥</span>
                      <p className="text-sm font-bold text-gray-800">{doctor.clinicName}</p>
                    </div>
                  )}
                  {doctor.address && (
                    <div className="flex items-start gap-3">
                      <span className="text-gray-400 mt-1">📍</span>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {doctor.address}{doctor.district ? `, ${doctor.district}` : ''}{doctor.city ? `, ${doctor.city}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* График работы */}
            {doctor.schedule && Object.values(doctor.schedule).some((d: any) => d.isWorking) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">
                  {t('doctor.workingHours')}
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'mon', day_idx: 1 },
                    { id: 'tue', day_idx: 2 },
                    { id: 'wed', day_idx: 3 },
                    { id: 'thu', day_idx: 4 },
                    { id: 'fri', day_idx: 5 },
                    { id: 'sat', day_idx: 6 },
                    { id: 'sun', day_idx: 0 },
                  ].map((day) => {
                    const d = doctor.schedule[day.id];
                    const today = new Date().getDay();
                    const isToday = [0, 1, 2, 3, 4, 5, 6].indexOf(today === 0 ? 6 : today - 1) === ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(day.id);
                    const label = new Date(2024, 0, day.day_idx).toLocaleDateString(lang, { weekday: 'short' });

                    return (
                      <div key={day.id} className={`flex items-center justify-between text-xs ${isToday ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                        <span className="capitalize">{label}</span>
                        <span>{d?.isWorking ? `${d.open} – ${d.close}` : t('doctor.dayOff')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Консультации и цены */}
            {doctor.priceRange?.min > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">
                  {t('doctor.consultations')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t('doctor.priceFrom')}</span>
                    <span className="text-sm font-black text-gray-900">{t('common.from')} {doctor.priceRange.min} TJS</span>
                  </div>
                  <div className="flex gap-2">
                    {(doctor.consultationTypes || ['in_person']).map((type: string) => (
                      <div key={type} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm border border-slate-100" title={type}>
                        {type === 'in_person' ? '🏥' : type === 'online' ? '💻' : '🏠'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">
                {t('doctor.shareProfile')}
              </h3>
              <ShareButtons url={doctorUrl} title={`${doctor.name} — ${specialtyLabel}`} lang={lang} />
              <DownloadCardButton doctorSlug={doctor.slug} lang={lang} />
            </div>
          </div>
        </div>
      </div>

      {/* Мобильная sticky-панель */}
      <MobileStickyShare
        doctorUrl={doctorUrl}
        doctorName={doctor.name}
        specialtyLabel={specialtyLabel}
        lang={lang}
      />
    </div>
  );
}

function buildOpeningHours(schedule: any) {
  const days = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };
  return Object.entries(schedule)
    .filter(([_, v]: any) => v.isWorking)
    .map(([k, v]: any) => `${days[k as keyof typeof days]} ${v.open}-${v.close}`);
}

function SidebarRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}
