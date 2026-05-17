import Link from 'next/link';

export default function CtaBanner({ lang }: { lang: string }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-5 shadow-xl">
      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-lg font-bold text-white mb-1">Вы врач? Присоединяйтесь к Duxtur.org</h3>
        <p className="text-blue-200/90 text-sm">Верификация за 24 часа · Бесплатно · AI-помощник</p>
      </div>
      <Link
        href={`/${lang}/register`}
        className="flex-shrink-0 px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-blue-50 transition shadow-lg"
      >
        Подать заявку →
      </Link>
    </div>
  );
}
