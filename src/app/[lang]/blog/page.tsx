import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';
import Link from 'next/link';
import type { Metadata } from 'next';
import FadeIn from '@/components/FadeIn';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: "Все статьи — Duxtur.com",
    uz: "Barcha maqolalar — Duxtur.com",
    tg: "Ҳамаи мақолаҳо — Duxtur.com",
    kk: "Барлық мақалалар — Duxtur.com",
    ky: "Бардык макалалар — Duxtur.com",
  };
  const descs: Record<string, string> = {
    ru: "Медицинские статьи от практикующих врачей. Кардиология, неврология, педиатрия и другие специализации.",
    uz: "Amaliyotchi shifokorlardan tibbiy maqolalar. Kardiologiya, nevrologiya, pediatriya.",
    tg: "Мақолаҳои тиббӣ аз табибони амалкунанда. Кардиология, неврология, педиатрия.",
    kk: "Тәжірибелі дәрігерлерден медициналық мақалалар. Кардиология, неврология, педиатрия.",
    ky: "Практикалык дарыгерлерден медициналык макалалар. Кардиология, неврология, педиатрия.",
  };
  return {
    title: titles[lang] || titles.ru,
    description: descs[lang] || descs.ru,
    alternates: {
  canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/${lang}/blog`,
  languages: Object.fromEntries(
    ["ru", "uz", "tg", "kk", "ky"].map((l) => [
      l,
      `${process.env.NEXT_PUBLIC_BASE_URL}/${l}/blog`,
    ])
  ),
},
    openGraph: {
      title: titles[lang] || titles.ru,
      description: descs[lang] || descs.ru,
      type: "website",
    },
  };
}

const CATEGORIES = [
  { label: { ru: 'Все', uz: 'Barchasi', tg: 'Ҳама', kk: 'Барлығы', ky: 'Баары' }, slug: '', icon: '📋' },
  { label: { ru: 'Кардиология', uz: 'Kardiologiya', tg: 'Кардиология', kk: 'Кардиология', ky: 'Кардиология' }, slug: 'cardiology', icon: '❤️' },
  { label: { ru: 'Неврология', uz: 'Nevrologiya', tg: 'Неврология', kk: 'Неврология', ky: 'Неврология' }, slug: 'neurology', icon: '🧠' },
  { label: { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' }, slug: 'dentistry', icon: '🦷' },
  { label: { ru: 'Педиатрия', uz: 'Pediatriya', tg: 'Педиатрия', kk: 'Педиатрия', ky: 'Педиатрия' }, slug: 'pediatrics', icon: '👶' },
  { label: { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' }, slug: 'dermatology', icon: '🩺' },
];

const headings: Record<string, string> = {
  ru: 'Все статьи',
  uz: 'Barcha maqolalar',
  tg: 'Ҳамаи мақолаҳо',
  kk: 'Барлық мақалалар',
  ky: 'Бардык макалалар',
};

const verifiedLabel: Record<string, string> = {
  ru: 'Проверено врачом',
  uz: 'Tekshirilgan',
  tg: 'Тасдиқшуда',
  kk: 'Тексерілген',
  ky: 'Текшерилген',
};

const readLabel: Record<string, string> = {
  ru: 'Читать',
  uz: "O'qish",
  tg: 'Хондан',
  kk: 'Оқу',
  ky: 'Окуу',
};

export default async function BlogListPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { category } = await searchParams;

  await dbConnect();
  // Принудительно регистрируем Doctor модель
  void Doctor;

  const query: any = {};
  if (category) query.category = category;

  const articles: any[] = await Article.find(query)
    .sort({ createdAt: -1 })
    .populate('authorId')
    .lean();

  // Функция перевода — ищет на текущем языке, потом на всех остальных
  const t = (field: any): string => {
    if (!field) return '';
    return field[lang] || field['ru'] || field['uz'] || field['tg'] || field['kk'] || field['ky'] || '';
  };

  // Фильтруем статьи у которых ЕСТЬ хоть какой-то заголовок
  const validArticles = articles.filter(a => t(a.title).length > 0);

  const verified = verifiedLabel[lang] || verifiedLabel.ru;
  const readMore = readLabel[lang] || readLabel.ru;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-gray-900">duxtur<span className="text-blue-600">.com</span></span>
          </Link>
          <Link href={`/${lang}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {lang === 'ru' ? 'Главная' : lang === 'uz' ? 'Bosh sahifa' : lang === 'tg' ? 'Асосӣ' : lang === 'kk' ? 'Басты' : 'Башкы'}
          </Link>
        </div>
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white pt-14 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {verified}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              {headings[lang] || headings.ru}
            </h1>
            <p className="text-blue-200 text-base">
              {validArticles.length} {validArticles.length === 1 ? 'материал' : validArticles.length < 5 ? 'материала' : 'материалов'}
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* КАТЕГОРИИ — горизонтальный скролл */}
        <FadeIn>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
            {CATEGORIES.map((cat) => {
              const isActive = (category || '') === cat.slug;
              const href = cat.slug ? `/${lang}/blog?category=${cat.slug}` : `/${lang}/blog`;
              return (
                <Link key={cat.slug} href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition shrink-0 border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}>
                  <span>{cat.icon}</span>
                  {cat.label[lang as keyof typeof cat.label] || cat.label.ru}
                </Link>
              );
            })}
          </div>
        </FadeIn>

        {/* СТАТЬИ */}
        {validArticles.length === 0 ? (
          <FadeIn>
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-xl font-bold text-gray-700 mb-2">Статьи скоро появятся</p>
              <Link href={`/${lang}/register`}
                className="inline-flex mt-6 px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition">
                Стать автором →
              </Link>
            </div>
          </FadeIn>
        ) : (
          <>
            {/* Первая статья — крупная */}
            <FadeIn delay={100}>
              <Link href={`/${lang}/blog/${validArticles[0].slug}`} className="group block mb-8">
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition duration-500 md:grid md:grid-cols-5">
                  <div className="md:col-span-3 h-72 md:h-80 overflow-hidden relative">
                    <img
                      src={validArticles[0].image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900'}
                      alt={t(validArticles[0].title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>
                  <div className="md:col-span-2 p-8 flex flex-col justify-between relative">
                    {/* Синяя линия сверху при hover */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-extrabold px-3 py-1.5 rounded-full mb-4">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {verified}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight line-clamp-3 mb-3">
                        {t(validArticles[0].title)}
                      </h2>
                      <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                        {t(validArticles[0].overview)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-5 border-t border-gray-100 mt-4">
                      <div className="relative shrink-0">
                        <img
                          src={validArticles[0].authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                          alt={validArticles[0].authorId?.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{validArticles[0].authorId?.name || 'Dr.'}</p>
                        <p className="text-xs text-blue-500">{t(validArticles[0].authorId?.specialty)}</p>
                      </div>
                      <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                        {readMore}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>

            {/* Остальные — сетка */}
            {validArticles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {validArticles.slice(1).map((article, i) => (
                  <FadeIn key={article._id} delay={i * 60} direction="up">
                    <Link href={`/${lang}/blog/${article.slug}`}
                      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition duration-300 h-full flex flex-col">

                      {/* Фото */}
                      <div className="h-52 overflow-hidden relative">
                        <img
                          src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                          alt={t(article.title)}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        {/* Бейдж поверх фото */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/95 backdrop-blur-sm text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {verified}
                          </span>
                        </div>
                      </div>

                      {/* Контент */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-2 flex-1 mb-3">
                          {t(article.title)}
                        </h3>
                        {t(article.overview) && (
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                            {t(article.overview)}
                          </p>
                        )}
                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                                alt={article.authorId?.name}
                                className="w-7 h-7 rounded-full object-cover border border-gray-100"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white" />
                            </div>
                            <span className="text-xs text-gray-500 truncate font-medium">
                              {article.authorId?.name || 'Dr.'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">
                            {new Date(article.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
