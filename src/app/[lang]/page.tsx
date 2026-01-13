import { getDictionary } from '@/get-dictionary';
import { Locale } from '@/i18n-config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ lang: Locale }>;
};

// 1. ГЕНЕРАЦИЯ МЕТА-ТЕГОВ ДЛЯ GOOGLE/YANDEX
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return {
    title: dict.meta_title,
    description: dict.meta_desc,
    // Ключевые слова помогают поисковикам понять тематику
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

  // 2. SCHEMA.ORG (JSON-LD) - ЧТОБЫ GOOGLE ПОНИМАЛ, ЧТО ЭТО МЕДИЦИНА
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization', // Мы говорим: "Мы - Медицинская Организация"
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
      {/* Вставка JSON-LD для роботов */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600 tracking-tight">duxtur<span className="text-gray-400">.com</span></span>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <Link href={`/${lang}/login`} className="hidden md:block px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-sm">
              {dict.nav_login}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase mb-6 tracking-wide">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {dict.blog_verified}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            {dict.hero_title}
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            {dict.hero_subtitle}
          </p>

          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 border border-gray-100 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder={dict.search_placeholder} 
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition shadow-md">
              {dict.search_btn}
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-gray-800">{dict.cat_title}</h2>
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
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              {dict.blog_title}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BlogCard 
              image="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              category={dict.cat_cardio}
              title="Гипертония: почему болит голова по утрам?"
              doctor="Dr. Azimov"
              verifiedLabel={dict.blog_verified}
              btnText={dict.read_more}
            />
            <BlogCard 
              image="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              category={dict.cat_neuro}
              title="Мигрень или просто усталость? Как отличить."
              doctor="Dr. Karimova"
              verifiedLabel={dict.blog_verified}
              btnText={dict.read_more}
            />
             <BlogCard 
              image="https://images.unsplash.com/photo-1581056771107-24ca5f033842?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              category={dict.cat_dentist}
              title="Зубная боль: что делать до визита к врачу"
              doctor="Dr. Sobirov"
              verifiedLabel={dict.blog_verified}
              btnText={dict.read_more}
            />
          </div>
        </div>
      </section>

      {/* FOR DOCTORS */}
      <section className="bg-slate-900 text-white py-20 mt-auto">
        <div className="container mx-auto px-4 text-center md:text-left md:flex items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold mb-4">{dict.for_doctors}</h2>
            <p className="text-slate-300 text-lg mb-8 md:mb-0">{dict.for_doctors_desc}</p>
          </div>
          <button className="bg-white text-slate-900 font-bold py-4 px-10 rounded-full hover:bg-blue-50 transition shadow-lg transform hover:-translate-y-1">
            {dict.btn_join}
          </button>
        </div>
      </section>
    </main>
  );
}

function BlogCard({ image, category, title, doctor, verifiedLabel, btnText }: any) {
  return (
    <div className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
      <div className="h-48 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700">
          {category}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold uppercase mb-3">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {verifiedLabel}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">{title}</h3>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">Dr</div>
            <span className="text-sm font-medium text-gray-500">{doctor}</span>
          </div>
          <span className="text-blue-600 text-sm font-semibold">{btnText} →</span>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ title, icon }: { title: string, icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 text-center group">
      <span className="text-4xl group-hover:scale-110 transition">{icon}</span>
      <span className="font-medium text-gray-700 group-hover:text-blue-600">{title}</span>
    </div>
  );
}
