'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import ReviewDialog from '@/components/reviews/ReviewDialog';
import ReviewItem, { Stars } from '@/components/reviews/ReviewItem';
import type { PublicReview } from '@/lib/reviews';

export default function ClinicReviews({ slug, name, lang, rating }: { slug: string; name: string; lang: string; rating: { avg: number; count: number } }) {
  const { t } = useT(lang);
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/clinic/${encodeURIComponent(slug)}/review`)
      .then(res => res.json())
      .then(data => live && setReviews(Array.isArray(data) ? data : []))
      .catch(() => live && setReviews([]));
    return () => {
      live = false;
    };
  }, [slug]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {rating.count > 0 ? (
          <div className="flex items-center gap-4">
            <span className="font-clinic text-5xl font-semibold tabular-nums">{rating.avg.toFixed(1)}</span>
            <div className="space-y-1">
              <Stars value={rating.avg} label={`${rating.avg.toFixed(1)} / 5`} className="size-5" />
              <p className="text-sm text-foreground/65">
                {rating.count} {t('blog.ratings')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-foreground/70">{t('clinic.noReviewsYet')}</p>
        )}
        <ReviewDialog subject={{ kind: 'clinic', slug }} name={name} lang={lang} />
      </div>

      {reviews === null ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${90 - i * 18}%` }} />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <ul className="divide-y divide-border border-t border-border">
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
      ) : null}
    </div>
  );
}
