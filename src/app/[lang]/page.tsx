import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n';
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
import { clinicSerif } from '@/lib/fonts';
import { buildAlternates, BASE_URL } from '@/lib/seo';
import { eduNavLabels } from '@/lib/edu-labels';

type Props = { params: Promise<{ lang: string }> };

export const revalidate = 3600; // ISR — обновление главной каждый час

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = (await params) as { lang: Locale };
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
    other: {
      'link:rss': `${BASE_URL}/${lang}/feed.xml`,
    },
  };
}

export default async function Home(props: Props) {
  const { lang } = (await props.params) as { lang: Locale };
  const dict = await getDictionary(lang);

  await dbConnect();


 
const CATEGORIES = ['cardiology', 'neurology', 'dentistry', 'pediatrics', 'dermatology', 'ophthalmology', 'surgery', 'gynecology', 'general'];
 
const [articles, authors, categoryAgg] = await Promise.all([
  // The newest articles in any language: each one is shown in the language it exists in (see lib/article-lang.ts).
  // Only the fields the cards need: the section texts stay in the database.
  Article.find({
    $or: ['ru', 'tg', 'uz', 'kk', 'ky'].map(l => ({ [`title.${l}`]: { $exists: true, $ne: '' } })),
  })
    .sort({ createdAt: -1 })
    .limit(7)
    .select('slug title overview image category isVerified authorId createdAt')
    .populate('authorId', 'name specialty image slug')
    .lean(),
 
  Doctor.find({ status: 'approved' }).limit(6).select('name specialty image slug').lean(),
 
  // Считаем количество статей по каждой категории одним запросом
  Article.aggregate([
    { $match: { category: { $in: CATEGORIES } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]).read('secondaryPreferred'),
]).catch(() => [[], [], []]);
 
// Превращаем массив [{ _id: 'cardiology', count: 5 }, ...] в объект
const categoryCounts: Record<string, number> = {};
for (const item of (categoryAgg as { _id: string; count: number }[])) {
  categoryCounts[item._id] = item.count;
}
 

  // UI strings (not DB fields)
  const eduLabels = eduNavLabels(lang);

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
    <div className={`${clinicSerif.variable} min-h-screen bg-background text-foreground`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHeader lang={lang} eduLabel={eduLabels.students} eduTeacherLabel={eduLabels.teachers} />
      <main>
        <HomeHero lang={lang} dict={dict} />
        <HomeCategories lang={lang} dict={dict} categoryCounts={categoryCounts} />
        <HomeArticles lang={lang} articles={articles} dict={dict} />
        <HomeAuthors lang={lang} authors={authors} />
        <HomeCTA lang={lang} dict={dict} />
      </main>
      <HomeFooter lang={lang} />
    </div>
  );
}
