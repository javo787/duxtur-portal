import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: 'Все статьи — Duxtur.com',
    uz: 'Barcha maqolalar — Duxtur.com',
    tg: 'Ҳамаи мақолаҳо — Duxtur.com',
    kk: 'Барлық мақалалар — Duxtur.com',
    ky: 'Бардык макалалар — Duxtur.com',
  };
  return { title: titles[lang] || titles.ru };
}

const CATEGORIES = [
  { label: { ru: 'Все', uz: 'Barchasi', tg: 'Ҳама', kk: 'Барлығы', ky: 'Баары' }, slug: '' },
  { label: { ru: 'Кардиология', uz: 'Kardiologiya', tg: 'Кардиология', kk: 'Кардиология', ky: 'Кардиология' }, slug: 'cardiology' },
  { label: { ru: 'Неврология', uz: 'Nevrologiya', tg: 'Неврология', kk: 'Неврология', ky: 'Неврология' }, slug: 'neurology' },
  { label: { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' }, slug: 'dentistry' },
  { label: { ru: 'Педиатрия', uz: 'Pediatriya', tg: 'Педиатрия', kk: 'Педиатрия', ky: 'Педиатрия' }, slug: 'pediatrics' },
  { label: { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' }, slug: 'dermatology' },
];

export default async function BlogListPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { category } = await searchParams;

  await dbConnect();

  const query: any = {};
  if (category) {
    query.category = category;
  }

  const articles: any[] = await Article.find(query)
    .sort({ createdAt: -1 })
    .populate('authorId')
    .lean();

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const headings: Record<string, string> = {
    ru: 'Все статьи',
    uz: 'Barcha maqolalar',
    tg: 'Ҳамаи мақолаҳо',
    kk: 'Барлық мақалалар',
    ky: 'Бардык макалалар',
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-xl font-extrabold text-blue-600">
            duxtur<span className="text-gray-300 font-light">.com</span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
            ← Главная
          </Link>
        </div>
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider mb-5">
            ✓ Проверено врачами
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {headings[lang] || headings.ru}
          </h1>
          <p className="text-blue-200 text-lg">
            {articles.length} {articles.length === 1 ? 'материал' : articles.length < 5 ? 'материала' : 'материалов'} от практикующих врачей
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* КАТЕГОРИИ */}
        <div className="flex gap-2 flex-wrap mb-10">
          {CATEGORIES.map((cat) => {
            const isActive = (category || '') === cat.slug;
            const href = cat.slug
              ? `/${lang}/blog?category=${cat.slug}`
              : `/${lang}/blog`;
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`px-5 py-2 rounded-full text-sm font-bold transition border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {cat.label[lang as keyof typeof cat.label] || cat.label.ru}
              </Link>
            );
          })}
        </div>

        {/* СТАТЬИ */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-xl font-bold text-gray-700 mb-2">Статьи скоро появятся</p>
            <p className="text-gray-400 mb-8">Первые врачи уже готовят материалы</p>
            <Link href={`/${lang}/register`}
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition">
              Стать автором →
            </Link>
          </div>
        ) : (
          <>
            {/* Первая статья — крупная */}
            <Link href={`/${lang}/blog/${articles[0].slug}`} className="group block mb-8">
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition duration-300 md:flex h-72">
                <div className="md:w-1/2 overflow-hidden">
                  <img
                    src={articles[0].image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800'}
                    alt={t(articles[0].title)}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                </div>
                <div className="md:w-1/2 p-8 flex flex-col justify-between">
                  <div>
                    <span className="text-green-600 text-xs font-bold flex items-center gap-1 mb-3">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Проверено врачом
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-blue-600 transition leading-tight line-clamp-3">
                      {t(articles[0].title)}
                    </h2>
                    <p className="text-gray-500 mt-3 line-clamp-2 leading-relaxed text-sm">
                      {t(articles[0].overview)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={articles[0].authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                        alt={articles[0].authorId?.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-100"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none">{articles[0].authorId?.name || 'Dr. Expert'}</p>
                        <p className="text-xs text-blue-500 mt-0.5">{t(articles[0].authorId?.specialty)}</p>
                      </div>
                    </div>
                    <span className="text-blue-600 font-bold text-sm group-hover:translate-x-1 transition">
                      Читать →
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Остальные — сетка */}
            {articles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(1).map((article) => (
                  <Link
                    key={article._id}
                    href={`/${lang}/blog/${article.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                        alt={t(article.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-green-600 text-xs font-bold flex items-center gap-1 mb-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Проверено врачом
                      </span>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2 mb-2">
                        {t(article.title)}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                        {t(article.overview)}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <img
                            src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                            alt={article.authorId?.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]">
                            {article.authorId?.name || 'Dr. Expert'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(article.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
