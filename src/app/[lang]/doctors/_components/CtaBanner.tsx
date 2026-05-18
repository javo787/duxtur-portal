import Link from 'next/link';

export default function CtaBanner({ lang }: { lang: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-7">
      {/* Декор */}
      <div aria-hidden="true" className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400/8 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-3">
            🩺 Для врачей
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Вы врач? Присоединяйтесь к Duxtur.org
          </h3>
          <p className="text-blue-200/80 text-sm">
            Верификация за 24 часа · Бесплатно · AI-помощник
          </p>
        </div>
        <Link
          href={`/${lang}/register`}
          className="flex-shrink-0 px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-amber-50 transition shadow-lg"
        >
          Подать заявку →
        </Link>
      </div>
    </div>
  );
}
