import Link from 'next/link';
import Image from 'next/image';
import { getT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';

export default function HomeAuthors({
  lang,
  authors,
  t: dbT,
}: {
  lang: string;
  authors: any[];
  t: (f: any) => string;
}) {
  const t = getT(lang);

  if (authors.length === 0) return null;

  return (
    <section className="py-20 border-t border-slate-100/80 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-blue-600 font-semibold text-sm mb-2">
              {t('home.authorsSubtitle')}
            </p>
            <h2 className="font-display text-[26px] font-bold text-slate-900 tracking-tight">
              {t('home.authorsTitle')}
            </h2>
            <div className="section-accent-line" />
          </div>
          <Link
            href={`/${lang}/authors`}
            className="hidden md:flex items-center gap-1.5 text-[13.5px] font-medium text-blue-600 hover:text-blue-700 transition-colors pb-0.5 group"
          >
            {t('home.authorsViewAll')}
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {authors.map((doc: any) => (
            <Link
              key={doc._id}
              href={`/${lang}/doctor/${doc.slug || doc._id}`}
              className="group author-card-hover flex flex-col items-center p-5 bg-white rounded-2xl border border-slate-100/80 shadow-card hover:shadow-card-hover card-hover-lift text-center"
            >
              <div className="relative mb-3 w-16 h-16">
                <Image
                  src={getOptimizedCloudinaryUrl(doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png', { width: 100, height: 100 })}
                  alt={doc.name}
                  fill
                  className="rounded-2xl object-cover ring-[3px] ring-white shadow-md"
                  sizes="64px"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[2.5px] border-white flex items-center justify-center shadow-sm">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-slate-800 leading-tight line-clamp-2 mb-1">
                {doc.name}
              </p>
              <p className="text-[11.5px] font-medium text-blue-600 mb-2">
                {dbT(doc.specialty)}
              </p>
              <span className="author-view-link text-[11px] font-medium text-slate-400 group-hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                Профиль
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-5 md:hidden">
          <Link href={`/${lang}/authors`} className="text-[13.5px] font-medium text-blue-600">
            {t('home.authorsViewAll')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
