'use client';

import { useT } from '@/i18n';

interface ClinicRatingProps {
  avg: number;
  count: number;
  lang: string;
  variant?: 'large' | 'compact';
}

export default function ClinicRating({ avg, count, lang, variant = 'large' }: ClinicRatingProps) {
  const { t } = useT(lang);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex text-amber-400 text-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>{i < Math.round(avg) ? '★' : '☆'}</span>
          ))}
        </div>
        <span className="text-sm font-bold text-slate-900">{avg}</span>
        <span className="text-xs text-slate-400">({count})</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-10">
      <div className="text-center md:text-left">
        <div className="text-5xl md:text-6xl font-black text-slate-900 mb-2">{avg || '0.0'}</div>
        <div className="flex text-amber-400 text-xl justify-center md:justify-start mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>{i < Math.round(avg) ? '★' : '☆'}</span>
          ))}
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {count} {t('blog.ratings')}
        </p>
      </div>

      <div className="flex-1 w-full space-y-2">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 w-3">{star}</span>
            <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
               {/* Note: We don't have individual star counts in the clinic model yet, so we just show placeholders or empty */}
               <div className="h-full bg-amber-400 rounded-full" style={{ width: star <= Math.round(avg) ? `${(star/5)*100}%` : '0%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
