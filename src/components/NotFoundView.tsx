import Link from 'next/link';

const translations: Record<string, {
  title: string;
  desc: string;
  home: string;
  blog: string;
}> = {
  ru: {
    title: 'Страница не найдена',
    desc: 'Эта страница не существует или была удалена. Возможно, вы перешли по устаревшей ссылке.',
    home: 'На главную',
    blog: 'Все статьи',
  },
  uz: {
    title: 'Sahifa topilmadi',
    desc: 'Bu sahifa mavjud emas yoki o\'chirilgan. Ehtimol, siz eskirgan havoladan o\'tdingiz.',
    home: 'Bosh sahifa',
    blog: 'Barcha maqolalar',
  },
  tg: {
    title: 'Саҳифа ёфт нашуд',
    desc: 'Ин саҳифа вуҷуд надорад ё нест карда шудааст. Эҳтимол, шумо аз истиноди кӯҳна гузаштед.',
    home: 'Саҳифаи асосӣ',
    blog: 'Ҳамаи мақолаҳо',
  },
  kk: {
    title: 'Бет табылмады',
    desc: 'Бұл бет жоқ немесе жойылған. Мүмкін, сіз ескі сілтеме арқылы өттіңіз.',
    home: 'Басты бет',
    blog: 'Барлық мақалалар',
  },
  ky: {
    title: 'Барак табылган жок',
    desc: 'Бул барак жок же жок кылынган. Балким, сиз эски шилтеме аркылуу өттүңүз.',
    home: 'Башкы бет',
    blog: 'Бардык макалалар',
  },
};

/** A supported language code, or Russian for anything else (including undefined). */
export function resolveNotFoundLang(segment: string | undefined): string {
  return segment && translations[segment] ? segment : 'ru';
}

/**
 * The 404 screen itself (no <html>/<body>: the caller decides whether a layout already provides them).
 *
 * It must not read request headers: a page that renders ISR calls notFound() for an unknown id, and any
 * request-time API in the not-found tree turns that static render into a runtime "static to dynamic" error.
 * The language therefore comes from the route params (see [lang]/not-found.tsx) or the browser URL
 * (see not-found.tsx), never from the request.
 */
export default function NotFoundView({ lang }: { lang: string }) {
  const t = translations[resolveNotFoundLang(lang)];
  const base = `/${resolveNotFoundLang(lang)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="text-center max-w-lg">

        <Link href={base} className="text-2xl font-extrabold text-white mb-12 block">
          duxtur<span className="text-blue-400">.com</span>
        </Link>

        <div className="relative mb-8">
          <p className="text-[120px] md:text-[160px] font-extrabold text-white/5 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🩺</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          {t.title}
        </h1>
        <p className="text-blue-200 mb-10 leading-relaxed">
          {t.desc}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={base}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition shadow-lg shadow-blue-900">
            {t.home}
          </Link>
          <Link href={`${base}/blog`}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-2xl transition border border-white/10">
            {t.blog}
          </Link>
        </div>

        <p className="text-blue-300/40 text-xs mt-12">
          © {new Date().getFullYear()} Duxtur.org
        </p>
      </div>
    </div>
  );
}
