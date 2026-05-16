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
import { buildAlternates, BASE_URL } from '@/lib/seo';

type Props = { params: Promise<{ lang: Locale }> };

export const revalidate = 3600; // ISR — обновление главной каждый час

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.meta_title,
    description: dict.meta_desc,
    keywords: ['врач', 'медицина', 'здоровье', 'статьи врачей', 'Узбекистан', 'Таджикистан', 'Казахстан'],
    openGraph: {
      title: dict.meta_title,
      description: dict.meta_desc,
      type: 'website',
      siteName: 'Duxtur.org',
      images: [`${BASE_URL}/og-default.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.meta_title,
      description: dict.meta_desc,
      images: [`${BASE_URL}/og-default.png`],
    },
    alternates: buildAlternates('', lang),
  };
}

export default async function Home(props: Props) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  await dbConnect();


 
const CATEGORIES = ['cardiology', 'neurology', 'dentistry', 'pediatrics', 'dermatology', 'ophthalmology', 'surgery', 'gynecology', 'general'];
 
const [articles, authors, categoryAgg] = await Promise.all([
  Article.find({
    $or: [
      { [`title.${lang}`]: { $exists: true, $ne: '' } },
      { [`title.ru`]: { $exists: true, $ne: '' } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(9)
    .populate('authorId')
    .lean(),
 
  Doctor.find({ status: 'approved' }).limit(6).lean(),
 
  // Считаем количество статей по каждой категории одним запросом
  Article.aggregate([
    { $match: { category: { $in: CATEGORIES } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]),
]).catch(() => [[], [], []]);
 
// Превращаем массив [{ _id: 'cardiology', count: 5 }, ...] в объект
const categoryCounts: Record<string, number> = {};
for (const item of (categoryAgg as any[])) {
  categoryCounts[item._id] = item.count;
}
 

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  // ── WebSite + Organization + SearchAction JSON-LD ─────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `${BASE_URL}/${lang}/#webpage`,
        url: `${BASE_URL}/${lang}`,
        name: dict.meta_title,
        description: dict.meta_desc,
        inLanguage: lang,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Duxtur.org', item: `${BASE_URL}/${lang}` },
          ],
        },
      },
      {
        '@type': ['MedicalOrganization', 'WebSite'],
        '@id': `${BASE_URL}/#organization`,
        name: 'Duxtur.org',
        url: BASE_URL,
        description: dict.meta_desc,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`,
          width: 180,
          height: 60,
        },
        image: `${BASE_URL}/og-default.png`,
        specialty: CATEGORIES.slice(0, 5).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        areaServed: [
          { '@type': 'Country', name: 'Tajikistan' },
          { '@type': 'Country', name: 'Uzbekistan' },
          { '@type': 'Country', name: 'Kazakhstan' },
          { '@type': 'Country', name: 'Kyrgyzstan' },
        ],
        inLanguage: ['ru', 'uz', 'tg', 'kk', 'ky'],
        sameAs: ['https://t.me/duxturcom'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/${lang}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }
    ]
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHeader lang={lang} />
      <HomeHero lang={lang} dict={dict} />
      <HomeCategories lang={lang} dict={dict} categoryCounts={categoryCounts} />
      <HomeArticles lang={lang} articles={articles as any[]} dict={dict} t={t} />
      <HomeAuthors lang={lang} authors={authors as any[]} t={t} />
      <HomeCTA lang={lang} dict={dict} />
      <HomeFooter lang={lang} />
    </main>
  );
}
