import Link from 'next/link';

// ── Иконки категорий (inline SVG, без внешних зависимостей) ──────────────────
const ICONS: Record<string, React.ReactNode> = {
  cardiology: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M19.5 12.572 12 20 4.5 12.572a5.25 5.25 0 1 1 7.5-7.24 5.25 5.25 0 1 1 7.5 7.24" />
    </svg>
  ),
  neurology: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M9.5 3a6.5 6.5 0 0 1 5.5 9.93M9.5 3C6.46 3 4 5.46 4 8.5c0 2.47 1.64 4.57 3.9 5.25M9.5 3c1.04 0 2 .25 2.86.68M15 12.93A6.5 6.5 0 1 1 8.5 21H8" />
      <path d="M12 12h.01M8 16h.01M16 8h.01" />
    </svg>
  ),
  dentistry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 5.5C10.5 3.5 7 3 5.5 5.5c-1 1.7-.5 4 .5 5.5 1 1.7 1 3.5 1.5 6 .3 1.5 1 2 2 2s1.5-1 2-3c.5 2 1 3 2 3s1.7-.5 2-2c.5-2.5.5-4.3 1.5-6 1-1.5 1.5-3.8.5-5.5C16 3 12.5 3.5 12 5.5Z" />
    </svg>
  ),
  pediatrics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="7" r="4" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M9 10.5s1 1.5 3 1.5 3-1.5 3-1.5" />
    </svg>
  ),
  dermatology: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 3c4.97 0 9 3.58 9 8 0 3-2 5.5-5 6.8V21H8v-3.2C5 16.5 3 14 3 11c0-4.42 4.03-8 9-8Z" />
      <path d="M9 14h.01M12 14h.01M15 14h.01" />
    </svg>
  ),
  general: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M19 8H5M9 3v5M15 3v5M8 12h2M14 12h2M8 16h2M14 16h2" />
      <rect x="3" y="8" width="18" height="13" rx="2" />
    </svg>
  ),
};

// ── Цветовые схемы для каждой категории ──────────────────────────────────────
const PALETTE: Record<string, { bg: string; iconBg: string; icon: string; badge: string; badgeText: string; hover: string }> = {
  cardiology:   { bg: 'bg-rose-50',    iconBg: 'bg-rose-100',   icon: 'text-rose-600',   badge: 'bg-rose-100',   badgeText: 'text-rose-700',   hover: 'hover:border-rose-200 hover:bg-rose-50/80'   },
  neurology:    { bg: 'bg-violet-50',  iconBg: 'bg-violet-100', icon: 'text-violet-600', badge: 'bg-violet-100', badgeText: 'text-violet-700', hover: 'hover:border-violet-200 hover:bg-violet-50/80' },
  dentistry:    { bg: 'bg-sky-50',     iconBg: 'bg-sky-100',    icon: 'text-sky-600',    badge: 'bg-sky-100',    badgeText: 'text-sky-700',    hover: 'hover:border-sky-200 hover:bg-sky-50/80'     },
  pediatrics:   { bg: 'bg-amber-50',   iconBg: 'bg-amber-100',  icon: 'text-amber-600',  badge: 'bg-amber-100',  badgeText: 'text-amber-700',  hover: 'hover:border-amber-200 hover:bg-amber-50/80'  },
  dermatology:  { bg: 'bg-teal-50',    iconBg: 'bg-teal-100',   icon: 'text-teal-600',   badge: 'bg-teal-100',   badgeText: 'text-teal-700',   hover: 'hover:border-teal-200 hover:bg-teal-50/80'   },
  general:      { bg: 'bg-slate-50',   iconBg: 'bg-slate-100',  icon: 'text-slate-600',  badge: 'bg-slate-100',  badgeText: 'text-slate-700',  hover: 'hover:border-slate-200 hover:bg-slate-50/80'  },
};

