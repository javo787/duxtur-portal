import Link from 'next/link';

const CATEGORY_COLORS = [
  'bg-red-50 text-red-600 border-red-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-blue-50 text-blue-600 border-blue-100',
  'bg-yellow-50 text-yellow-600 border-yellow-100',
  'bg-pink-50 text-pink-600 border-pink-100',
  'bg-teal-50 text-teal-600 border-teal-100',
  'bg-orange-50 text-orange-600 border-orange-100',
  'bg-green-50 text-green-600 border-green-100',
];

export default function HomeCategories({ lang, dict }: { lang: string; dict: any }) {
  const categories = [
    { label: dict.cat_cardio, icon: '❤️', slug: 'cardiology' },
    { label: dict.cat_neuro, icon: '🧠', slug: 'neurology' },
    { label: dict.cat_dentist, icon: '🦷', slug: 'dentistry' },
    { label: dict.cat_pediatr, icon: '👶', slug: 'pediatrics' },
    { label: 'Дерматология', icon: '🩺', slug: 'dermatology' },
    { label: 'Офтальмология', icon: '👁️', slug: 'ophthalmology' },
    { label: 'Хирургия', icon: '⚕️', slug: 'surgery' },
    { label: 'Гинекология', icon: '🌸', slug: 'gynecology' },
  ];

  return (
    <section className="py-10 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{dict.cat_title}</h2>
        </div>

        {/* Горизонтальный скролл на мобиле, сетка на десктопе */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-8 md:overflow-visible scrollbar-hide">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/${lang}/blog?category=${cat.slug}`}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 shrink-0 w-24 md:w-auto ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-bold leading-tight text-center whitespace-nowrap md:whitespace-normal">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
