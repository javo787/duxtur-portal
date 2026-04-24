import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';

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

const sectionLabels: Record<string, Record<string, string>> = {
  symptoms:           { ru: 'Симптомы',        uz: 'Belgilar',      tg: 'Аломатҳо',     kk: 'Белгілер',     ky: 'Белгилер' },
  causes:             { ru: 'Причины',          uz: 'Sabablar',      tg: 'Сабабҳо',      kk: 'Себептер',     ky: 'Себептер' },
  diagnosis_treatment:{ ru: 'Лечение',          uz: 'Davolash',      tg: 'Табобат',      kk: 'Емдеу',        ky: 'Дарылоо' },
  prevention:         { ru: 'Профилактика',     uz: 'Profilaktika',  tg: 'Пешгирӣ',      kk: 'Алдын алу',    ky: 'Алдын алуу' },
};
const uiLabels: Record<string, Record<string, string>> = {
  author:    { ru: 'Автор',           uz: 'Muallif',      tg: 'Муаллиф',     kk: 'Автор',       ky: 'Автор' },
  verified:  { ru: 'Проверено врачом',uz: 'Tekshirilgan', tg: 'Тасдиқшуда',  kk: 'Тексерілген', ky: 'Текшерилген' },
  contents:  { ru: 'Содержание',      uz: 'Mundarija',    tg: 'Мундариҷа',   kk: 'Мазмұны',     ky: 'Мазмуну' },
  sources:   { ru: 'Источники',       uz: 'Manbalar',     tg: 'Сарчашмаҳо',  kk: 'Дереккөздер', ky: 'Булактар' },
  back:      { ru: 'На главную',      uz: 'Bosh sahifa',  tg: 'Саҳифаи асосӣ', kk: 'Басты бет', ky: 'Башкы бет' },
};

const L = (key: string, lang: string) => uiLabels[key]?.[lang] || uiLabels[key]?.['ru'] || key;
const SL = (key: string, lang: string) => sectionLabels[key]?.[lang] || sectionLabels[key]?.['ru'] || key;

export default async function BlogPage({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  await dbConnect();
  const { slug, lang } = await params;
  const article: any = await Article.findOne({ slug }).populate('authorId').lean();
  if (!article) notFound();

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const date = new Date(article.createdAt).toLocaleDateString(lang === 'kk' ? 'ru' : lang, {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const sections = [
    { id: 'symptoms', key: 'symptoms', content: t(article.symptoms) },
    { id: 'causes', key: 'causes', content: t(article.causes) },
    { id: 'treatment', key: 'diagnosis_treatment', content: t(article.diagnosis_treatment) },
    { id: 'prevention', key: 'prevention', content: t(article.prevention) },
  ].filter((s) => s.content && s.content.length > 0);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl h-14 flex items-center justify-between">
          <Link href={`/${lang}`} className="font-extrabold text-blue-600 text-xl">
            duxtur<span className="text-gray-400 font-light">.com</span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-500 hover:text-blue-600 font-medium transition">
            ← {L('back', lang)}
          </Link>
        </div>
      </header>

      <article className="pb-20">
        <div className="container mx-auto max-w-4xl px-6 pt-10 pb-6">
          {/* Breadcrumb */}
          <nav className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2 flex-wrap">
            <Link href={`/${lang}`} className="hover:text-blue-600 transition">Duxtur.com</Link>
            <span>/</span>
            <span className="text-blue-600 line-clamp-1">{t(article.title)}</span>
          </nav>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {t(article.title)}
          </h1>

          {/* Author + meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3">
              <img
                src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={article.authorId?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
              />
              <div>
                <p className="font-bold text-gray-900">{article.authorId?.name || 'Dr. Expert'}</p>
                <p className="text-xs text-blue-600">{t(article.authorId?.specialty) || 'Врач'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto flex-wrap">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                ✓ {L('verified', lang)}
              </span>
              <span className="text-gray-400 text-xs">{date}</span>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="container mx-auto max-w-4xl px-6 mb-12">
          <div className="w-full h-72 md:h-96 rounded-3xl overflow-hidden shadow-sm bg-gray-100">
            <img
              src={article.image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=900'}
              alt={t(article.title)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main content */}
          <div className="lg:col-span-8">
            {/* Overview */}
            <div className="text-lg leading-8 text-gray-800 mb-10 font-medium">
              <ReactMarkdown>{t(article.overview)}</ReactMarkdown>
            </div>

            {/* Table of contents */}
            {sections.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-6 mb-12 border border-blue-100">
                <h3 className="font-bold text-base mb-4 text-blue-900">{L('contents', lang)}</h3>
                <ul className="space-y-2">
                  {sections.map((sec) => (
                    <li key={sec.id}>
                      <a href={`#${sec.id}`} className="flex items-center text-blue-700 hover:text-blue-900 font-medium group text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mr-3 group-hover:bg-blue-600 transition shrink-0" />
                        <span className="border-b border-blue-200 group-hover:border-blue-600 transition">
                          {SL(sec.key, lang)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections */}
            <div className="space-y-14">
              {sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-20">
                  <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                    <span className="w-1 h-8 bg-blue-500 rounded-full shrink-0" />
                    {SL(sec.key, lang)}
                  </h2>
                  <div className="prose prose-lg prose-slate max-w-none text-gray-700 leading-8">
                    <ReactMarkdown
                      components={{
                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                        ul: ({ node, ...props }) => <ul className="space-y-3 list-none pl-0 my-4" {...props} />,
                        li: ({ node, ...props }) => (
                          <li className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1 text-blue-600 font-bold text-xs">•</span>
                            <div>{props.children}</div>
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

            {/* References */}
            {article.references && article.references.length > 0 && (
              <div className="mt-14 pt-8 border-t border-gray-200">
                <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">{L('sources', lang)}</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  {article.references.map((ref: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                      <span>{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              {/* Author card */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={article.authorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                    alt={article.authorId?.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{article.authorId?.name || 'Dr. Expert'}</p>
                    <p className="text-sm text-blue-600">{t(article.authorId?.specialty) || 'Врач'}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-green-700 text-xs font-bold bg-green-50 px-3 py-1 rounded-full w-fit">
                  ✓ {L('verified', lang)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
