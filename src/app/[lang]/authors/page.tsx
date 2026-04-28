import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import Link from 'next/link';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: 'Наши авторы-врачи — Duxtur.com',
    uz: 'Bizning shifokor-mualliflar — Duxtur.com',
    tg: 'Муаллифони мо — Duxtur.com',
    kk: 'Біздің дәрігер-авторлар — Duxtur.com',
    ky: 'Биздин автор-дарыгерлер — Duxtur.com',
  };
  const descs: Record<string, string> = {
    ru: 'Практикующие врачи Центральной Азии, пишущие для Duxtur.com. Верифицированные специалисты — кардиологи, неврологи, педиатры.',
    uz: 'Markaziy Osiyo amaliyotchi shifokorlari Duxtur.com uchun yozadi.',
    tg: 'Духтурони амалкунандаи Осиёи Марказӣ барои Duxtur.com менависанд.',
    kk: 'Орта Азияның тәжірибелі дәрігерлері Duxtur.com үшін жазады.',
    ky: 'Борбордук Азиянын тажрыйбалуу дарыгерлери Duxtur.com үчүн жазат.',
  };
  return {
    title: titles[lang] || titles.ru,
    description: descs[lang] || descs.ru,
    alternates: buildAlternates('authors'),
  };
}

const ui: Record<string, Record<string, string>> = {
  title:    { ru: 'Авторы-врачи',        uz: 'Shifokor-mualliflar',   tg: 'Муаллифон-духтурон',   kk: 'Дәрігер-авторлар',      ky: 'Автор-дарыгерлер'        },
  subtitle: { ru: 'Практикующие врачи Центральной Азии, которые делятся знаниями', uz: 'Markaziy Osiyo amaliyotchi shifokorlari', tg: 'Духтурони амалкунандаи Осиёи Марказӣ', kk: 'Орта Азияның тәжірибелі дәрігерлері', ky: 'Борбордук Азиянын тажрыйбалуу дарыгерлери' },
  articles: { ru: 'статей',              uz: 'maqola',                tg: 'мақола',               kk: 'мақала',                ky: 'макала'                  },
  verified: { ru: 'Верифицирован',       uz: 'Tasdiqlangan',          tg: 'Тасдиқшуда',           kk: 'Расталған',             ky: 'Тастыкталган'            },
  read:     { ru: 'Читать статьи',       uz: 'Maqolalarni o\'qish',   tg: 'Мақолаҳоро хонед',    kk: 'Мақалаларды оқу',       ky: 'Макалаларды окуу'        },
  join:     { ru: 'Вы врач? Станьте автором', uz: 'Shifokor misiz? Muallif bo\'ling', tg: 'Шумо духтур ҳастед?', kk: 'Сіз дәрігер бе?',      ky: 'Сиз дарыгер белесиз?'   },
  join_btn: { ru: 'Подать заявку',       uz: 'Ariza topshirish',      tg: 'Ариза додан',          kk: 'Өтінім беру',           ky: 'Арыз берүү'              },
  back:     { ru: 'Главная',             uz: 'Bosh sahifa',           tg: 'Саҳифаи асосӣ',        kk: 'Басты бет',             ky: 'Башкы бет'               },
  exp:      { ru: 'лет опыта',           uz: 'yil tajriba',           tg: 'соли таҷриба',         kk: 'жыл тәжірибе',          ky: 'жыл тажрыйба'            },
  doctors:  { ru: 'врачей',              uz: 'shifokor',              tg: 'духтур',               kk: 'дәрігер',               ky: 'дарыгер'                 },
  langs:    { ru: 'языков',              uz: 'til',                   tg: 'забон',                kk: 'тіл',                   ky: 'тил'                     },
};
const L = (key: string, lang: string) => ui[key]?.[lang] || ui[key]?.ru || '';

