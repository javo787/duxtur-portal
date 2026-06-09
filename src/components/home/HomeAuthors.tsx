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
    <section className="py-16 border-t border-slate-100 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2">
              {t('home.authorsSubtitle')}
            </p>
            <h2 className="font-display text-[26px] font-bold text-slate-900 tracking-tight">
              {t('home.authorsTitle')}
            </h2>
          </div>
          <Link
            href={`/${lang}/authors`}
            className="hidden md:flex items-center gap-1.5 text-[13.5px] font-medium text-blue-600 border-b border-blue-300 hover:border-blue-600 transition-colors pb-0.5"
          >
            {t('home.authorsViewAll')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {authors.map((doc: any) => (
            <Link
              key={doc._id}
              href={`/${lang}/doctor/${doc.slug || doc._id}`}
              className="group flex flex-col items-center p-5 bg-white rounded-xl border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="relative mb-3.5 w-14 h-14">
                <Image
                  src={getOptimizedCloudinaryUrl(doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png', { width: 100, height: 100 })}
                  alt={doc.name}
                  fill
                  className="rounded-xl object-cover border-2 border-slate-100"
                  sizes="56px"
                />
                <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-slate-800 leading-tight line-clamp-2 mb-1">
                {doc.name}
              </p>
              <p className="text-[11.5px] font-normal text-blue-600">
                {dbT(doc.specialty)}
              </p>
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
