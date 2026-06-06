'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  _id: string;
  slug: string;
  title: { ru?: string; uz?: string; tg?: string; kk?: string; ky?: string };
  image?: string;
  category?: string;
  isVerified: boolean;
  views?: number;
  createdAt: string;
}

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

interface MyArticlesTabProps {
  lang: string;
  onEdit: (slug: string) => void;
}

export function MyArticlesTab({ lang, onEdit }: MyArticlesTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'pending'>('all');

  const fetchArticles = async () => {
    setIsLoading(true);
    const res = await fetch('/api/doctor/articles');
    const data = await res.json();
    setArticles(Array.isArray(data) ? data : []);
    setIsLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const getTitle = (article: Article) =>
    article.title?.ru || article.title?.uz || article.title?.tg ||
    article.title?.kk || article.title?.ky || 'Без заголовка';

  const published = articles.filter((a) => a.isVerified);
  const pending = articles.filter((a) => !a.isVerified);

  const filtered = filter === 'published' ? published
    : filter === 'pending' ? pending
    : articles;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Spinner />
        <p className="text-sm font-medium">Загрузка статей...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-20">

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Всего статей', value: articles.length, icon: '📄', color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Опубликовано', value: published.length, icon: '✅', color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'На модерации', value: pending.length, icon: '⏳', color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl border border-gray-100 p-4 text-center`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* FILTER TABS */}
      {articles.length > 0 && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { id: 'all', label: 'Все' },
            { id: 'published', label: '✅ Опубликовано' },
            { id: 'pending', label: '⏳ На модерации' },
          ] as const).map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                filter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {articles.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">Ещё нет статей</h3>
          <p className="text-gray-500 text-sm mb-6">Напишите первую статью — AI поможет оформить</p>
        </div>
      )}

      {/* ARTICLES LIST */}
      <div className="space-y-3">
        {filtered.map((article) => (
          <div key={article._id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex gap-0">

            {/* Image */}
            <div className="w-28 md:w-36 shrink-0 bg-gray-100 relative">
              {article.image ? (
                <img src={article.image} alt={getTitle(article)}
                  className="w-full h-full object-cover" style={{ minHeight: '100px' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl"
                  style={{ minHeight: '100px' }}>📄</div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
              <div>
                {/* Status badge */}
                <div className="flex items-center gap-2 mb-2">
                  {article.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      ✅ Опубликовано
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      ⏳ На модерации
                    </span>
                  )}
                  {article.category && (
                    <span className="text-xs text-gray-400 font-medium">{article.category}</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                  {getTitle(article)}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{formatDate(article.createdAt)}</span>
                  {article.views !== undefined && article.views > 0 && (
                    <span>👁 {article.views.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => onEdit(article.slug)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition border border-blue-200"
                >
                  ✏️ Редактировать
                </button>
                {article.isVerified && (
                  <Link
                    href={`/${lang}/blog/${article.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition border border-gray-200"
                  >
                    🌐 Открыть
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PENDING INFO */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-xl shrink-0">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-amber-900">Статьи на модерации</p>
            <p className="text-xs text-amber-700 mt-1">
              Проверка занимает до 24 часов. После одобрения статья станет видна на сайте.
              При редактировании опубликованной статьи она снова уходит на модерацию.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
