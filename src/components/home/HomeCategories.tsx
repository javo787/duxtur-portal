import Link from 'next/link';
import {
  HeartPulse,
  Brain,
  Tooth,
  Baby,
  Stethoscope,
  Eye,
  Scissors,
  Flower2,
  ClipboardList,
} from 'lucide-react';

const CATEGORIES = [
  { slug: 'cardiology', labelKey: 'cardiology', color: 'rose', Icon: HeartPulse },
  { slug: 'neurology', labelKey: 'neurology', color: 'violet', Icon: Brain },
  { slug: 'dentistry', labelKey: 'dentistry', color: 'sky', Icon: Tooth },
  { slug: 'pediatrics', labelKey: 'pediatrics', color: 'amber', Icon: Baby },
  { slug: 'dermatology', labelKey: 'dermatology', color: 'teal', Icon: Stethoscope },
  { slug: 'ophthalmology', labelKey: 'ophthalmology', color: 'blue', Icon: Eye },
  { slug: 'surgery', labelKey: 'surgery', color: 'orange', Icon: Scissors },
  { slug: 'gynecology', labelKey: 'gynecology', color: 'pink', Icon: Flower2 },
  { slug: 'general', labelKey: 'general', color: 'slate', Icon: ClipboardList },
] as const;

const GRADIENT_MAP: Record<string, string> = {
  rose: 'from-rose-400 to-rose-600',
  violet: 'from-violet-400 to-violet-600',
  sky: 'from-sky-400 to-sky-600',
  amber: 'from-amber-400 to-amber-600',
  teal: 'from-teal-400 to-teal-600',
  blue: 'from-blue-400 to-blue-600',
  orange: 'from-orange-400 to-orange-600',
  pink: 'from-pink-400 to-pink-600',
  slate: 'from-slate-400 to-slate-600',
};

const BADGE_MAP: Record<string, string> = {
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
};

interface Dictionary {
  cat_title?: string;
  all_articles?: string;
  articles?: string;
}

interface Props {
  lang: string;
  dict: Dictionary;
  categoryCounts: Record<string, number>;
}

export default function HomeCategories({ lang, dict, categoryCounts }: Props) {
  const articleWord = dict.articles ?? 'статей';

  return (
    <section className="relative py-20 bg-slate-50/80 backdrop-blur-sm">
      {/* Декоративный фоновый градиент */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 block mb-2">
              Разделы медицины
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
              {dict.cat_title ?? 'Специализации'}
            </h2>
          </div>
          <Link
            href={`/${lang}/blog`}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-sm font-medium text-blue-600 border-b border-blue-200 hover:border-blue-600 transition-colors pb-0.5 group"
          >
            {dict.all_articles ?? 'Все статьи'}
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Сетка категорий */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(({ slug, labelKey, color, Icon }) => {
            const count = categoryCounts[slug] ?? 0;
            const gradient = GRADIENT_MAP[color];
            const badge = BADGE_MAP[color];

            return (
              <Link
                key={slug}
                href={`/${lang}/blog?category=${slug}`}
                className="group relative flex flex-col items-center gap-4 p-5 rounded-2xl 
                           bg-white/80 backdrop-blur-xl border border-white/50 
                           shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)]
                           hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                           hover:-translate-y-1 transition-all duration-300 ease-out
                           hover:bg-white/90"
              >
                {/* Иконка — стеклянный квадрат с градиентной иконкой */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} 
                              p-3 flex items-center justify-center
                              shadow-md shadow-${color}-200/50
                              transition-transform duration-300 ease-out
                              group-hover:scale-105 group-hover:rotate-2`}
                >
                  <Icon className="w-full h-full text-white" strokeWidth={2.5} />
                </div>

                {/* Название категории */}
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 text-center leading-tight group-hover:text-slate-900 transition-colors">
                  {dict[labelKey as keyof Dictionary] ?? labelKey}
                </p>

                {/* Счётчик статей */}
                {count > 0 ? (
                  <span
                    className={`text-[11px] font-semibold px-3 py-0.5 rounded-full border ${badge}`}
                  >
                    {count} {articleWord}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300 font-medium">—</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Мобильная ссылка "Все статьи" (дублируем внизу) */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            {dict.all_articles ?? 'Все статьи'}
          </Link>
        </div>
      </div>
    </section>
  );
}
