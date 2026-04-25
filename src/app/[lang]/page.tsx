import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';

type Props = { params: Promise<{ lang: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.meta_title,
    description: dict.meta_desc,
    keywords: ['врач', 'медицина', 'здоровье', 'статьи врачей', 'Узбекистан', 'Таджикистан', 'Казахстан'],
    openGraph: { title: dict.meta_title, description: dict.meta_desc, type: 'website', siteName: 'Duxtur.com' },
  };
}

export default async function Home(props: Props) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  await dbConnect();

  const [articles, authors] = await Promise.all([
    Article.find({
      $or: [
        { [`title.${lang}`]: { $exists: true, $ne: '' } },
        { [`title.ru`]: { $exists: true, $ne: '' } },
      ],
    }).sort({ createdAt: -1 }).limit(9).populate('authorId').lean(),
    Doctor.find({ status: 'approved' }).limit(6).lean(),
  ]).catch(() => [[], []]);

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'Duxtur.com',
    url: 'https://duxtur.com',
    description: dict.meta_desc,
    areaServed: ['Tajikistan', 'Uzbekistan', 'Kazakhstan', 'Kyrgyzstan'],
  };

  const categories = [
    { label: dict.cat_cardio, icon: '❤️', slug: 'cardiology' },
    { label: dict.cat_neuro, icon: '🧠', slug: 'neurology' },
    { label: dict.cat_dentist, icon: '🦷', slug: 'dentistry' },
    { label: dict.cat_pediatr, icon: '👶', slug: 'pediatrics' },
    { label: 'Дерматология', icon: '🩺', slug: 'dermatology' },
    { label: 'Офтальмология', icon: '👁️', slug: 'ophthalmology' },
    { label: 'Хирургия', icon: '⚕️', slug: 'surgery' },
    { label: 'Гинекология', icon: '🌸', slug: 'gynecology' },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HEADER ── */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <Link href={`/${lang}`} className="text-2xl font-extrabold text-blue-600 tracking-tight hover:opacity-80 transition">
            duxtur<span className="text-gray-400 font-light">.com</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href={`/${lang}#articles`} className="hover:text-blue-600 transition">Статьи</Link>
            <Link href={`/${lang}/authors`} className="hover:text-blue-600 transition">Авторы</Link>
            <Link href={`/${lang}#categories`} className="hover:text-blue-600 transition">Категории</Link>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href={`/${lang}/register`}
              className="hidden md:block px-5 py-2 text-sm font-bold text-blue-600 border-2 border-blue-100 rounded-full hover:bg-blue-50 transition">
              Я врач →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-16 pb-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase mb-6 tracking-wide">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Статьи проверены врачами
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 leading-tight">
            {dict.hero_title}
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            {dict.hero_subtitle}
          </p>

          {/* Поиск по контенту */}
          <form action={`/${lang}/search`} className="bg-white p-2 rounded-2xl shadow-lg flex flex-col md:flex-row gap-2 border border-gray-100 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" name="q" placeholder={dict.search_placeholder}
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-gray-700 placeholder-gray-400" />
            </div>
            <button type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-md">
              {dict.search_btn}
            </button>
          </form>
        </div>
      </section>

      {/* ── КАТЕГОРИИ ── */}
      <section id="categories" className="py-12 container mx-auto px-4 max-w-7xl">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{dict.cat_title}</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/${lang}/search?q=${cat.label}`}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition group text-center">
              <span className="text-2xl group-hover:scale-110 transition">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700 leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── СТАТЬИ ── */}
      <section id="articles" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">{dict.blog_title}</h2>
            <Link href={`/${lang}/blog`} className="text-blue-600 text-sm font-bold hover:underline hidden md:block">
              Все статьи →
            </Link>
          </div>

          {(articles as any[]).length > 0 ? (
            <>
              {/* Первая статья — большая */}
              {(articles as any[]).length > 0 && (
                <div className="mb-8">
                  <Link href={`/${lang}/blog/${(articles as any[])[0].slug}`} className="group block">
                    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition md:flex">
                      <div className="md:w-1/2 h-64 md:h-auto overflow-hidden">
                        <img
                          src={(articles as any[])[0].image || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800'}
                          alt={t((articles as any[])[0].title)}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                        />
                      </div>
                      <div className="md:w-1/2 p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                            ✓ {dict.blog_verified}
                          </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 group-hover:text-blue-600 transition leading-tight">
                          {t((articles as any[])[0].title)}
                        </h3>
                        <div className="flex items-center gap-3 mt-auto">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">Dr</div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{(articles as any[])[0].authorId?.name || 'Dr. Expert'}</p>
                            <p className="text-xs text-gray-400">{t((articles as any[])[0].authorId?.specialty) || 'Врач'}</p>
                          </div>
                          <span className="ml-auto text-blue-600 font-bold text-sm group-hover:translate-x-1 transition">
                            {dict.read_more} →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Остальные статьи — сетка */}
              {(articles as any[]).length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {(articles as any[]).slice(1, 9).map((article: any) => (
                    <Link key={article._id} href={`/${lang}/blog/${article.slug}`} className="group block h-full">
                      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300 h-full flex flex-col">
                        <div className="h-44 overflow-hidden">
                          <img
                            src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                            alt={t(article.title)}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-center gap-1 text-green-600 text-xs font-bold mb-2">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {dict.blog_verified}
                          </div>
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2 flex-1">
                            {t(article.title)}
                          </h3>
                          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">Dr</div>
                            <span className="text-xs text-gray-500 truncate">{article.authorId?.name || 'Dr. Expert'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="text-center mt-8 md:hidden">
                <Link href={`/${lang}/blog`} className="text-blue-600 font-bold text-sm">Все статьи →</Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-lg font-medium mb-2">Статьи скоро появятся</p>
              <p className="text-sm mb-6">Первые врачи уже готовят материалы</p>
              <Link href={`/${lang}/register`}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition">
                Стать автором →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── АВТОРЫ-ВРАЧИ ── */}
      {(authors as any[]).length > 0 && (
        <section id="authors" className="py-16 container mx-auto px-4 max-w-7xl">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Наши авторы-врачи</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(authors as any[]).map((doc: any) => (
              <Link key={doc._id} href={`/${lang}/doctor/${doc.slug || doc._id}`}
                className="group flex flex-col items-center p-5 bg-gray-50 rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-200 transition text-center">
                <img
                  src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                  alt={doc.name}
                  className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-white shadow-sm group-hover:border-blue-300 transition"
                />
                <p className="font-bold text-sm text-gray-900 leading-tight">{doc.name}</p>
                <p className="text-xs text-blue-600 mt-1">{t(doc.specialty)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ДЛЯ ВРАЧЕЙ ── */}
      <section className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
            <div className="inline-block text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-4">
              Для врачей
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
              {dict.for_doctors}
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">{dict.for_doctors_desc}</p>
            <ul className="mt-6 space-y-2 text-slate-400 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Бесплатная регистрация</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI-помощник для написания статей</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Аудитория на 5 языках СНГ</li>
            </ul>
          </div>
          <Link href={`/${lang}/register`}
            className="shrink-0 bg-white text-slate-900 font-extrabold py-4 px-10 rounded-full hover:bg-blue-50 transition shadow-2xl transform hover:-translate-y-1 text-lg">
            {dict.btn_join} →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t py-10">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <Link href={`/${lang}`} className="font-extrabold text-gray-700 text-lg">
            duxtur<span className="text-blue-400">.com</span>
          </Link>
          <p>Медицинский контент-портал Центральной Азии</p>
          <p>© {new Date().getFullYear()} Duxtur.com</p>
        </div>
      </footer>
    </main>
  );
}
