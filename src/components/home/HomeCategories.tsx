import Link from 'next/link';
import { getT } from '@/i18n';
import { blogCategoryHref } from '@/lib/blog-seo';
import SectionHeader from './SectionHeader';

// Topic names per language (the slugs match the category filters of the blog)
const CATEGORIES = [
  { slug: 'cardiology', labels: { ru: 'Кардиология', uz: 'Kardiologiya', tg: 'Кардиология', kk: 'Кардиология', ky: 'Кардиология' } },
  { slug: 'neurology', labels: { ru: 'Неврология', uz: 'Nevrologiya', tg: 'Неврология', kk: 'Неврология', ky: 'Неврология' } },
  { slug: 'dentistry', labels: { ru: 'Стоматология', uz: 'Stomatologiya', tg: 'Стоматология', kk: 'Стоматология', ky: 'Стоматология' } },
  { slug: 'pediatrics', labels: { ru: 'Педиатрия', uz: 'Pediatriya', tg: 'Педиатрия', kk: 'Педиатрия', ky: 'Педиатрия' } },
  { slug: 'dermatology', labels: { ru: 'Дерматология', uz: 'Dermatologiya', tg: 'Дерматология', kk: 'Дерматология', ky: 'Дерматология' } },
  { slug: 'ophthalmology', labels: { ru: 'Офтальмология', uz: 'Oftalmologiya', tg: 'Офталмология', kk: 'Офтальмология', ky: 'Офтальмология' } },
  { slug: 'surgery', labels: { ru: 'Хирургия', uz: 'Jarrohlik', tg: 'Ҷарроҳӣ', kk: 'Хирургия', ky: 'Хирургия' } },
  { slug: 'gynecology', labels: { ru: 'Гинекология', uz: 'Ginekologiya', tg: 'Гинекология', kk: 'Гинекология', ky: 'Гинекология' } },
  { slug: 'general', labels: { ru: 'Общая медицина', uz: 'Umumiy tibbiyot', tg: 'Тибби умумӣ', kk: 'Жалпы медицина', ky: 'Жалпы медицина' } },
] as const;

/** Fewer topics than this would look like a mistake, so the block waits until the blog has some range. */
const MIN_TOPICS = 3;

export default function HomeCategories({ lang, dict, categoryCounts }: { lang: string; dict: Record<string, string>; categoryCounts: Record<string, number> }) {
  const t = getT(lang);

  // Only topics that have articles: a link must never lead to an empty page
  const topics = CATEGORIES.map(c => ({
    slug: c.slug,
    label: c.labels[lang as keyof typeof c.labels] || c.labels.ru,
    count: categoryCounts[c.slug] ?? 0,
  })).filter(c => c.count > 0);

  if (topics.length < MIN_TOPICS) return null;

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeader title={dict.cat_title ?? t('home.categoriesTitle')} href={`/${lang}/blog`} linkLabel={t('nav.allArticles')} />
        <ul className="flex flex-wrap gap-2">
          {topics.map((c, i) => (
            <li key={c.slug} data-reveal="" style={{ '--i': Math.min(i, 5) } as React.CSSProperties}>
              <Link
                href={blogCategoryHref(lang, c.slug)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-[0.9375rem] font-medium transition-[background-color,border-color,transform] duration-200 ease-premium hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-muted active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {c.label}
                <span className="text-sm text-muted-foreground tabular-nums">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
