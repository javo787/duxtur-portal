'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SearchPage({ params, searchParams: searchParamsPromise }: { params: Promise<{ lang: string }>, searchParams: Promise<{ q?: string }> }) {
  const { lang } = use(params);
  const { q: initialQ } = use(searchParamsPromise);
  const [q, setQ] = useState(initialQ || '');
  const [results, setResults] = useState<any>({ articles: [], doctors: [] });
  const [type, setType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (q) {
      handleSearch();
    }
  }, [type, q]);

  async function handleSearch() {
    setIsLoading(true);
    const res = await fetch(`/api/search?q=${q}&type=${type}&lang=${lang}`);
    const data = await res.json();
    setResults(data);
    setIsLoading(false);
  }

  const t = (field: any) => field?.[lang] || field?.ru || '';

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-xl font-extrabold text-blue-600">
            duxtur<span className="text-gray-300 font-light">.org</span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
            ← Главная
          </Link>
        </div>
      </header>

      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по статьям и врачам..."
                className="w-full pl-6 pr-4 py-3.5 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
             {['all', 'articles', 'doctors'].map(t => (
               <button
                 key={t}
                 onClick={() => setType(t)}
                 className={`px-4 py-2 rounded-full text-xs font-bold transition ${type === t ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20'}`}
               >
                 {t === 'all' ? 'Все' : t === 'articles' ? 'Статьи' : 'Врачи'}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-slate-400">Поиск...</div>
        ) : (
          <div className="space-y-10">
            {results.doctors?.length > 0 && (
              <div>
                <h2 className="text-xl font-black mb-4">Найдено врачей: {results.totalDoctors}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {results.doctors.map((doc: any) => (
                     <Link key={doc._id} href={`/${lang}/doctor/${doc.slug || doc._id}`} className="bg-white p-4 rounded-2xl border flex gap-4 hover:shadow-md transition">
                        <Image src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt={doc.name} width={50} height={50} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                           <p className="font-bold text-sm">{doc.name}</p>
                           <p className="text-xs text-blue-500">{t(doc.specialty)}</p>
                           <p className="text-[10px] text-slate-400 mt-1">📍 {doc.city}</p>
                        </div>
                     </Link>
                   ))}
                </div>
              </div>
            )}

            {results.articles?.length > 0 && (
              <div>
                <h2 className="text-xl font-black mb-4">Найдено статей: {results.totalArticles}</h2>
                <div className="space-y-4">
                   {results.articles.map((art: any) => (
                     <Link key={art._id} href={`/${lang}/blog/${art.slug}`} className="bg-white p-4 rounded-2xl border flex gap-4 hover:shadow-md transition">
                        <div className="w-24 h-16 relative rounded-lg overflow-hidden shrink-0">
                           <Image src={art.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'} alt={t(art.title)} fill className="object-cover" />
                        </div>
                        <div>
                           <p className="font-bold text-sm line-clamp-2">{t(art.title)}</p>
                           <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t(art.overview)}</p>
                        </div>
                     </Link>
                   ))}
                </div>
              </div>
            )}

            {q && results.articles?.length === 0 && results.doctors?.length === 0 && (
              <div className="text-center py-20 text-slate-400">Ничего не найдено</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
