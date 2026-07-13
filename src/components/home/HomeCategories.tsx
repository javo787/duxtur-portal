'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useT } from '@/i18n';
import {
  HeartPulse,
  Brain,
  Baby,
  Eye,
  Scissors,
  Flower2,
  ClipboardList,
} from 'lucide-react';

// Твои кастомные SVG-иконки
function DentalIcon({ className }: { className?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.9591 9.2814C16.6218 6.84016 12.7792 7.98807 9.58534 11.8657C6.50278 15.6083 8.60445 22.3544 10.1153 27.2039C10.4755 28.3602 10.8022 29.4087 11.0169 30.2829C12.1324 34.8237 13.1996 37.6532 15.6331 39.701C16.8383 40.715 18.2048 38.9724 19.6465 37.1338C20.8965 35.5398 22.203 33.8737 23.5098 33.8697C24.7954 33.8658 26.0812 35.5293 27.3138 37.1239C28.7366 38.9646 30.0886 40.7135 31.2874 39.701C33.1461 38.1311 33.9903 36.9793 35.0116 33.745C38.4562 32.8529 41 29.7235 41 26C41 24.1711 40.3863 22.4856 39.3536 21.138C40.3596 17.7171 40.4801 14.2345 37.5808 10.8727C33.4414 6.07315 27.704 8.55223 25.0332 10.1396L28.6508 13.2408C29.0701 13.6002 29.1187 14.2315 28.7592 14.6508C28.3998 15.0701 27.7685 15.1187 27.3492 14.7592L20.9591 9.2814ZM39 26C39 29.3137 36.3137 32 33 32C29.6863 32 27 29.3137 27 26C27 22.6863 29.6863 20 33 20C36.3137 20 39 22.6863 39 26ZM32 23C32 22.4477 32.4477 22 33 22C33.5523 22 34 22.4477 34 23V25H36C36.5523 25 37 25.4477 37 26C37 26.5523 36.5523 27 36 27H34V29C34 29.5523 33.5523 30 33 30C32.4477 30 32 29.5523 32 29V27H30C29.4477 27 29 26.5523 29 26C29 25.4477 29.4477 25 30 25H32V23Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DermaIcon({ className }: { className?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M35.0843 38.1833C39.2942 34.8886 42 29.7603 42 24C42 16.1432 36.9663 9.46218 29.9479 7.00593L30.6088 5.1177C38.407 7.84687 44 15.2703 44 24C44 30.413 40.9816 36.1211 36.288 39.781L35.0843 38.1833Z"
        fill="currentColor"
      />
      <path
        d="M28.466 41.4417C27.0379 41.8062 25.5416 42 24 42C22.4922 42 21.0278 41.8146 19.6282 41.4654L19.1526 43.4086C20.7046 43.7949 22.3284 44 24 44C25.7055 44 27.3611 43.7865 28.9416 43.3849L28.466 41.4417Z"
        fill="currentColor"
      />
      <path
        d="M6 24C6 29.789 8.7328 34.9397 12.9787 38.2324L11.7751 39.83C7.04544 36.1722 4 30.4417 4 24C4 15.2703 9.59303 7.84687 17.3912 5.1177L18.0521 7.00593C11.0337 9.46218 6 16.1432 6 24Z"
        fill="currentColor"
      />
      <path
        d="M28.5 8.50001C28.5 10.9853 26.4853 13 24 13C21.5147 13 19.5 10.9853 19.5 8.50001C19.5 6.01779 21.5098 4.00497 23.9908 4.00002H24.0092C26.4902 4.00497 28.5 6.01779 28.5 8.50001Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 22C16.7286 22 17.4117 21.8052 18 21.4649V25.9851L17.9999 26V29C17.9999 28.9981 17.9999 28.997 17.9998 28.9967C17.9997 28.9965 17.9996 28.997 17.9993 28.9984L17.9977 29.0092C17.991 29.055 17.9657 29.2287 17.8732 29.5781C17.7678 29.9761 17.6095 30.4791 17.4068 31.0645C17.3711 31.1679 17.3341 31.2731 17.2962 31.38C15.9392 32.0198 15 33.4002 15 35C15 35.5221 15.1 36.0208 15.2819 36.478C14.9465 37.2745 14.6309 38.0072 14.3694 38.6077C14.1605 39.0873 13.9866 39.4816 13.8652 39.7553C13.8044 39.8922 13.7569 39.9989 13.7246 40.071L13.6761 40.1793C13.2535 41.1184 13.6131 42.2248 14.5069 42.7361C15.4008 43.2474 16.5368 42.9964 17.132 42.156L19.3801 38.9822C21.411 38.7907 23 37.0809 23 35C23 34.6679 22.9595 34.3452 22.8832 34.0366L24 32.4601L30.868 42.156C31.4632 42.9963 32.5992 43.2474 33.493 42.7361C34.3869 42.2248 34.7464 41.1184 34.3239 40.1793L34.2753 40.071C34.2431 39.9989 34.1955 39.8922 34.1348 39.7553C34.0133 39.4816 33.8394 39.0873 33.6305 38.6077C33.2124 37.6475 32.6561 36.3495 32.1011 34.9927C31.5441 33.6312 30.9974 32.2325 30.5931 31.0645C30.3905 30.4791 30.2321 29.9761 30.1268 29.5781C30.0343 29.2287 30.009 29.055 30.0023 29.0092C30.0016 29.0044 30.0011 29.0009 30.0007 28.9989C30.0002 28.9955 30 28.996 30 29L30 26.4649C31.1956 25.7733 32 24.4806 32 23C32 21.8053 31.4762 20.733 30.6458 20H36C37.1046 20 38 19.1046 38 18C38 16.8954 37.1046 16 36 16H19.4649C18.7733 14.8044 17.4806 14 16 14C14.5194 14 13.2267 14.8044 12.5351 16H12C10.8954 16 10 16.8954 10 18C10 19.1046 10.8954 20 12 20H12.5351C13.2267 21.1956 14.5194 22 16 22ZM18 18C18 19.1046 17.1046 20 16 20C14.8954 20 14 19.1046 14 18C14 16.8954 14.8954 16 16 16C17.1046 16 18 16.8954 18 18ZM30 23C30 24.1046 29.1046 25 28 25C26.8954 25 26 24.1046 26 23C26 21.8954 26.8954 21 28 21C29.1046 21 30 21.8954 30 23ZM21 35C21 36.1046 20.1046 37 19 37C17.8954 37 17 36.1046 17 35C17 33.8954 17.8954 33 19 33C20.1046 33 21 33.8954 21 35Z"
        fill="currentColor"
      />
    </svg>
  );
}

const CATEGORIES = [
  { slug: 'cardiology', color: 'rose', Icon: HeartPulse, labels: { ru: 'Кардиология', uz: 'Kardiologiya', tg: 'Кардиология', kk: 'Кардиология', ky: 'Кардиология' } },
  { slug: 'neurology', color: 'violet', Icon: Brain, labels: { ru: 'Неврология', uz: 'Nevrologiya', tg: 'Неврология', kk: 'Неврология', ky: 'Неврология' } },
  { slug: 'dentistry', color: 'sky', Icon: DentalIcon, labels: { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' } },
  { slug: 'pediatrics', color: 'amber', Icon: Baby, labels: { ru: 'Педиатрия', uz: 'Pediatriya', tg: 'Педиатрия', kk: 'Педиатрия', ky: 'Педиатрия' } },
  { slug: 'dermatology', color: 'teal', Icon: DermaIcon, labels: { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' } },
  { slug: 'ophthalmology', color: 'blue', Icon: Eye, labels: { ru: 'Офтальмология', uz: 'Oftalmologiya', tg: 'Офталмология', kk: 'Офтальмология', ky: 'Офтальмология' } },
  { slug: 'surgery', color: 'orange', Icon: Scissors, labels: { ru: 'Хирургия', uz: 'Jarrohlik', tg: 'Ҷарроҳӣ', kk: 'Хирургия', ky: 'Хирургия' } },
  { slug: 'gynecology', color: 'pink', Icon: Flower2, labels: { ru: 'Гинекология', uz: 'Ginekologiya', tg: 'Гинекология', kk: 'Гинекология', ky: 'Гинекология' } },
  { slug: 'general', color: 'slate', Icon: ClipboardList, labels: { ru: 'Общая медицина', uz: 'Umumiy tibbiyot', tg: 'Тибби умумӣ', kk: 'Жалпы медицина', ky: 'Жалпы медицина' } },
] as const;

const ACCENT_COLORS: Record<string, string> = {
  rose: 'text-rose-700 bg-rose-50 border-rose-200',
  violet: 'text-violet-700 bg-violet-50 border-violet-200',
  sky: 'text-sky-700 bg-sky-50 border-sky-200',
  amber: 'text-amber-700 bg-amber-50 border-amber-200',
  teal: 'text-teal-700 bg-teal-50 border-teal-200',
  blue: 'text-blue-700 bg-blue-50 border-blue-200',
  orange: 'text-orange-700 bg-orange-50 border-orange-200',
  pink: 'text-pink-700 bg-pink-50 border-pink-200',
  slate: 'text-slate-700 bg-slate-50 border-slate-200',
};

interface Props {
  lang: string;
  dict: any;
  categoryCounts: Record<string, number>;
}

export default function HomeCategories({ lang, dict, categoryCounts }: Props) {
  const { t } = useT(lang);
  const articleWord = t('common.articles');

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header with decorative line */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-blue-600 font-semibold text-sm mb-2">
              {t('home.categoriesTitle')}
            </p>
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
              {dict.cat_title ?? t('home.categoriesTitle')}
            </h2>
            <div className="section-accent-line" />
          </div>
          <Link
            href={`/${lang}/blog`}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors pb-0.5 group"
          >
            {t('home.categoriesAllArticles')}
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map(({ slug, color, Icon, labels }, index) => {
            const label = labels[lang as keyof typeof labels] || labels.ru;
            const count = categoryCounts[slug] ?? 0;

            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <Link
                  href={`/${lang}/blog?category=${slug}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl 
                             category-card-gradient
                             border border-slate-100/80 
                             card-hover-lift"
                >
                  <div className="category-icon-wrap mb-1">
                    <Icon className="w-7 h-7 text-slate-600 group-hover:text-blue-600 transition-colors duration-300" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-700 text-center leading-tight 
                                group-hover:text-slate-900 transition-colors">
                    {label}
                  </p>
                  {count > 0 ? (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ACCENT_COLORS[color]}`}>
                      {count} {articleWord}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-300 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full">—</span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white 
                       border border-slate-200 text-sm font-medium text-slate-700 
                       hover:bg-slate-50 transition-all shadow-sm"
          >
            {t('home.categoriesAllArticles')}
          </Link>
        </div>
      </div>
    </section>
  );
}
