import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';
import Link from 'next/link';
import ArticleEngagement from '@/components/ArticleEngagement';

const sectionLabels: Record<string, Record<string, string>> = {
  symptoms:            { ru: 'Симптомы',    uz: 'Belgilar',     tg: 'Аломатҳо',  kk: 'Белгілер',  ky: 'Белгилер' },
  causes:              { ru: 'Причины',     uz: 'Sabablar',     tg: 'Сабабҳо',   kk: 'Себептер',  ky: 'Себептер' },
  diagnosis_treatment: { ru: 'Лечение',     uz: 'Davolash',     tg: 'Табобат',   kk: 'Емдеу',     ky: 'Дарылоо' },
  prevention:          { ru: 'Профилактика',uz: 'Profilaktika', tg: 'Пешгирӣ',   kk: 'Алдын алу', ky: 'Алдын алуу' },
};

const uiLabels: Record<string, Record<string, string>> = {
  verified: { ru: 'Проверено врачом', uz: 'Tekshirilgan', tg: 'Тасдиқшуда',    kk: 'Тексерілген', ky: 'Текшерилген' },
  contents: { ru: 'Содержание',       uz: 'Mundarija',    tg: 'Мундариҷа',     kk: 'Мазмұны',     ky: 'Мазмуну' },
  sources:  { ru: 'Источники',        uz: 'Manbalar',     tg: 'Сарчашмаҳо',   kk: 'Дереккөздер', ky: 'Булактар' },
  back:     { ru: 'Главная',          uz: 'Bosh sahifa',  tg: 'Саҳифаи асосӣ', kk: 'Басты бет',   ky: 'Башкы бет' },
  readmin:  { ru: 'мин чтения',       uz: 'daqiqa',       tg: 'дақиқа',        kk: 'мин',         ky: 'мүн' },
  author:   { ru: 'Об авторе',        uz: 'Muallif haqida', tg: 'Дар бораи муаллиф', kk: 'Автор туралы', ky: 'Автор жөнүндө' },
  articles: { ru: 'статьи автора →',  uz: 'muallifning maqolalari →', tg: 'мақолаҳои муаллиф →', kk: 'автор мақалалары →', ky: 'автордун макалалары →' },
};

