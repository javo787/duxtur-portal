// src/app/[lang]/editorial/page.tsx
// НОВЫЙ ФАЙЛ — создать папку editorial

import type { Metadata } from 'next';
import Link from 'next/link';
import { buildAlternates } from '@/lib/seo';
import { getT, T } from '@/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: T('editorial.title', lang),
    description: T('editorial.intro', lang),
    robots: { index: true, follow: true },
    alternates: buildAlternates('editorial', lang),
  };
}

export default async function EditorialPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getT(lang);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur.org';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('editorial.titleHeading'),
    url: `${baseUrl}/${lang}/editorial`,
    description: t('editorial.intro'),
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.org',
      url: baseUrl,
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
            <span className="text-xl font-extrabold text-gray-900">duxtur<span className="text-blue-600">.com</span></span>
          </Link>
          <Link href={`/${lang}/about`} className="text-sm text-gray-500 hover:text-blue-600 font-medium transition">
            ← {t('nav.aboutUs')}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">

        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{t('editorial.titleHeading')}</h1>
          <p className="text-gray-500 text-sm">{t('editorial.lastUpdated')}</p>
        </div>

        {/* Intro */}
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl mb-10">
          <p className="text-gray-700 leading-relaxed text-sm">
            {t('editorial.introText')}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">01.</span> {t('editorial.s1Title')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">{t('editorial.s1Intro')}</p>
            <ul className="space-y-2 text-gray-600 text-sm">
              {[
                t('editorial.s1Item1'),
                t('editorial.s1Item2'),
                t('editorial.s1Item3'),
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-green-500 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3 text-sm">{t('editorial.s1Exclude')}</p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">02.</span> {t('editorial.s2Title')}
            </h2>
            <ol className="space-y-3 text-sm text-gray-600">
              {[
                { n: '1', title: t('editorial.s2Step1Title'), desc: t('editorial.s2Step1Text') },
                { n: '2', title: t('editorial.s2Step2Title'), desc: t('editorial.s2Step2Text') },
                { n: '3', title: t('editorial.s2Step3Title'), desc: t('editorial.s2Step3Text') },
                { n: '4', title: t('editorial.s2Step4Title'), desc: t('editorial.s2Step4Text') },
              ].map((item) => (
                <li key={item.n} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="font-extrabold text-blue-600 shrink-0 text-base">{item.n}.</span>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">{item.title}</p>
                    <p>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">03.</span> {t('editorial.s3Title')}
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="leading-relaxed"><strong className="text-gray-900">{t('editorial.s3Item1Title')}:</strong> {t('editorial.s3Item1Text')}</p>
              <p className="leading-relaxed"><strong className="text-gray-900">{t('editorial.s3Item2Title')}:</strong> {t('editorial.s3Item2Text')}</p>
              <p className="leading-relaxed"><strong className="text-gray-900">{t('editorial.s3Item3Title')}:</strong> {t('editorial.s3Item3Text')}</p>
              <p className="leading-relaxed"><strong className="text-gray-900">{t('editorial.s3Item4Title')}:</strong> {t('editorial.s3Item4Text')}</p>
              <p className="leading-relaxed"><strong className="text-gray-900">{t('editorial.s3Item5Title')}:</strong> {t('editorial.s3Item5Text')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">04.</span> {t('editorial.s4Title')}
            </h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700 leading-relaxed">
              <p className="mb-3">{t('editorial.s4Intro')}</p>
              <ul className="space-y-1 mb-3">
                <li className="flex gap-2"><span>•</span>{t('editorial.s4Item1')}</li>
                <li className="flex gap-2"><span>•</span>{t('editorial.s4Item2')}</li>
                <li className="flex gap-2"><span>•</span>{t('editorial.s4Item3')}</li>
              </ul>
              <p className="font-medium text-amber-800">{t('editorial.s4Note')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">05.</span> {t('editorial.s5Title')}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              {t('editorial.s5Intro')}
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                t('editorial.s5Item1'),
                t('editorial.s5Item2'),
                t('editorial.s5Item3'),
                t('editorial.s5Item4'),
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-blue-500 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">06.</span> {t('editorial.s6Title')}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {t('editorial.s6Text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">07.</span> {t('editorial.s7Title')}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {t('editorial.s7Text')}
            </p>
            {/* НАЙТИ и ЗАМЕНИТЬ кнопку в editorial/page.tsx — секция 07 */}
            
              <a href="https://t.me/duxturcom" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm transition">
              {t('editorial.reportError')}
            </a>
            
            
          </section>

        </div>
      </main>
    </div>
  );
}
