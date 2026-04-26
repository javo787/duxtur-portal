import Link from 'next/link';

export default function HomeCTA({ lang, dict }: { lang: string; dict: any }) {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-20">
      {/* Декор */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-block text-xs bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider mb-5">
              Для врачей
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              {dict.for_doctors}
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-6">{dict.for_doctors_desc}</p>
            <ul className="space-y-3">
              {[
                'Бесплатная регистрация',
                'AI-помощник для написания статей',
                'Аудитория на 5 языках СНГ',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0 text-center">
            <Link href={`/${lang}/register`}
              className="inline-flex items-center gap-3 bg-white text-slate-900 font-extrabold py-5 px-10 rounded-2xl hover:bg-blue-50 transition shadow-2xl transform hover:-translate-y-1 text-lg active:scale-95">
              {dict.btn_join}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="text-slate-500 text-xs mt-3">Верификация за 24 часа</p>
          </div>
        </div>
      </div>
    </section>
  );
}
