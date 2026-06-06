// src/app/[lang]/about/page.tsx
// НОВЫЙ ФАЙЛ — создать папку about и поместить туда

import type { Metadata } from 'next';
import Link from 'next/link';
import { buildAlternates } from '@/lib/seo';
import { getT, T } from '@/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
 return {
    title: T('about.title', lang),
    description: T('about.subtitle', lang),
    alternates: buildAlternates('about', lang),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getT(lang);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur.org';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: t('about.titleHeading'),
    url: `${baseUrl}/${lang}/about`,
    description: t('about.subtitle'),
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.org',
      url: baseUrl,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'editorial',
        url: 'https://t.me/duxturcom',
      },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Duxtur.org',
          item: `${baseUrl}/${lang}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('nav.aboutUs'),
          item: `${baseUrl}/${lang}/about`,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-gray-900">duxtur<span className="text-blue-600">.org</span></span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-500 hover:text-blue-600 font-medium transition">
            ← {t('nav.home')}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {t('about.ymyl')}
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            {t('about.titleHeading')}
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Миссия */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">{t('about.missionTitle')}</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            {t('about.missionText1')}
          </p>
          <p className="text-gray-600 leading-relaxed">
            {t('about.missionText2')}
          </p>
        </section>

        {/* Как мы верифицируем врачей */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{t('about.verificationTitle')}</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            {t('about.verificationIntro')}
          </p>

          <div className="space-y-4">
            {[
              {
                step: '01',
                title: t('about.step1Title'),
                text: t('about.step1Text'),
                color: 'bg-blue-50 border-blue-200',
                num: 'text-blue-600',
              },
              {
                step: '02',
                title: t('about.step2Title'),
                text: t('about.step2Text'),
                color: 'bg-green-50 border-green-200',
                num: 'text-green-600',
              },
              {
                step: '03',
                title: t('about.step3Title'),
                text: t('about.step3Text'),
                color: 'bg-purple-50 border-purple-200',
                num: 'text-purple-600',
              },
              {
                step: '04',
                title: t('about.step4Title'),
                text: t('about.step4Text'),
                color: 'bg-amber-50 border-amber-200',
                num: 'text-amber-600',
              },
            ].map((item) => (
              <div key={item.step} className={`flex gap-5 p-5 rounded-2xl border ${item.color}`}>
                <div className={`text-2xl font-extrabold ${item.num} shrink-0 w-10`}>{item.step}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI и контент */}
        <section className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex gap-3 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-extrabold text-gray-900">{t('about.aiTitle')}</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            {t('about.aiText1')}
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            {t('about.aiText2')}
          </p>
          <p className="text-gray-700 leading-relaxed">
            {t('about.aiText3')}
          </p>
        </section>

        {/* Стандарты контента */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{t('about.qualityTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '✅', title: t('about.qualityAuthorship'), text: t('about.qualityAuthorshipText') },
              { icon: '📚', title: t('about.qualitySources'), text: t('about.qualitySourcesText') },
              { icon: '🔄', title: t('about.qualityRelevance'), text: t('about.qualityRelevanceText') },
              { icon: '⚕️', title: t('about.qualityDisclaimer'), text: t('about.qualityDisclaimerText') },
              { icon: '🌍', title: t('about.qualityMultilingual'), text: t('about.qualityMultilingualText') },
              { icon: '🚫', title: t('about.qualityModeration'), text: t('about.qualityModerationText') },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Контакты */}
        <section className="mb-12 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">{t('about.contactsTitle')}</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">
            {t('about.contactsText')}
          </p>
          <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm transition active:scale-95">
            {t('about.contactsTelegram')}
          </a>
        </section>

        {/* Дата обновления */}
        <div className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
          {t('about.lastUpdated')}
        </div>
      </main>
    </div>
  );
}
