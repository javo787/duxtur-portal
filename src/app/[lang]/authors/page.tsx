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
 return {
    title: titles[lang] || titles.ru,
    description:
      lang === 'ru'
        ? 'Практикующие врачи Центральной Азии, пишущие для Duxtur.com.'
        : undefined,
    alternates: buildAlternates('authors'),
  }; 
}

const ui: Record<string, Record<string, string>> = {
  title:    { ru: 'Авторы-врачи',        uz: 'Shifokor-mualliflar',  tg: 'Муаллифон-духтурон',    kk: 'Дәрігер-авторлар',       ky: 'Автор-дарыгерлер' },
  subtitle: { ru: 'Практикующие врачи Центральной Азии, которые делятся знаниями', uz: 'Markaziy Osiyo amaliyotchi shifokorlari', tg: 'Духтурони амалкунандаи Осиёи Марказӣ', kk: 'Орта Азияның тәжірибелі дәрігерлері', ky: 'Борбордук Азиянын тажрыйбалуу дарыгерлери' },
  articles: { ru: 'статей',              uz: 'maqola',               tg: 'мақола',                kk: 'мақала',                  ky: 'макала' },
  verified: { ru: 'Верифицирован',       uz: 'Tasdiqlangan',         tg: 'Тасдиқшуда',            kk: 'Расталған',               ky: 'Тастыкталган' },
  read:     { ru: 'Читать статьи →',     uz: 'Maqolalarni o\'qish →', tg: 'Мақолаҳоро хонед →',   kk: 'Мақалаларды оқу →',       ky: 'Макалаларды окуу →' },
  join:     { ru: 'Вы врач? Станьте автором', uz: 'Shifokor misiz? Muallif bo\'ling', tg: 'Шумо духтур ҳастед?', kk: 'Сіз дәрігер бе?', ky: 'Сиз дарыгер белесиз?' },
  join_btn: { ru: 'Подать заявку →',    uz: 'Ariza topshirish →',   tg: 'Ариза додан →',         kk: 'Өтінім беру →',           ky: 'Арыз берүү →' },
  back:     { ru: 'Главная',            uz: 'Bosh sahifa',          tg: 'Саҳифаи асосӣ',         kk: 'Басты бет',               ky: 'Башкы бет' },
  exp:      { ru: 'лет опыта',          uz: 'yil tajriba',          tg: 'соли таҷриба',          kk: 'жыл тәжірибе',            ky: 'жыл тажрыйба' },
};
const L = (key: string, lang: string) => ui[key]?.[lang] || ui[key]?.ru || '';

export default async function AuthorsPage({ params }: Props) {
  const { lang } = await params;
  await dbConnect();

  const doctors: any[] = await Doctor.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .lean();

  // Считаем статьи для каждого врача
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

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-xl font-extrabold text-blue-600">
            duxtur<span className="text-gray-300 font-light">.com</span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
            ← {L('back', lang)}
          </Link>
        </div>
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider mb-5">
            ✓ Все врачи верифицированы
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {L('title', lang)}
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed">
            {L('subtitle', lang)}
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-white/60 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white">{doctors.length}</span> врачей
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white">5</span> языков
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white">100%</span> верифицированы
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">

        {/* СЕТКА АВТОРОВ */}
        {doctorsWithCount.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">👨‍⚕️</div>
            <p className="text-xl font-bold text-gray-700 mb-2">Авторы скоро появятся</p>
            <p className="text-gray-400 mb-8">Первые врачи уже проходят верификацию</p>
            <Link href={`/${lang}/register`}
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition">
              Стать первым автором →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctorsWithCount.map((doc) => (
              <Link
                key={doc._id}
                href={`/${lang}/doctor/${doc.slug || doc._id}`}
                className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden"
              >
                {/* Верхняя часть — градиент с фото */}
                <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-6 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                      alt={doc.name}
                      className="w-18 h-18 w-[72px] h-[72px] rounded-2xl object-cover border-2 border-white/20 group-hover:border-white/40 transition"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-lg leading-tight truncate group-hover:text-blue-200 transition">
                      {doc.name}
                    </p>
                    <p className="text-blue-300 text-sm mt-0.5">{t(doc.specialty)}</p>
                    {doc.experience > 0 && (
                      <p className="text-blue-400/70 text-xs mt-1">
                        {doc.experience} {L('exp', lang)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Нижняя часть */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-1.5 text-green-600 text-xs font-extrabold bg-green-50 px-3 py-1.5 rounded-full">
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

                  {/* Языки */}
                  {doc.languages?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {doc.languages.slice(0, 3).map((lng: string) => (
                        <span key={lng} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                          {lng}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      С {new Date(doc.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-blue-600 text-xs font-extrabold group-hover:translate-x-1 transition">
                      {L('read', lang)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA для новых врачей */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-extrabold mb-2">{L('join', lang)}</h2>
            <ul className="space-y-1.5 text-blue-200 text-sm mt-4">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Бесплатная регистрация
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> AI помогает писать статьи
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Аудитория на 5 языках
              </li>
            </ul>
          </div>
          <Link
            href={`/${lang}/register`}
            className="shrink-0 bg-white text-slate-900 font-extrabold py-4 px-10 rounded-full hover:bg-blue-50 transition shadow-xl transform hover:-translate-y-1 text-base"
          >
            {L('join_btn', lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
