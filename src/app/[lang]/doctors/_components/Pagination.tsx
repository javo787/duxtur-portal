import Link from 'next/link';

interface PaginationProps {
  lang: string;
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}

export default function Pagination({ lang, currentPage, totalPages, searchParams }: PaginationProps) {
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && k !== 'page') {
        if (Array.isArray(v)) v.forEach(val => params.append(k, val));
        else params.append(k, v as string);
      }
    });
    if (page > 1) params.set('page', page.toString());
    const qs = params.toString();
    return `/${lang}/doctors${qs ? `?${qs}` : ''}`;
  };

  // Генерация массива страниц для отображения (до 5)
  const pages = [];
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="relative mt-2 pt-6 border-t border-slate-100">
      <nav className="flex items-center justify-center gap-2" aria-label="Пагинация">
        {currentPage > 1 && (
          <Link
            href={buildPageUrl(currentPage - 1)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition font-bold shadow-sm"
            aria-label="Предыдущая страница"
          >
            ←
          </Link>
        )}
        {pages.map(p => (
          <Link
            key={p}
            href={buildPageUrl(p)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition ${
              p === currentPage
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-100 pointer-events-none'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
            }`}
            aria-label={`Страница ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        ))}
        {currentPage < totalPages && (
          <Link
            href={buildPageUrl(currentPage + 1)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition font-bold shadow-sm"
            aria-label="Следующая страница"
          >
            →
          </Link>
        )}
      </nav>
      <p className="text-center text-xs text-slate-400 mt-3">
        Страница {currentPage} из {totalPages}
      </p>
    </div>
  );
}
