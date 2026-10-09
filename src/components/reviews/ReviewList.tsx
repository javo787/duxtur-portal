'use client';

import { useState } from 'react';
import { useT } from '@/i18n';
import type { PublicReview } from '@/lib/reviews';
import ReviewItem from './ReviewItem';

/**
 * The approved reviews of a doctor or an article: the first page comes from the server, "show more" asks for the next.
 * `loadUrl` is the address without the page, e.g. /api/reviews?doctorId=...
 */
export default function ReviewList({
  initialReviews,
  loadUrl,
  lang,
  pageSize = 10,
  emptyText,
}: {
  initialReviews: PublicReview[];
  loadUrl: string;
  lang: string;
  pageSize?: number;
  emptyText?: string;
}) {
  const { t } = useT(lang);
  const [reviews, setReviews] = useState(initialReviews);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialReviews.length >= pageSize);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`${loadUrl}&page=${page + 1}&limit=${pageSize}`);
      const next = res.ok ? ((await res.json()) as PublicReview[]) : null;
      if (!next) throw new Error(`status ${res.status}`);
      setReviews(current => [...current, ...next.filter(review => !current.some(seen => seen.id === review.id))]);
      setPage(page + 1);
      if (next.length < pageSize) setHasMore(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  if (reviews.length === 0) {
    return <p className="py-6 text-foreground/70">{emptyText ?? t('doctor.noReviews')}</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-border border-y border-border">
        {reviews.map(review => (
          <ReviewItem
            key={review.id}
            review={review}
            lang={lang}
            labels={{
              stars: t('reviews.ratingStar').replace('{n}', String(review.rating)),
              anonymous: t('common.anonymous'),
              patient: t('common.patient'),
              doctor: t('common.doctorSingle'),
            }}
          />
        ))}
      </ul>
      {failed && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {t('reviews.errorGeneric')}
        </p>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
        >
          {loading ? t('common.loading') : t('doctor.allReviews')}
        </button>
      )}
    </div>
  );
}