const L  = (key: string, lang: string) => uiLabels[key]?.[lang]      || uiLabels[key]?.ru      || key;
const SL = (key: string, lang: string) => sectionLabels[key]?.[lang] || sectionLabels[key]?.ru || key;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lang: string }> }): Promise<Metadata> {
  await dbConnect();
  const { slug, lang } = await params;
  const article = await Article.findOne({ slug });
  if (!article) return { title: 'Not Found' };
  const t = (f: any) => (f && (f[lang] || f['ru'])) || '';
  return {
    title: `${t(article.title)} | Duxtur.com`,
    description: t(article.overview).substring(0, 160),
    openGraph: {
      title: `${t(article.title)} | Duxtur.com`,
      description: t(article.overview).substring(0, 160),
      images: article.image ? [article.image] : [],
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  await dbConnect();
  const { slug, lang } = await params;
  const article: any = await Article.findOne({ slug }).populate('authorId').lean();
  if (!article) notFound();

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  // Время чтения
  const fullText = [
    t(article.overview),
    t(article.symptoms),
    t(article.causes),
    t(article.diagnosis_treatment),
    t(article.prevention),
  ].join(' ');
  const readingMinutes = Math.max(1, Math.ceil(fullText.split(' ').length / 200));

  // Средний рейтинг
  const avgRating = article.ratings?.length > 0
    ? Math.round((article.ratings.reduce((a: number, b: number) => a + b, 0) / article.ratings.length) * 10) / 10
    : 0;

  const date = new Date(article.createdAt).toLocaleDateString('ru', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const sections = [
    { id: 'symptoms',  key: 'symptoms',            content: t(article.symptoms) },
    { id: 'causes',    key: 'causes',              content: t(article.causes) },
    { id: 'treatment', key: 'diagnosis_treatment', content: t(article.diagnosis_treatment) },
    { id: 'prevention',key: 'prevention',          content: t(article.prevention) },
  ].filter((s) => s.content && s.content.length > 0);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/${lang}`} className="font-extrabold text-blue-600 text-xl">
            duxtur<span className="text-gray-300 font-light">.com</span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-400 hover:text-gray-700 font-medium transition flex items-center gap-1">
            ← {L('back', lang)}
          </Link>
        </div>
      </header>

      <article className="pb-24">

        {/* HERO IMAGE + OVERLAY TITLE */}
        <div className="relative w-full h-72 md:h-[460px] bg-gray-900 overflow-hidden">
          <img
            src={article.image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200'}
            alt={t(article.title)}
            className="w-full h-full object-cover opacity-60"
          />
          {/* Градиент снизу */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

          {/* Заголовок поверх фото */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="bg-green-500 text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {L('verified', lang)}
              </span>
              <span className="text-white/60 text-xs flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readingMinutes} {L('readmin', lang)}
              </span>
              {avgRating > 0 && (
                <span className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                  ★ {avgRating}
                  <span className="text-white/50 font-normal">({article.ratings?.length})</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              {t(article.title)}
            </h1>
          </div>
        </div>

        {/* АВТОР + ДАТА */}
        <div className="max-w-4xl mx-auto px-6 py-6 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/${lang}/doctor/${article.authorId?.slug || article.authorId?._id}`}
              className="flex items-center gap-3 group"
            >
              <img
                src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={article.authorId?.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-blue-100 group-hover:border-blue-400 transition"
              />
              <div>
                <p className="font-bold text-gray-900 group-hover:text-blue-600 transition text-sm">
                  {article.authorId?.name || 'Dr. Expert'}
                </p>
                <p className="text-xs text-blue-500">
                  {t(article.authorId?.specialty) || 'Врач'}
                </p>
              </div>
            </Link>
            <span className="text-gray-300 hidden md:block">|</span>
            <span className="text-xs text-gray-400 ml-auto">{date}</span>
          </div>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* ЛЕВАЯ ЧАСТЬ */}
          <div className="lg:col-span-8">

            {/* Breadcrumb */}
            <nav className="text-xs text-gray-400 mb-8 flex items-center gap-2 flex-wrap">
              <Link href={`/${lang}`} className="hover:text-blue-600 transition font-medium">Duxtur.com</Link>
              <span>/</span>
              <Link href={`/${lang}/blog`} className="hover:text-blue-600 transition font-medium">Blog</Link>
              <span>/</span>
              <span className="text-gray-600 line-clamp-1">{t(article.title)}</span>
            </nav>

            {/* Overview */}
            <div className="text-lg leading-8 text-gray-700 mb-10 font-medium">
              <ReactMarkdown>{t(article.overview)}</ReactMarkdown>
            </div>

            {/* Оглавление */}
            {sections.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-6 mb-12 border border-blue-100">
                <h3 className="font-extrabold text-sm text-blue-900 mb-4 uppercase tracking-wider">
                  {L('contents', lang)}
                </h3>
                <ul className="space-y-2">
                  {sections.map((sec, i) => (
                    <li key={sec.id}>
                      <a href={`#${sec.id}`}
                        className="flex items-center gap-3 text-blue-700 hover:text-blue-900 font-medium group text-sm">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-extrabold flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                          {i + 1}
                        </span>
                        {SL(sec.key, lang)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Секции */}
            <div className="space-y-14">
              {sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-20">
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-blue-500 rounded-full shrink-0" />
                    {SL(sec.key, lang)}
                  </h2>
                  <div className="prose prose-lg prose-slate max-w-none text-gray-700 leading-8">
                    <ReactMarkdown
                      components={{
                        strong: ({ node, ...props }) => (
                          <strong className="font-extrabold text-gray-900" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="space-y-3 list-none pl-0 my-4" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-1 text-blue-500 font-extrabold text-xs">
                              ✓
                            </span>
                            <div className="flex-1">{props.children}</div>
                          </li>
                        ),
                      }}
                    >
                      {sec.content}
                    </ReactMarkdown>
                  </div>
                </section>
              ))}
            </div>

            {/* Источники */}
            {article.references?.length > 0 && (
              <div className="mt-14 pt-8 border-t border-gray-100">
                <h4 className="font-extrabold text-gray-500 mb-4 text-xs uppercase tracking-widest">
                  {L('sources', lang)}
                </h4>
                <ul className="space-y-2">
                  {article.references.map((ref: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-500">
                      <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                      <span>{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ENGAGEMENT — звёздочки + лайки */}
            <ArticleEngagement
              slug={article.slug}
              initialRating={avgRating}
              initialRatingCount={article.ratings?.length || 0}
              initialLikesUp={article.likesUp || 0}
              initialLikesDown={article.likesDown || 0}
              lang={lang}
            />
          </div>

          {/* САЙДБАР */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-5">

              {/* Карточка автора */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 text-white">
                  <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3">
                    {L('author', lang)}
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={article.authorId?.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20"
                    />
                    <div>
                      <p className="font-extrabold text-white">{article.authorId?.name || 'Dr. Expert'}</p>
                      <p className="text-blue-300 text-sm">{t(article.authorId?.specialty) || 'Врач'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-green-100 text-green-700 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {L('verified', lang)}
                    </span>
                  </div>
                  <Link
                    href={`/${lang}/doctor/${article.authorId?.slug || article.authorId?._id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-sm transition"
                  >
                    {L('articles', lang)}
                  </Link>
                </div>
              </div>

              {/* Рейтинг в сайдбаре */}
              {avgRating > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 text-center">
                  <p className="text-3xl font-extrabold text-gray-900">{avgRating}</p>
                  <div className="flex justify-center my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{article.ratings?.length} оценок</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
