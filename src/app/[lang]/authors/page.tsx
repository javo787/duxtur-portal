import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildAlternates, BASE_URL, buildBreadcrumbJsonLd } from '@/lib/seo';
import { getT, T } from '@/i18n';

type Props = { params: Promise<{ lang: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: T('nav.authors', lang) + ' — Duxtur.org',
    description: T('home.authorsSubtitle', lang),
    alternates: buildAlternates('authors', lang),
  };
}

export default async function AuthorsPage({ params }: Props) {
  const { lang } = await params;
  const t = getT(lang);
  await dbConnect();

  const doctors: any[] = await Doctor.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .lean();

  const counts = await Article.aggregate([
    { $match: { authorId: { $in: doctors.map(d => d._id) } } },
    { $group: { _id: '$authorId', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));

  const doctorsWithCount = doctors.map((doc) => ({
    ...doc,
    articleCount: countMap[doc._id.toString()] ?? 0,
  }));

  const dbT = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalOrganization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Duxtur.org',
        url: BASE_URL,
        member: doctors.map(doc => ({
          '@type': 'Person',
          name: doc.name,
          url: `${BASE_URL}/${lang}/doctor/${doc.slug || doc._id}`
        }))
      },
      {
        '@type': 'CollectionPage',
        name: `${t('nav.authors')} — Duxtur.org`,
        url: `${BASE_URL}/${lang}/authors`,
        description: t('home.authorsSubtitle'),
        publisher: { '@id': `${BASE_URL}/#organization` },
        breadcrumb: buildBreadcrumbJsonLd([
          { name: 'Duxtur.org', url: `/${lang}` },
          { name: t('nav.authors'), url: `/${lang}/authors` },
        ]),
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-gray-900">
              duxtur<span className="text-blue-600">.org</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href={`/${lang}/blog`} className="hover:text-gray-900 transition font-medium">
              {t('nav.articles')}
            </Link>
            <Link
              href={`/${lang}/register`}
              className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition text-xs"
            >
              {t('home.ctaBtn')}
            </Link>
          </nav>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <nav className="flex items-center gap-2 text-xs text-gray-400" itemScope itemType="https://schema.org/BreadcrumbList">
          <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href={`/${lang}`} itemProp="item" className="hover:text-blue-600 transition">
              <span itemProp="name">{t('nav.home')}</span>
            </Link>
            <meta itemProp="position" content="1" />
          </span>
          <span>/</span>
          <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name" className="text-gray-700 font-medium">{t('nav.authors')}</span>
            <meta itemProp="position" content="2" />
          </span>
        </nav>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 mb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t('home.verifiedManually')}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('nav.authors')}
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed">
            {t('home.authorsSubtitle')}
          </p>

          {/* Статистика */}
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              { value: doctors.length, label: t('common.doctors') },
              { value: 5, label: t('common.languages') },
              { value: '100%', label: t('common.verifiedPlural') },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-blue-300 text-xs mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">

        {/* СЕТКА АВТОРОВ */}
        {doctorsWithCount.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <p className="text-xl font-bold text-gray-700 mb-2">{t('home.articlesComingSoon')}</p>
            <p className="text-gray-400 mb-8 text-sm">{t('home.authorsComingSoonSub')}</p>
            <Link
              href={`/${lang}/register`}
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition"
            >
              {t('home.articlesBecomeFirst')} →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctorsWithCount.map((doc) => (
              <Link
                key={doc._id}
                href={`/${lang}/doctor/${doc.slug || doc._id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Шапка карточки */}
                <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={doc.name || 'Doctor'}
                      width={72}
                      height={72}
                      className="w-[72px] h-[72px] rounded-2xl object-cover border-2 border-white/20 group-hover:border-white/50 transition"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-base leading-tight truncate group-hover:text-blue-200 transition">
                      {doc.name}
                    </p>
                    <p className="text-blue-300 text-sm mt-1 truncate">{dbT(doc.specialty)}</p>
                    {doc.experience > 0 && (
                      <p className="text-blue-400/60 text-xs mt-1">
                        {doc.experience} {t('doctor.yearsExp')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Тело карточки */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 01-2.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('doctor.verified')}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900">
                      {doc.articleCount}
                      <span className="text-gray-400 font-normal text-xs ml-1">{t('common.articles')}</span>
                    </span>
                  </div>

                  {doc.languages?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {doc.languages.slice(0, 4).map((lng: string) => (
                        <span key={lng} className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full font-medium border border-gray-100">
                          {lng}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      {t('common.since')} {new Date(doc.createdAt).toLocaleDateString(lang, { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t('blog.readMore')}
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-10 md:p-14">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">{t('home.ctaTitle')}</h2>
              <ul className="space-y-2 text-blue-200 text-sm">
                {[
                  t('home.ctaFeature1'),
                  t('home.ctaFeature2'),
                  t('home.ctaFeature3'),
                  t('home.ctaFeature4'),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-400 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={`/${lang}/register`}
              className="shrink-0 bg-white text-slate-900 font-extrabold py-4 px-10 rounded-full hover:bg-blue-50 transition shadow-2xl hover:-translate-y-0.5 transform text-sm whitespace-nowrap"
            >
              {t('home.ctaBtn')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
