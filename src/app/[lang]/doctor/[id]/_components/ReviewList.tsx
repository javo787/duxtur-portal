'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import StarRating from '@/components/StarRating';

interface ReviewListProps {
  initialReviews: any[];
  doctorId: string;
  lang: string;
}

const DATE_LOCALES: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  uz: 'uz-Latn-UZ',
  tg: 'tg-TJ',
  kk: 'kk-KZ',
  ky: 'ky-KG',
};

export default function ReviewList({ initialReviews, doctorId, lang }: ReviewListProps) {
  const { t } = useT(lang);
  const [reviews, setReviews] = useState(initialReviews);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialReviews.length >= 5);
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = DATE_LOCALES[lang] || 'ru-RU';

  const loadMore = async () => {
    setIsLoading(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/reviews?doctorId=${doctorId}&page=${nextPage}&limit=10`);
      const newReviews = await res.json();

      if (newReviews.length < 10) {
        setHasMore(false);
      }

      setReviews([...reviews, ...newReviews]);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
        {t('doctor.noReviews')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r: any) => (
        <div key={r._id.toString()} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                {r.isAnonymous ? '?' : t('common.patient')?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {r.isAnonymous ? t('common.anonymous') : t('common.patient')}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  {new Date(r.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <StarRating rating={r.rating} size="w-3.5 h-3.5" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed italic">
            &quot;{r.text}&quot;
          </p>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isLoading}
          className="w-full py-3 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('doctor.allReviews')}
        </button>
      )}
    </div>
  );
}
