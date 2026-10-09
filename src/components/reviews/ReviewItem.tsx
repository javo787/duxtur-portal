import { Star } from 'lucide-react';
import type { PublicReview } from '@/lib/reviews';

const DATE_LOCALES: Record<string, string> = {
  ru: 'ru-RU',
  uz: 'uz-Latn-UZ',
  tg: 'tg-TJ',
  kk: 'kk-KZ',
  ky: 'ky-KG',
};

export function Stars({ value, label, className = 'size-4' }: { value: number; label: string; className?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={label}>
      {[0, 1, 2, 3, 4].map(i => (
        <Star key={i} className={`${className} ${i < Math.round(value) ? 'fill-amber-500 text-amber-500' : 'text-foreground/25'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

/**
 * One review as a visitor sees it. The author line is the name the author chose to show (their own or the masked one);
 * an old review with no name says "Анонимный пациент" or "Пациент"; never anything more.
 */
export default function ReviewItem({
  review,
  lang,
  labels,
}: {
  review: PublicReview;
  lang: string;
  labels: { stars: string; anonymous: string; patient: string; doctor: string };
}) {
  const author = review.author || (review.anonymous ? labels.anonymous : labels.patient);
  return (
    <li className="py-5">
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} label={labels.stars} />
        {review.createdAt && (
          <time dateTime={review.createdAt} className="text-sm text-foreground/60">
            {new Date(review.createdAt).toLocaleDateString(DATE_LOCALES[lang] ?? 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </time>
        )}
      </div>
      <p className="mt-2 max-w-[62ch] whitespace-pre-line break-words leading-7">{review.text}</p>
      <p className="mt-2 text-sm text-foreground/65">
        {author}
        {review.doctorName && `, ${labels.doctor}: ${review.doctorName}`}
      </p>
    </li>
  );
}
