import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const { q } = await searchParams;
  const titles: Record<string, string> = {
    ru: 'Поиск',
    uz: 'Qidiruv',
    tg: 'Ҷустуҷӯ',
    kk: 'Іздеу',
    ky: 'Издөө',
  };
  const label = titles[lang] || titles.ru;
  return {
    title: q ? `"${q}" — ${label} | Duxtur.org` : `${label} — Duxtur.org`,
    robots: { index: false, follow: true },
    alternates: buildAlternates('search', lang),
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { q } = await searchParams;

  await dbConnect();

  const articles: any[] = q
    ? await Article.find({
        $or: [
          { [`title.${lang}`]: { $regex: q, $options: 'i' } },
          { [`title.ru`]: { $regex: q, $options: 'i' } },
          { [`overview.${lang}`]: { $regex: q, $options: 'i' } },
          { [`overview.ru`]: { $regex: q, $options: 'i' } },
          { [`symptoms.${lang}`]: { $regex: q, $options: 'i' } },
          { [`symptoms.ru`]: { $regex: q, $options: 'i' } },
        ],
      })
        .sort({ createdAt: -1 })
        .populate('authorId')
        .lean()
    : [];

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const ui: Record<string, Record<string, string>> = {
    placeholder: { ru: 'Поиск по статьям...', uz: 'Maqolalar qidirish...', tg: 'Ҷустуҷӯи мақолаҳо...', kk: 'Мақалалар іздеу...', ky: 'Макалаларды издөө...' },
    btn:         { ru: 'Найти', uz: 'Qidirish', tg: 'Ёфтан', kk: 'Іздеу', ky: 'Издөө' },
    results:     { ru: 'Результаты', uz: 'Natijalar', tg: 'Натиҷаҳо', kk: 'Нәтижелер', ky: 'Жыйынтыктар' },
    nothing:     { ru: 'Ничего не найдено', uz: 'Hech narsa topilmadi', tg: 'Ҳеҷ чиз ёфт нашуд', kk: 'Ештеңе табылмады', ky: 'Эч нерсе табылган жок' },
    nothing_sub: { ru: 'Попробуйте другой запрос', uz: 'Boshqa so\'z sinab ko\'ring', tg: 'Дархости дигар санед', kk: 'Басқа сөз қолданып көріңіз', ky: 'Башка сөз менен издеп көрүңүз' },
    verified:    { ru: 'Проверено врачом', uz: 'Tekshirilgan', tg: 'Тасдиқшуда', kk: 'Тексерілген', ky: 'Текшерилген' },
    read:        { ru: 'Читать', uz: 'O\'qish', tg: 'Хондан', kk: 'Оқу', ky: 'Окуу' },
    start:       { ru: 'Начните вводить запрос', uz: 'Qidiruv so\'zini kiriting', tg: 'Дархостро ворид кунед', kk: 'Сұранысты енгізіңіз', ky: 'Суранысты киргизиңиз' },
    start_sub:   { ru: 'Например: мигрень, диабет, аллергия', uz: 'Masalan: migran, diabet', tg: 'Масалан: мигрен, диабет', kk: 'Мысалы: мигрень, диабет', ky: 'Мисалы: мигрень, диабет' },
  };
  const L = (key: string) => ui[key]?.[lang] || ui[key]?.ru || '';

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-xl font-extrabold text-blue-600">
            duxtur<span className="text-gray-300 font-light">.org</span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
            ← Главная
          </Link>
        </div>
      </header>

      {/* ПОИСКОВАЯ СТРОКА */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <form action={`/${lang}/search`} className="flex gap-3">
            <div className="relative flex-1">
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={q || ''}
                placeholder={L('placeholder')}
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
              />
            </div>
            <button type="submit"
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shrink-0">
              {L('btn')}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Нет запроса */}
        {!q && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-xl font-bold text-gray-700 mb-2">{L('start')}</p>
            <p className="text-gray-400">{L('start_sub')}</p>
          </div>
        )}

        {/* Есть запрос */}
        {q && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {L('results')}: <span className="text-blue-600">«{q}»</span>
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {articles.length === 0
                    ? L('nothing')
                    : `${articles.length} ${articles.length === 1 ? 'материал' : articles.length < 5 ? 'материала' : 'материалов'}`}
                </p>
              </div>
              {articles.length > 0 && (
                <Link href={`/${lang}/blog`}
                  className="text-sm text-blue-600 font-bold hover:underline hidden md:block">
                  Все статьи →
                </Link>
              )}
            </div>

            {articles.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                <div className="text-5xl mb-4">😔</div>
                <p className="text-xl font-bold text-gray-700 mb-2">{L('nothing')}</p>
                <p className="text-gray-400 mb-8">{L('nothing_sub')}</p>
                <Link href={`/${lang}/blog`}
                  className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition">
                  Все статьи →
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {articles.map((article) => (
                  <Link
                    key={article._id}
                    href={`/${lang}/blog/${article.slug}`}
                    className="group flex bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300"
                  >
                    <div className="w-36 md:w-52 shrink-0 overflow-hidden">
                      <img
                        src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                        alt={t(article.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      />
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-green-600 text-xs font-bold flex items-center gap-1 mb-2">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {L('verified')}
                        </span>
                        <h2 className="font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2 text-lg">
                          {t(article.title)}
                        </h2>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {t(article.overview)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <img
                            src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                            alt={article.authorId?.name}
                            className="w-7 h-7 rounded-full object-cover border border-gray-100"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-800 leading-none">{article.authorId?.name || 'Dr. Expert'}</p>
                            <p className="text-xs text-blue-500 mt-0.5">{t(article.authorId?.specialty)}</p>
                          </div>
                        </div>
                        <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition">
                          {L('read')} →
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
