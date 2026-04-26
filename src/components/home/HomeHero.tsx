export default function HomeHero({ lang, dict }: { lang: string; dict: any }) {
  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-16">
      {/* Декоративный фон */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/3 opacity-60" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full translate-y-1/2 -translate-x-1/3 opacity-40" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 text-center">
        {/* Бейдж */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Статьи проверены врачами
        </div>

        {/* Заголовок */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
          {dict.hero_title}
        </h1>

        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          {dict.hero_subtitle}
        </p>

        {/* Поиск */}
        <form action={`/${lang}/search`}
          className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-2xl p-2 max-w-xl mx-auto shadow-lg shadow-gray-100 focus-within:border-blue-400 transition">
          <svg className="w-5 h-5 text-gray-400 ml-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder={dict.search_placeholder}
            className="flex-1 py-3 px-2 text-gray-700 placeholder-gray-400 bg-transparent outline-none text-base"
          />
          <button type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-200 active:scale-95 shrink-0">
            {dict.search_btn}
          </button>
        </form>

        {/* Доверие */}
        <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
          {[
            { num: '5', label: 'языков СНГ' },
            { num: '100%', label: 'верифицированы' },
            { num: '24ч', label: 'новые статьи' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-extrabold text-gray-900 text-base">{stat.num}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
