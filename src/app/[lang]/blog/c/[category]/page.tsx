import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';
import FadeIn from '@/components/FadeIn';
import { buildAlternates, BASE_URL } from '@/lib/seo';
import { getT, T } from '@/i18n';
import Image from 'next/image';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ lang: string; category: string }>;
};

const CATEGORIES = [
  { label: { ru: 'Все',          uz: 'Barchasi',      tg: 'Ҳама',        kk: 'Барлығы',   ky: 'Баары'        }, slug: '',            icon: '📋' },
  { label: { ru: 'Кардиология',  uz: 'Kardiologiya',  tg: 'Кардиология', kk: 'Кардиология', ky: 'Кардиология' }, slug: 'cardiology',  icon: '❤️' },
  { label: { ru: 'Неврология',   uz: 'Nevrologiya',   tg: 'Неврология',  kk: 'Неврология', ky: 'Неврология'  }, slug: 'neurology',   icon: '🧠' },
  { label: { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' }, slug: 'dentistry', icon: '🦷' },
  { label: { ru: 'Педиатрия',    uz: 'Pediatriya',    tg: 'Педиатрия',   kk: 'Педиатрия', ky: 'Педиатрия'   }, slug: 'pediatrics',  icon: '👶' },
  { label: { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' }, slug: 'dermatology', icon: '🩺' },
];

export async function generateStaticParams() {
  const languages = ['ru', 'uz', 'tg', 'kk', 'ky'];
  const categories = CATEGORIES.filter(c => c.slug).map(c => c.slug);
  return languages.flatMap(lang => categories.map(category => ({ lang, category })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category } = await params;
  const categoryInfo = CATEGORIES.find(c => c.slug === category);
  if (!categoryInfo) return notFound();

  const categoryName = T(`blog.category${category.charAt(0).toUpperCase() + category.slice(1)}`, lang);

  return {
    title: `${categoryName} — ${T('nav.authors', lang)} | Duxtur.org`,
    description: `${categoryName}. ${T('home.authorsSubtitle', lang)}.`,
    alternates: buildAlternates(`blog/c/${category}`, lang),
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { lang, category } = await params;
  const t = getT(lang);
  const categoryInfo = CATEGORIES.find(c => c.slug === category);
  if (!categoryInfo) notFound();

  await dbConnect();
  void Doctor;

  const articles: any[] = await Article.find({ category })
    .sort({ createdAt: -1 })
    .populate('authorId', 'name image specialty slug')
    .select('slug title overview image authorId createdAt category ratings')
    .lean();

  const dbT = (field: any): string => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const validArticles = articles.filter((a) => dbT(a.title).length > 0);
  const categoryName = t(`blog.category${category.charAt(0).toUpperCase() + category.slice(1)}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    url: `${BASE_URL}/${lang}/blog/c/${category}`,
    description: `${categoryName} — Duxtur.org`,
    numberOfItems: validArticles.length,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Duxtur.org', item: `${BASE_URL}/${lang}` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/${lang}/blog` },
        { '@type': 'ListItem', position: 3, name: categoryName, item: `${BASE_URL}/${lang}/blog/c/${category}` },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-gray-900">duxtur<span className="text-blue-600">.org</span></span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href={`/${lang}/blog`} className="text-sm text-gray-500 hover:text-gray-900 font-medium transition">
              {t('nav.home')}
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white pt-14 pb-16 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <nav className="flex items-center justify-center gap-1.5 text-xs text-blue-400/70 mb-5">
              <Link href={`/${lang}`} className="hover:text-blue-300 transition">{t('nav.home')}</Link>
              <span>/</span>
              <Link href={`/${lang}/blog`} className="hover:text-blue-300 transition">Blog</Link>
              <span>/</span>
              <span className="text-blue-200">{categoryName}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              {categoryName}
            </h1>
            <p className="text-blue-200 text-base">{validArticles.length} {t('common.articles')}</p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* КАТЕГОРИИ (Subset from main blog page) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.slug;
            const href = cat.slug ? `/${lang}/blog/c/${cat.slug}` : `/${lang}/blog`;
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span>{cat.icon}</span>
                  {t(`blog.category${cat.slug ? cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1) : 'All'}`)}
              </Link>
            );
          })}
        </div>

        {validArticles.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-gray-700 mb-2">{t('blog.comingSoon')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {validArticles.map((article, i) => (
              <FadeIn key={article._id} delay={i * 60} direction="up">
                <Link
                  href={`/${lang}/blog/${article.slug}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition duration-300 h-full"
                >
                  <div className="h-52 overflow-hidden relative shrink-0">
                    <Image
                      src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                      alt={dbT(article.title)}
                      fill
                      className="object-cover group-hover:scale-110 transition duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-2 flex-1 mb-3 text-base">
                      {dbT(article.title)}
                    </h3>
                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                          alt={article.authorId?.name}
                          className="w-7 h-7 rounded-full object-cover border border-gray-100"
                        />
                        <span className="text-xs text-gray-500 truncate font-medium">{article.authorId?.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(article.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