// ── Переводы названий категорий ───────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  cardiology:   { ru: 'Кардиология',  uz: 'Kardiologiya',  tg: 'Кардиология',  kk: 'Кардиология',  ky: 'Кардиология'  },
  neurology:    { ru: 'Неврология',   uz: 'Nevrologiya',   tg: 'Неврология',   kk: 'Неврология',   ky: 'Неврология'   },
  dentistry:    { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' },
  pediatrics:   { ru: 'Педиатрия',    uz: 'Pediatriya',    tg: 'Педиатрия',    kk: 'Педиатрия',    ky: 'Педиатрия'    },
  dermatology:  { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' },
  general:      { ru: 'Общая медицина', uz: 'Umumiy tibbiyot', tg: 'Тибби умумӣ', kk: 'Жалпы медицина', ky: 'Жалпы медицина' },
};

// ── Подписи счётчика статей ───────────────────────────────────────────────────
const ARTICLE_LABEL: Record<string, string> = {
  ru: 'статей', uz: 'maqola', tg: 'мақола', kk: 'мақала', ky: 'макала',
};
const SECTION_LABEL: Record<string, string> = {
  ru: 'Разделы', uz: 'Bo\'limlar', tg: 'Бахшҳо', kk: 'Бөлімдер', ky: 'Бөлүмдөр',
};
const ALL_LABEL: Record<string, string> = {
  ru: 'Все статьи →', uz: 'Barcha maqolalar →', tg: 'Ҳама мақолаҳо →', kk: 'Барлық мақалалар →', ky: 'Бардык макалалар →',
};

// ── Типы ──────────────────────────────────────────────────────────────────────
interface Props {
  lang: string;
  dict: any;
  categoryCounts: Record<string, number>;
}

export default function HomeCategories({ lang, dict, categoryCounts }: Props) {
  const categories = Object.keys(CATEGORY_LABELS);
  const articleWord = ARTICLE_LABEL[lang] || ARTICLE_LABEL.ru;

  return (
    <section className="py-14 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-5">

        {/* Заголовок секции */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              {SECTION_LABEL[lang] || SECTION_LABEL.ru}
            </p>
            <h2
              className="font-display font-bold text-slate-900 leading-none tracking-tight"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}
            >
              {dict.cat_title || 'Специализации'}
            </h2>
          </div>
          <Link
            href={`/${lang}/blog`}
            className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium text-blue-600 border-b border-blue-200 hover:border-blue-600 transition-colors pb-0.5 shrink-0"
          >
            {ALL_LABEL[lang] || ALL_LABEL.ru}
          </Link>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((slug) => {
            const label = CATEGORY_LABELS[slug]?.[lang] || CATEGORY_LABELS[slug]?.ru || slug;
            const count = categoryCounts[slug] ?? 0;
            const p = PALETTE[slug] || PALETTE.general;

            return (
              <Link
                key={slug}
                href={`/${lang}/blog?category=${slug}`}
                className={`group relative flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${p.hover}`}
              >
                {/* Иконка */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${p.iconBg} ${p.icon} transition-transform duration-200 group-hover:scale-110`}>
                  {ICONS[slug]}
                </div>

                {/* Название */}
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800 group-hover:text-slate-900 leading-snug transition-colors">
                    {label}
                  </p>
                </div>

                {/* Счётчик статей */}
                {count > 0 ? (
                  <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.badge} ${p.badgeText}`}>
                    {count} {articleWord}
                  </span>
                ) : (
                  <span className="self-start text-[11px] font-medium text-slate-300">
                    —
                  </span>
                )}

                {/* Стрелка при ховере */}
                <svg
                  className="absolute top-3.5 right-3.5 w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            );
          })}
        </div>

        {/* Мобильная кнопка «Все статьи» */}
        <div className="mt-6 sm:hidden text-center">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            {ALL_LABEL[lang] || ALL_LABEL.ru}
          </Link>
        </div>
      </div>
    </section>
  );
}
