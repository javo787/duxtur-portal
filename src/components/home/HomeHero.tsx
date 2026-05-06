// Компонент Hero в духе "Empathetic Premium Clinic"
export default function HomeHero({ lang, dict }: { lang: string; dict: any }) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Тонкий фоновый градиент для мягкости */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/30 via-white to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-14 items-center">
          {/* Текстовый блок */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 text-amber-800 text-xs font-semibold tracking-[0.1em] uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Только проверенные врачи
            </span>

            <h1 className="font-display text-[clamp(2.8rem,8vw,4.8rem)] leading-[1.05] font-bold text-slate-900 tracking-[-0.03em] mb-6">
              Знания, <br/>
              <span className="text-blue-600">которым доверяют</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10">
              {dict.hero_subtitle}
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Link
                href={`/${lang}/blog`}
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-colors active:scale-95"
              >
                Читать статьи
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href={`/${lang}/register`}
                className="inline-flex items-center gap-2.5 px-7 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-400 hover:bg-slate-50 transition-colors active:scale-95"
              >
                Стать автором
              </Link>
            </div>
          </div>

          {/* Визуальный акцент (можно заменить на иллюстрацию) */}
          <div className="hidden lg:block relative aspect-square max-w-md ml-auto">
            <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-blue-100/60 via-amber-50/50 to-amber-100/40 shadow-xl shadow-slate-200/10 flex items-center justify-center">
              <svg className="w-24 h-24 text-amber-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Статистика — отдельно, тонкая полоса */}
        <div className="flex justify-center gap-10 mt-14 pt-10 border-t border-slate-100 max-w-lg mx-auto text-center">
          {[
            { num: '5', label: 'языков' },
            { num: '100%', label: 'проверенных авторов' },
            { num: '24ч', label: 'верификация' },
          ].map((stat, i) => (
            <div key={i}>
              <span className="font-display text-2xl font-bold text-blue-600">{stat.num}</span>
              <span className="block text-xs text-slate-400 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
