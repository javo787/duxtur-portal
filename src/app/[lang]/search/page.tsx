import { getT, Locale } from '@/i18n';
import HomeHeader from '@/components/home/HomeHeader';
import HomeFooter from '@/components/home/HomeFooter';
import SearchClient from './SearchClient';
import { eduNavLabels } from '@/lib/edu-labels';
import { type Metadata } from 'next';
import { ogLocale, ogAlternateLocales, BASE_URL } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = (await params) as { lang: Locale };
  const t = getT(lang);
  const title = t('search.title');
  const description = t('search.placeholder');

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'Duxtur.org',
      title,
      description,
      locale: ogLocale(lang),
      alternateLocale: ogAlternateLocales(lang),
      images: [{ url: `${BASE_URL}/og-default.png`, width: 1424, height: 752, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${BASE_URL}/og-default.png`] },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = (await params) as { lang: Locale };
  const { q } = await searchParams;
  const t = getT(lang);
  const eduLabels = eduNavLabels(lang);

  const headerLabels = {
    articles: t('nav.articles'),
    findDoctor: t('nav.findDoctor'),
    clinics: t('clinic.title'),
    search: t('common.search'),
    login: t('nav.login'),
    logout: t('nav.logout'),
    becomeAuthor: t('nav.becomeAuthor'),
    myOffice: t('nav.myOffice'),
    menu: t('nav.menu'),
  };

  return (
    <>
      <HomeHeader
        lang={lang}
        labels={headerLabels}
        eduLabel={eduLabels.students}
        eduTeacherLabel={eduLabels.teachers}
      />
      <main>
        <SearchClient lang={lang} initialQ={q || ''} />
      </main>
      <HomeFooter lang={lang} />
    </>
  );
}
