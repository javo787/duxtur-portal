import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import HomeHeader from '@/components/home/HomeHeader';
import HomeHero from '@/components/home/HomeHero';
import HomeCategories from '@/components/home/HomeCategories';
import HomeArticles from '@/components/home/HomeArticles';
import HomeAuthors from '@/components/home/HomeAuthors';
import HomeCTA from '@/components/home/HomeCTA';
import HomeFooter from '@/components/home/HomeFooter';
import { buildAlternates } from '@/lib/seo';

type Props = { params: Promise<{ lang: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.meta_title,
    description: dict.meta_desc,
    keywords: ['врач', 'медицина', 'здоровье', 'статьи врачей', 'Узбекистан', 'Таджикистан', 'Казахстан'],
    openGraph: { title: dict.meta_title, description: dict.meta_desc, type: 'website', siteName: 'Duxtur.com' },
    alternates: buildAlternates(''),
  };
}

export default async function Home(props: Props) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  await dbConnect();

  const [articles, authors] = await Promise.all([
    Article.find({
      $or: [
        { [`title.${lang}`]: { $exists: true, $ne: '' } },
        { [`title.ru`]: { $exists: true, $ne: '' } },
      ],
    }).sort({ createdAt: -1 }).limit(9).populate('authorId').lean(),
    Doctor.find({ status: 'approved' }).limit(6).lean(),
  ]).catch(() => [[], []]);

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur-portal.vercel.app';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['MedicalOrganization', 'WebSite'],
    name: 'Duxtur.com',
    url: baseUrl,
    description: dict.meta_desc,
    areaServed: ['Tajikistan', 'Uzbekistan', 'Kazakhstan', 'Kyrgyzstan'],
    inLanguage: ['ru', 'uz', 'tg', 'kk', 'ky'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${lang}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.com',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
   breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Duxtur.com',
          item: baseUrl,
        },
      ],
    }, 
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeHeader lang={lang} />
      <HomeHero lang={lang} dict={dict} />
      <HomeCategories lang={lang} dict={dict} />
      <HomeArticles lang={lang} articles={articles as any[]} dict={dict} t={t} />
      <HomeAuthors lang={lang} authors={authors as any[]} t={t} />
      <HomeCTA lang={lang} dict={dict} />
      <HomeFooter lang={lang} />
    </main>
  );
}
