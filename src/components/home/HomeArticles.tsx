import Link from 'next/link';

export default function HomeArticles({ lang, articles, dict, t }: {
  lang: string;
  articles: any[];
  dict: any;
  t: (f: any) => string;
}) {
  if (articles.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-xl font-bold text-gray-700 mb-2">Статьи скоро появятся</p>
          <p className="text-gray-400 mb-8 text-sm">Первые врачи уже готовят материалы</p>
          <Link href={`/${lang}/register`}
            className="inline-flex px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            Стать первым автором →
          </Link>
        </div>
      </section>
    );
  }

  const [featured, ...rest] = articles;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{dict.blog_title}</h2>
            <p className="text-sm text-gray-400 mt-1">{articles.length} материалов</p>
          </div>
          <Link href={`/${lang}/blog`}
            className="flex items-center gap-1 text-blue-600 text-sm font-bold hover:gap-2 transition-all">
            Все статьи
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Главная статья */}
        <Link href={`/${lang}/blog/${featured.slug}`} className="group block mb-6">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 md:grid md:grid-cols-5">
            <div className="md:col-span-3 h-64 md:h-80 overflow-hidden">
              <img
                src={featured.image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900'}
                alt={t(featured.title)}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />
            </div>
            <div className="md:col-span-2 p-8 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-extrabold px-3 py-1.5 rounded-full mb-4">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {dict.blog_verified}
                </span>
                <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-600 transition leading-tight line-clamp-3">
                  {t(featured.title)}
                </h3>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                <img
                  src={featured.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                  alt={featured.authorId?.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{featured.authorId?.name || 'Dr. Expert'}</p>
                  <p className="text-xs text-blue-500 truncate">{t(featured.authorId?.specialty) || 'Врач'}</p>
                </div>
                <span className="text-blue-600 font-bold text-sm group-hover:translate-x-1 transition shrink-0">
                  {dict.read_more} →
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Остальные статьи */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {rest.slice(0, 8).map((article: any) => (
              <Link key={article._id} href={`/${lang}/blog/${article.slug}`} className="group block">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 h-full flex flex-col">
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                      alt={t(article.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {dict.blog_verified}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2 flex-1 text-sm">
                      {t(article.title)}
                    </h3>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                      <img
                        src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                        alt={article.authorId?.name}
                        className="w-7 h-7 rounded-full object-cover border border-gray-100 shrink-0"
                      />
                      <span className="text-xs text-gray-500 truncate font-medium">{article.authorId?.name || 'Dr. Expert'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-full hover:border-blue-400 hover:text-blue-600 transition text-sm">
            Смотреть все статьи
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
