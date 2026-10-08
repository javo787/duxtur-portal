import { getT } from '@/i18n';
import type { PublicReview } from '@/lib/reviews';
import ReviewDialog from './ReviewDialog';
import ReviewList from './ReviewList';
import { Stars } from './ReviewItem';

/**
 * Readers' reviews under an article. The stars are the old votes plus the approved reviews (review-service.ts); writing
 * a review needs an account, which the dialog takes care of.
 */
export default function ArticleReviews({
  articleId,
  title,
  rating,
  reviews,
  lang,
}: {
  articleId: string;
  title: string;
  rating: { avg: number; count: number };
  reviews: PublicReview[];
  lang: string;
}) {
  const t = getT(lang);
  return (
    <section id="reviews" className="mt-12 border-t border-border pt-8" aria-labelledby="article-reviews-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="article-reviews-title" className="font-clinic text-xl font-semibold">
            {t('reviews.articleTitle')}
          </h2>
          {rating.count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground/70">
              <Stars value={rating.avg} label={`${rating.avg} / 5`} className="size-4" />
              <span className="tabular-nums">
                {rating.avg} ({rating.count})
              </span>
            </p>
          )}
        </div>
        <ReviewDialog subject={{ kind: 'article', id: articleId }} name={title} lang={lang} />
      </div>

      <div className="mt-4">
        <ReviewList initialReviews={reviews} loadUrl={`/api/reviews?articleId=${articleId}`} lang={lang} />
      </div>
    </section>
  );
}
