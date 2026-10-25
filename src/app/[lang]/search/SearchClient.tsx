'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/i18n';
import FadeIn from '@/components/FadeIn';
import { Search, X, BookOpen, User, ArrowRight } from 'lucide-react';
import { type Locale } from '@/i18n';

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

export default function SearchClient({ lang, initialQ }: { lang: Locale, initialQ: string }) {
  const { t } = useT(lang);

  const [q, setQ] = useState(initialQ || '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<{ articles: any[]; doctors: any[]; totalArticles: number; totalDoctors: number }>({ articles: [], doctors: [], totalArticles: 0, totalDoctors: 0 });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbT = (field: any) => field?.[lang] || field?.ru || '';

  return (
    <div className="bg-background min-h-screen text-foreground pb-24 font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-12 md:py-20 isolate border-b border-border">
        {/* Glow */}
        <div
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklab,var(--primary)_5%,transparent),transparent_72%)] dark:bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklab,var(--primary)_11%,transparent),transparent_72%)]"
        />

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <FadeIn>
            <h1 className="text-3xl md:text-5xl font-clinic font-semibold text-foreground mb-8 text-center tracking-tight">
              {t('search.title')}
            </h1>

            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              </div>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-14 pr-12 py-4 md:py-5 bg-card border border-field rounded-2xl text-card-foreground text-lg shadow-sm focus:border-primary transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute inset-y-0 right-5 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
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
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted'
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
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-4 rounded-2xl border border-border shadow-sm animate-pulse flex gap-4">
                <div className="w-16 h-16 bg-muted rounded-xl shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : q.trim() === '' ? (
          /* Popular Categories */
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-foreground mb-6">
                {t('home.categoriesTitle')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${lang}/blog?category=${cat.slug}`}
                    className="flex flex-col items-center gap-3 p-5 md:p-6 bg-card rounded-3xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200">
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
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">{t('search.foundDoctors')}: {results.totalDoctors}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.doctors.map((doc: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FadeIn key={doc._id} delay={i * 60} direction="up">
                      <Link
                        href={`/${lang}/doctor/${doc.slug || doc._id}`}
                        className="group bg-card p-4 md:p-5 rounded-2xl border border-border flex gap-3 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
                      >
                        <div className="relative shrink-0">
                          <Image
                            src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                            alt={doc.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-muted group-hover:ring-primary/20 transition-all duration-200"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate text-sm sm:text-base">{doc.name}</h3>
                          <p className="text-xs font-semibold text-primary mt-0.5">{dbT(doc.specialty)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="grayscale">📍</span> {doc.city}
                          </p>
                        </div>
                        <div className="self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                          <ArrowRight className="w-4 h-4 text-primary" />
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
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">{t('search.foundArticles')}: {results.totalArticles}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {results.articles.map((art: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FadeIn key={art._id} delay={i * 60} direction="up">
                      <Link
                        href={`/${lang}/blog/${art.slug}`}
                        className="group bg-card p-4 md:p-5 rounded-2xl border border-border flex gap-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-muted">
                          <Image
                            src={art.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                            alt={dbT(art.title)}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug text-sm sm:text-base">{dbT(art.title)}</h3>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                            <span className="text-[11px] font-bold text-foreground">
                              {art.authorId?.name}
                            </span>
                            <span className="text-[11px] text-primary font-medium">
                              {dbT(art.authorId?.specialty)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted hidden sm:block" />
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(art.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <div className="self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                          <ArrowRight className="w-4 h-4 text-primary" />
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
                <div className="text-center py-20 bg-card rounded-[2.5rem] border border-border shadow-sm">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{t('search.empty')}</h3>
                  <p className="text-muted-foreground">{t('search.emptyHint')}</p>
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
