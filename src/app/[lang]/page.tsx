import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';

type Props = {
  params: Promise<{ lang: Locale }>;
};

// 1. МЕТА-ТЕГИ
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: dict.meta_title,
    description: dict.meta_desc,
    keywords: ['врач', 'доктор', 'лечение', 'медицина', 'клиника', 'Таджикистан', 'Узбекистан', 'здоровье'],
    openGraph: {
      title: dict.meta_title,
      description: dict.meta_desc,
      type: 'website',
      siteName: 'Duxtur.com',
    },
  };
}

export default async function Home(props: Props) {
  const params = await props.params;
  const lang = params.lang;
  const dict = await getDictionary(lang);

  await dbConnect();
  
  const query = {
    $or: [
      { [`title.${lang}`]: { $exists: true, $ne: "" } }, 
      { [`title.ru`]: { $exists: true, $ne: "" } }
    ]
  };

  let articles: any[] = [];
  
  try {
    articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('authorId')
      .lean(); 
  } catch (error) {
    console.error("Ошибка загрузки статей:", error);
  }

  const getLocalized = (field: any) => {
    if (!field) return "";
    return field[lang] || field['ru'] || "";
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'Duxtur.com',
    url: 'https://duxtur.com',
    logo: 'https://duxtur.com/logo.png',
    description: dict.meta_desc,
    areaServed: ['Tajikistan', 'Uzbekistan', 'Kazakhstan', 'Kyrgyzstan'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `https://duxtur.com/${lang}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/${lang}`} className="text-2xl font-bold text-blue-600 tracking-tight hover:opacity-80 transition">
              duxtur<span className="text-gray-400">.com</span>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <Link href={`/${lang}/login`} className="hidden md:block px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-sm active:scale-95">
              {dict.nav_login}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
        
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase mb-6 tracking-wide shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {dict.blog_verified}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight drop-shadow-sm">
            {dict.hero_title}
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            {dict.hero_subtitle}
          </p>

          <form action={`/${lang}/search`} className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 border border-gray-100 max-w-2xl mx-auto transition hover:shadow-2xl">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                name="q"
                placeholder={dict.search_placeholder} 
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-gray-700 placeholder-gray-400"
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition shadow-md active:scale-95">
              {dict.search_btn}
            </button>
          </form>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-2">
          {dict.cat_title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CategoryCard title={dict.cat_dentist} icon="🦷" />
          <CategoryCard title={dict.cat_cardio} icon="❤️" />
          <CategoryCard title={dict.cat_neuro} icon="🧠" />
          <CategoryCard title={dict.cat_pediatr} icon="👶" />
        </div>
      </section>

      {/* VERIFIED BLOGS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10 border-b pb-4">
            <h2 className="text-3xl font-bold text-gray-900">
              {dict.blog_title}
            </h2>
          </div>
          
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.map((article: any) => (
                 <Link href={`/${lang}/blog/${article.slug}`} key={article._id} className="block h-full">
                    <BlogCard 
                      image={article.image || "https://source.unsplash.com/random/800x600?medicine"}
                      category="Medical"
                      title={getLocalized(article.title)}
                      doctor={article.authorId?.name || "Dr. Expert"}
                      verifiedLabel={dict.blog_verified}
                      btnText={dict.read_more}
                    />
                 </Link>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-4">📝</div>
                {/* ИСПРАВЛЕНИЕ ЗДЕСЬ: (dict as any) */}
                <p className="text-lg font-medium">{(dict as any).no_articles || "Пока статей нет"}</p>
                <Link href={`/${lang}/admin/write`} className="mt-4 text-blue-600 font-bold hover:underline">
                   Написать первую статью →
                </Link>
             </div>
          )}
        </div>
      </section>

      {/* FOR DOCTORS */}
      <section className="bg-slate-900 text-white py-20 mt-auto">
        <div className="container mx-auto px-4 text-center md:text-left md:flex items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">{dict.for_doctors}</h2>
            <p className="text-slate-300 text-lg mb-8 md:mb-0 leading-relaxed">{dict.for_doctors_desc}</p>
          </div>
          <button className="bg-white text-slate-900 font-bold py-4 px-10 rounded-full hover:bg-blue-50 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] transform hover:-translate-y-1 active:scale-95">
            {dict.btn_join}
          </button>
        </div>
      </section>
    </main>
  );
}

function BlogCard({ image, category, title, doctor, verifiedLabel, btnText }: any) {
  return (
    <div className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 h-full transform hover:-translate-y-1">
      <div className="h-52 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out" loading="lazy" />
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
          {category}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold uppercase mb-3">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {verifiedLabel}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition leading-snug line-clamp-2">{title}</h3>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">Dr</div>
            <span className="text-sm font-medium text-gray-500">{doctor}</span>
          </div>
          <span className="text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition flex items-center gap-1">{btnText} →</span>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ title, icon }: { title: string, icon: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group">
      <span className="text-4xl group-hover:scale-110 transition duration-300 filter grayscale group-hover:grayscale-0">{icon}</span>
      <span className="font-medium text-gray-700 group-hover:text-blue-600 transition">{title}</span>
    </div>
  );
}
