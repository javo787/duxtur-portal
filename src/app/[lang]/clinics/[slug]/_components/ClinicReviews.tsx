'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useT } from '@/i18n';

interface Review {
  _id: string;
  rating: number;
  text: string;
  createdAt: string;
  isAnonymous?: boolean;
  patientName?: string;
  doctorId?: { name?: string };
}

function Stars({ value, className = 'size-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${className} ${i < Math.round(value) ? 'fill-amber-500 text-amber-500' : 'text-foreground/25'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function ClinicReviews({ slug, lang, rating }: { slug: string; lang: string; rating: { avg: number; count: number } }) {
  const { t } = useT(lang);
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/clinic/${slug}/review`)
      .then(res => res.json())
      .then(data => live && setReviews(Array.isArray(data) ? data : []))
      .catch(() => live && setReviews([]));
    return () => {
      live = false;
    };
  }, [slug]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <span className="font-clinic text-5xl font-semibold tabular-nums">{rating.avg.toFixed(1)}</span>
        <div className="space-y-1">
          <Stars value={rating.avg} className="size-5" />
          <p className="text-sm text-foreground/65">
            {rating.count} {t('blog.ratings')}
          </p>
        </div>
      </div>

      {reviews === null ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${90 - i * 18}%` }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-foreground/70">{t('doctor.noReviews')}</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {reviews.map(r => (
            <li key={r._id} className="py-5">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <time dateTime={r.createdAt} className="text-sm text-foreground/60">
                  {new Date(r.createdAt).toLocaleDateString(lang)}
                </time>
              </div>
              <p className="mt-2 max-w-[62ch] leading-7">{r.text}</p>
              <p className="mt-2 text-sm text-foreground/65">
                {r.isAnonymous ? t('common.anonymous') : r.patientName || t('common.patient')}
                {r.doctorId?.name && `, ${t('common.doctorSingle')}: ${r.doctorId.name}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
