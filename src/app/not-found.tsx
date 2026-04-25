import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="text-center max-w-lg">

        {/* Логотип */}
        <Link href="/ru" className="text-2xl font-extrabold text-white mb-12 block">
          duxtur<span className="text-blue-400">.com</span>
        </Link>

        {/* 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] md:text-[160px] font-extrabold text-white/5 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🩺</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          Страница не найдена
        </h1>
        <p className="text-blue-200 mb-10 leading-relaxed">
          Эта страница не существует или была удалена.
          Возможно, вы перешли по устаревшей ссылке.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/ru"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition shadow-lg shadow-blue-900">
            На главную
          </Link>
          <Link href="/ru/blog"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-2xl transition border border-white/10">
            Все статьи
          </Link>
        </div>

        <p className="text-blue-300/40 text-xs mt-12">
          © {new Date().getFullYear()} Duxtur.com
        </p>
      </div>
    </div>
  );
}
