import Link from 'next/link';
import FadeIn from '@/components/FadeIn';
import Image from 'next/image';

export default function HomeArticles({
  lang,
  articles,
  dict,
  t,
}: {
  lang: string;
  articles: any[];
  dict: any;
  t: (f: any) => string;
}) {
  if (articles.length === 0) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 text-center">
          <FadeIn>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-blue-100">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
              </svg>
            </div>
            <p className="font-display text-2xl font-semibold text-slate-800 mb-2">Статьи скоро появятся</p>
            <p className="text-slate-400 mb-8 text-[15px]">Первые врачи уже готовят материалы</p>
            <Link
              href={`/${lang}/register`}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl text-[14px] bg-blue-600 hover:bg-blue-700 transition active:scale-95"
            >
              Стать первым автором
            </Link>
          </FadeIn>
        </div>
      </section>
    );
  }

  const [featured, ...rest] = articles;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-5">
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2">
                Последние материалы
              </p>
              <h2 className="font-display text-[28px] font-bold text-slate-900 tracking-tight leading-none">
                {dict.blog_title}
              </h2>
            </div>
            <Link
              href={`/${lang}/blog`}
              className="flex items-center gap-1.5 text-[13.5px] font-medium text-blue-600 border-b border-blue-300 hover:border-blue-600 transition-colors pb-0.5"
            >
              Все статьи
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </FadeIn>

        {/* Featured article */}
        <FadeIn delay={80}>
          <Link href={`/${lang}/blog/${featured.slug}`} className="group block mb-10">
            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white hover:border-slate-200 transition-all duration-300 md:grid md:grid-cols-[3fr_2fr] shadow-sm hover:shadow-lg">
              <div className="h-64 md:h-[380px] overflow-hidden relative">
                <Image
                  src={featured.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900'}
                  alt={t(featured.title)}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/10 via-transparent to-transparent" />
              </div>
              <div className="p-9 flex flex-col justify-between bg-white">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full mb-6 bg-amber-100 text-amber-800">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {dict.blog_verified}
                  </span>
                  <h3 className="font-display text-[22px] md:text-[26px] font-semibold text-slate-900 group-hover:text-slate-800 transition leading-[1.25] line-clamp-3 mb-4" style={{ letterSpacing: '-0.025em' }}>
                    {t(featured.title)}
                  </h3>
                </div>
                <div className="flex items-center gap-3.5 pt-6 border-t border-slate-100">
                  <div className="relative shrink-0 w-10 h-10">
                    <Image
                      src={featured.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={featured.authorId?.name || 'Doctor'}
                      fill
                      className="rounded-xl object-cover border-2 border-slate-100"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-900 truncate">
                      {featured.authorId?.name || 'Dr. Expert'}
                    </p>
                    <p className="text-[12px] font-normal truncate text-blue-600">
                      {t(featured.authorId?.specialty) || 'Врач'}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[13px] font-medium text-blue-600 group-hover:gap-2 transition-all">
                    {dict.read_more}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </FadeIn>

        {/* Grid of articles */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {rest.slice(0, 8).map((article: any, i: number) => (
              <FadeIn key={article._id} delay={i * 55} direction="up">
                <Link href={`/${lang}/blog/${article.slug}`} className="group block h-full">
                  <div
                    className="rounded-xl overflow-hidden border bg-white h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-slate-100"
                  >
                    <div className="h-44 overflow-hidden relative flex-shrink-0">
                      <Image
                        src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                        alt={t(article.title)}
                        fill
                        className="object-cover group-hover:scale-[1.06] transition-transform duration-600 ease-out"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-amber-800">
                          <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {dict.blog_verified}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display text-[14.5px] font-semibold text-slate-800 group-hover:text-slate-900 transition-colors leading-snug line-clamp-2 flex-1 mb-4" style={{ letterSpacing: '-0.015em' }}>
                        {t(article.title)}
                      </h3>
                      <div className="pt-3.5 border-t border-slate-50 flex items-center gap-2.5">
                        <div className="relative w-6 h-6">
                          <Image
                            src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                          alt={article.authorId?.name || 'Doctor'}
                            fill
                            className="rounded-lg object-cover border border-slate-100"
                          />
                        </div>
                        <span className="text-[12px] text-slate-400 truncate font-normal flex-1">
                          {article.authorId?.name || 'Dr. Expert'}
                        </span>
                        <svg className="w-3 h-3 text-blue-300 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}

        <FadeIn delay={180}>
          <div className="text-center">
            <Link
              href={`/${lang}/blog`}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl border border-slate-200 text-[14px] font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 active:scale-95"
            >
              Смотреть все статьи
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
