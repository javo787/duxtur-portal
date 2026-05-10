import Link from 'next/link';
import {
  HeartPulse, Brain, Smile, Baby,
  Stethoscope, Eye, Scissors, Flower2, ClipboardList,
} from 'lucide-react';

const CATEGORIES = [
  { slug: 'cardiology',    color: 'rose',   Icon: HeartPulse,  labels: { ru: 'Кардиология',    uz: 'Kardiologiya',    tg: 'Кардиология',    kk: 'Кардиология',    ky: 'Кардиология'    }},
  { slug: 'neurology',     color: 'violet', Icon: Brain,       labels: { ru: 'Неврология',     uz: 'Nevrologiya',     tg: 'Неврология',     kk: 'Неврология',     ky: 'Неврология'     }},
  { slug: 'dentistry',     color: 'sky',    Icon: Smile,       labels: { ru: 'Стоматология',   uz: 'Stomatologiya',   tg: 'Стоматология',   kk: 'Стоматология',   ky: 'Стоматология'   }},
  { slug: 'pediatrics',    color: 'amber',  Icon: Baby,        labels: { ru: 'Педиатрия',      uz: 'Pediatriya',      tg: 'Педиатрия',      kk: 'Педиатрия',      ky: 'Педиатрия'      }},
  { slug: 'dermatology',   color: 'teal',   Icon: Stethoscope, labels: { ru: 'Дерматология',   uz: 'Dermatologiya',   tg: 'Дерматология',   kk: 'Дерматология',   ky: 'Дерматология'   }},
  { slug: 'ophthalmology', color: 'blue',   Icon: Eye,         labels: { ru: 'Офтальмология',  uz: 'Oftalmologiya',   tg: 'Офталмология',   kk: 'Офтальмология',  ky: 'Офтальмология'  }},
  { slug: 'surgery',       color: 'orange', Icon: Scissors,    labels: { ru: 'Хирургия',       uz: 'Jarrohlik',       tg: 'Ҷарроҳӣ',        kk: 'Хирургия',       ky: 'Хирургия'       }},
  { slug: 'gynecology',    color: 'pink',   Icon: Flower2,     labels: { ru: 'Гинекология',    uz: 'Ginekologiya',    tg: 'Гинекология',    kk: 'Гинекология',    ky: 'Гинекология'    }},
  { slug: 'general',       color: 'slate',  Icon: ClipboardList, labels: { ru: 'Общая медицина', uz: 'Umumiy tibbiyot', tg: 'Тибби умумӣ',   kk: 'Жалпы медицина', ky: 'Жалпы медицина' }},
] as const;

const GRADIENT: Record<string, string> = {
  rose:   'from-rose-400 to-rose-600',
  violet: 'from-violet-400 to-violet-600',
  sky:    'from-sky-400 to-sky-600',
  amber:  'from-amber-400 to-amber-600',
  teal:   'from-teal-400 to-teal-600',
  blue:   'from-blue-400 to-blue-600',
  orange: 'from-orange-400 to-orange-600',
  pink:   'from-pink-400 to-pink-600',
  slate:  'from-slate-400 to-slate-600',
};

const BADGE: Record<string, string> = {
  rose:   'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  sky:    'bg-sky-50 text-sky-700 border-sky-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  teal:   'bg-teal-50 text-teal-700 border-teal-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  pink:   'bg-pink-50 text-pink-700 border-pink-200',
  slate:  'bg-slate-50 text-slate-700 border-slate-200',
};

const ARTICLE_LABEL: Record<string, string> = {
  ru: 'статей', uz: 'maqola', tg: 'мақола', kk: 'мақала', ky: 'макала',
};

const ALL_LABEL: Record<string, string> = {
  ru: 'Все статьи', uz: 'Barcha maqolalar', tg: 'Ҳама мақолаҳо', kk: 'Барлық мақалалар', ky: 'Бардык макалалар',
};

interface Props {
  lang: string;
  dict: any;
  categoryCounts: Record<string, number>;
}

export default function HomeCategories({ lang, dict, categoryCounts }: Props) {
  const articleWord = ARTICLE_LABEL[lang] || ARTICLE_LABEL.ru;

  return (
    <section className="relative py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок секции */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 block mb-2">
              Разделы медицины
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {dict.cat_title ?? 'Специализации'}
            </h2>
          </div>
          <Link
            href={`/${lang}/blog`}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 border-b border-blue-200 hover:border-blue-600 transition-colors pb-0.5 group"
          >
            {ALL_LABEL[lang] || ALL_LABEL.ru}
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </Link>
        </div>

        {/* Сетка */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(({ slug, color, Icon, labels }) => {
            const label = labels[lang as keyof typeof labels] || labels.ru;
            const count = categoryCounts[slug] ?? 0;

            return (
              <Link
                key={slug}
                href={`/${lang}/blog?category=${slug}`}
                className="group flex flex-col items-center gap-4 p-5 rounded-2xl
                           bg-white border border-slate-100
                           shadow-[0_1px_4px_rgba(0,0,0,0.04)]
                           hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)]
                           hover:-translate-y-1 transition-all duration-300"
              >
                {/* Иконка */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENT[color]}
                                flex items-center justify-center
                                transition-transform duration-300
                                group-hover:scale-105 group-hover:rotate-2`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>

                {/* Название */}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 text-center leading-tight group-hover:text-slate-900 transition-colors">
                  {label}
                </p>

                {/* Счётчик */}
                {count > 0 ? (
                  <span className={`text-[11px] font-semibold px-3 py-0.5 rounded-full border ${BADGE[color]}`}>
                    {count} {articleWord}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300">—</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Мобильная кнопка */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            {ALL_LABEL[lang] || ALL_LABEL.ru}
          </Link>
        </div>
      </div>
    </section>
  );
}