export default async function AuthorsPage({ params }: Props) {
  const { lang } = await params;
  await dbConnect();

  const doctors: any[] = await Doctor.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .lean();

  const doctorsWithCount = await Promise.all(
    doctors.map(async (doc) => ({
      ...doc,
      articleCount: await Article.countDocuments({ authorId: doc._id }),
    }))
  );

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur-portal.vercel.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${L('title', lang)} — Duxtur.com`,
    url: `${baseUrl}/${lang}/authors`,
    description: L('subtitle', lang),
    publisher: {
      '@type': 'Organization',
      name: 'Duxtur.com',
      url: baseUrl,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Duxtur.com',
          item: `${baseUrl}/${lang}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: L('title', lang),
          item: `${baseUrl}/${lang}/authors`,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-gray-900">
              duxtur<span className="text-blue-600">.com</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href={`/${lang}/blog`} className="hover:text-gray-900 transition font-medium">
              {lang === 'ru' ? 'Статьи' : 'Blog'}
            </Link>
            <Link
              href={`/${lang}/register`}
              className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition text-xs"
            >
              {L('join_btn', lang)}
            </Link>
          </nav>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <nav className="flex items-center gap-2 text-xs text-gray-400">
          <Link href={`/${lang}`} className="hover:text-blue-600 transition">{L('back', lang)}</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{L('title', lang)}</span>
        </nav>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 mb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Все врачи верифицированы вручную
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {L('title', lang)}
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed">
            {L('subtitle', lang)}
          </p>

          {/* Статистика */}
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              { value: doctors.length, label: L('doctors', lang) },
              { value: 5, label: L('langs', lang) },
              { value: '100%', label: lang === 'ru' ? 'верифицированы' : 'verified' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-blue-300 text-xs mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">

        {/* СЕТКА АВТОРОВ */}
        {doctorsWithCount.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <p className="text-xl font-bold text-gray-700 mb-2">Авторы скоро появятся</p>
            <p className="text-gray-400 mb-8 text-sm">Первые врачи уже проходят верификацию</p>
            <Link
              href={`/${lang}/register`}
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition"
            >
              Стать первым автором →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctorsWithCount.map((doc) => (
              <Link
                key={doc._id}
                href={`/${lang}/doctor/${doc.slug || doc._id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Шапка карточки */}
                <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={doc.name}
                      width={72}
                      height={72}
                      className="w-[72px] h-[72px] rounded-2xl object-cover border-2 border-white/20 group-hover:border-white/50 transition"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-base leading-tight truncate group-hover:text-blue-200 transition">
                      {doc.name}
                    </p>
                    <p className="text-blue-300 text-sm mt-1 truncate">{t(doc.specialty)}</p>
                    {doc.experience > 0 && (
                      <p className="text-blue-400/60 text-xs mt-1">
                        {doc.experience} {L('exp', lang)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Тело карточки */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {L('verified', lang)}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900">
                      {doc.articleCount}
                      <span className="text-gray-400 font-normal text-xs ml-1">{L('articles', lang)}</span>
                    </span>
                  </div>

                  {doc.languages?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {doc.languages.slice(0, 4).map((lng: string) => (
                        <span key={lng} className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full font-medium border border-gray-100">
                          {lng}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      с {new Date(doc.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {L('read', lang)}
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-10 md:p-14">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">{L('join', lang)}</h2>
              <ul className="space-y-2 text-blue-200 text-sm">
                {[
                  lang === 'ru' ? 'Бесплатная регистрация и верификация' : 'Free registration',
                  lang === 'ru' ? 'AI помогает структурировать статьи' : 'AI helps structure articles',
                  lang === 'ru' ? 'Аудитория на 5 языках Центральной Азии' : 'Audience in 5 languages',
                  lang === 'ru' ? 'Профиль врача с индексацией в Google' : 'Doctor profile indexed in Google',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-400 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={`/${lang}/register`}
              className="shrink-0 bg-white text-slate-900 font-extrabold py-4 px-10 rounded-full hover:bg-blue-50 transition shadow-2xl hover:-translate-y-0.5 transform text-sm whitespace-nowrap"
            >
              {L('join_btn', lang)} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
