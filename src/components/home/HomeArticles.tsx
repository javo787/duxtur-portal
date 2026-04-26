import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

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
          <FadeIn>
            <div className="text-6xl mb-5">📝</div>
            <p className="text-2xl font-extrabold text-gray-800 mb-3">Статьи скоро появятся</p>
            <p className="text-gray-400 mb-8">Первые врачи уже готовят материалы</p>
            <Link href={`/${lang}/register`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95">
              Стать первым автором →
            </Link>
          </FadeIn>
        </div>
      </section>
    );
  }

  const [featured, ...rest] = articles;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Заголовок */}
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{dict.blog_title}</h2>
              <p className="text-sm text-gray-400 mt-1">{articles.length} материалов</p>
            </div>
            <Link href={`/${lang}/blog`}
              className="flex items-center gap-1.5 text-blue-600 text-sm font-bold hover:gap-3 transition-all group">
              Все статьи
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </FadeIn>

        {/* Главная статья */}
        <FadeIn delay={100}>
          <Link href={`/${lang}/blog/${featured.slug}`} className="group block mb-8">
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition duration-500 md:grid md:grid-cols-5">
              {/* Фото */}
              <div className="md:col-span-3 h-64 md:h-96 overflow-hidden relative">
                <img
                  src={featured.image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900'}
                  alt={t(featured.title)}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:bg-none" />
              </div>

              {/* Контент */}
              <div className="md:col-span-2 p-8 flex flex-col justify-between bg-white relative">
                {/* Верхний акцент */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div>
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-extrabold px-3 py-1.5 rounded-full mb-5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {dict.blog_verified}
                  </span>

                  <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight line-clamp-3 mb-4">
                    {t(featured.title)}
                  </h3>
                </div>

                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className="relative shrink-0">
                    <img
                      src={featured.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={featured.authorId?.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{featured.authorId?.name || 'Dr. Expert'}</p>
                    <p className="text-xs text-blue-500 truncate">{t(featured.authorId?.specialty) || 'Врач'}</p>
                  </div>
                  <span className="text-blue-600 font-bold text-sm group-hover:translate-x-1.5 transition-transform shrink-0 flex items-center gap-1">
                    {dict.read_more}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </FadeIn>

        {/* Остальные статьи — сетка */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {rest.slice(0, 8).map((article: any, i: number) => (
              <FadeIn key={article._id} delay={i * 70} direction="up">
                <Link href={`/${lang}/blog/${article.slug}`} className="group block h-full">
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition duration-300 h-full flex flex-col">

                    {/* Фото */}
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                        alt={t(article.title)}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                        loading="lazy"
                      />
                      {/* Верифицирован бейдж */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/95 backdrop-blur-sm text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {dict.blog_verified}
                        </span>
                      </div>
                      {/* Overlay при hover */}
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-300" />
                    </div>

                    {/* Контент */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-2 flex-1 text-sm mb-3">
                        {t(article.title)}
                      </h3>
                      <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
                        <div className="relative shrink-0">
                          <img
                            src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                            alt={article.authorId?.name}
                            className="w-7 h-7 rounded-full object-cover border border-gray-100"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white" />
                        </div>
                        <span className="text-xs text-gray-500 truncate font-medium flex-1">
                          {article.authorId?.name || 'Dr. Expert'}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Кнопка все статьи */}
        <FadeIn delay={200}>
          <div className="text-center">
            <Link href={`/${lang}/blog`}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-full hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm active:scale-95">
              Смотреть все статьи
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
