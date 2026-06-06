'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/i18n';
import FadeIn from '@/components/FadeIn';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Search, X, BookOpen, User, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { slug: 'cardiology', icon: '❤️' },
  { slug: 'neurology', icon: '🧠' },
  { slug: 'dentistry', icon: '🦷' },
  { slug: 'pediatrics', icon: '👶' },
  { slug: 'dermatology', icon: '🩺' },
  { slug: 'ophthalmology', icon: '👁️' },
  { slug: 'surgery', icon: '✂️' },
  { slug: 'gynecology', icon: '🌸' },
];

export default function SearchPage({ params, searchParams: searchParamsPromise }: { params: Promise<{ lang: string }>, searchParams: Promise<{ q?: string }> }) {
  const { lang } = use(params);
  const { q: initialQ } = use(searchParamsPromise);
  const { t } = useT(lang);

  const [q, setQ] = useState(initialQ || '');
  const [results, setResults] = useState<any>({ articles: [], doctors: [], totalArticles: 0, totalDoctors: 0 });
  const [type, setType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async (query: string, searchType: string) => {
    if (!query.trim()) {
      setResults({ articles: [], doctors: [], totalArticles: 0, totalDoctors: 0 });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${searchType}&lang=${lang}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(q, type);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, type, handleSearch]);

  const dbT = (field: any) => field?.[lang] || field?.ru || '';

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans pb-24">
      {/* Sticky Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2.5 group transition-all duration-200">
            <Image src="/logo.png" alt="Duxtur logo" width={36} height={36} className="rounded-xl object-contain group-hover:opacity-90 transition" />
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              duxtur<span className="text-blue-600">.org</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-12 md:py-20 relative overflow-hidden">
        {/* Decorative blur circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl" />

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <FadeIn>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center tracking-tight">
              {t('search.title')}
            </h1>

            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              </div>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-14 pr-12 py-4 md:py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-900 text-lg shadow-2xl focus:bg-white focus:border-blue-500 transition-all duration-200 placeholder:text-slate-400 focus:outline-none"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute inset-y-0 right-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide snap-x shrink-0">
              {[
                { id: 'all', label: t('search.tabAll') },
                { id: 'articles', label: t('search.tabArticles') },
                { id: 'doctors', label: t('search.tabDoctors') }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setType(tab.id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 shrink-0 snap-start whitespace-nowrap ${
                    type === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-pulse flex gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : q.trim() === '' ? (
          /* Popular Categories */
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {t('home.categoriesTitle')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${lang}/blog?category=${cat.slug}`}
                    className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors duration-200">
                      {t(`blog.category${cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1)}`)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-12">
            {/* Doctors Results */}
            {(type === 'all' || type === 'doctors') && results.doctors?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">{t('search.foundDoctors')}: {results.totalDoctors}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.doctors.map((doc: any, i: number) => (
                    <FadeIn key={doc._id} delay={i * 60} direction="up">
                      <Link
                        href={`/${lang}/doctor/${doc.slug || doc._id}`}
                        className="group bg-white p-4 rounded-2xl border border-slate-100 flex gap-3 hover:shadow-xl hover:border-blue-100 transition-all duration-200 active:scale-95"
                      >
                        <div className="relative shrink-0">
                          <Image
                            src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                            alt={doc.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50 group-hover:ring-blue-50 transition-all duration-200"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 truncate text-sm sm:text-base">{doc.name}</h3>
                          <p className="text-xs font-semibold text-blue-500 mt-0.5">{dbT(doc.specialty)}</p>
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <span className="grayscale">📍</span> {doc.city}
                          </p>
                        </div>
                        <div className="self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        </div>
                      </Link>
                    </FadeIn>
                  ))}
                </div>
              </div>
            )}

            {/* Articles Results */}
            {(type === 'all' || type === 'articles') && results.articles?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">{t('search.foundArticles')}: {results.totalArticles}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {results.articles.map((art: any, i: number) => (
                    <FadeIn key={art._id} delay={i * 60} direction="up">
                      <Link
                        href={`/${lang}/blog/${art.slug}`}
                        className="group bg-white p-4 rounded-2xl border border-slate-100 flex gap-3 hover:shadow-xl hover:border-blue-100 transition-all duration-200 active:scale-95"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-50">
                          <Image
                            src={art.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                            alt={dbT(art.title)}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 leading-snug text-sm sm:text-base">{dbT(art.title)}</h3>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                            <span className="text-[11px] font-bold text-slate-700">
                              {art.authorId?.name}
                            </span>
                            <span className="text-[11px] text-blue-500 font-medium">
                              {dbT(art.authorId?.specialty)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block" />
                            <span className="text-[11px] text-slate-400">
                              {new Date(art.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <div className="self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        </div>
                      </Link>
                    </FadeIn>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {results.articles?.length === 0 && results.doctors?.length === 0 && (
              <FadeIn>
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t('search.empty')}</h3>
                  <p className="text-slate-400">{t('search.emptyHint')}</p>
                </div>
              </FadeIn>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
