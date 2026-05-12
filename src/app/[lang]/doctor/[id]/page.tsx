// src/app/[lang]/doctor/[id]/page.tsx
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';
import ShareButtons from '@/components/ShareButtons';

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await dbConnect();
  const { id, lang } = await params;
  const doctor = await Doctor.findOne({ $or: [{ slug: id }, { _id: id.match(/^[a-f\d]{24}$/i) ? id : null }] });
  if (!doctor) return { title: 'Врач не найден' };
  const specialty = doctor.specialty?.[lang] || doctor.specialty?.ru || '';
  return {
    title: `${doctor.name} — ${specialty} | Duxtur.org`,
    description: `Статьи и профиль врача ${doctor.name}. ${specialty} на портале Duxtur.org`,
    alternates: buildAlternates(`doctor/${id}`, lang),
  };
}

// Конфигурация категорий и цветов (оставлена от Клода)
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  cardiology:     { ru: 'Кардиология',    uz: 'Kardiologiya' },
  neurology:      { ru: 'Неврология',     uz: 'Nevrologiya' },
  dentistry:      { ru: 'Стоматология',   uz: 'Stomatologiya' },
  pediatrics:     { ru: 'Педиатрия',      uz: 'Pediatriya' },
  dermatology:    { ru: 'Дерматология',   uz: 'Dermatologiya' },
  ophthalmology:  { ru: 'Офтальмология',  uz: 'Oftalmologiya' },
  surgery:        { ru: 'Хирургия',       uz: 'Jarrohlik' },
  gynecology:     { ru: 'Гинекология',    uz: 'Ginekologiya' },
  general:        { ru: 'Общая медицина', uz: 'Umumiy tibbiyot' },
};

const CATEGORY_COLORS: Record<string, string> = {
  cardiology:    'bg-rose-50 text-rose-700 border-rose-200',
  neurology:     'bg-violet-50 text-violet-700 border-violet-200',
  dentistry:     'bg-sky-50 text-sky-700 border-sky-200',
  pediatrics:    'bg-amber-50 text-amber-700 border-amber-200',
  dermatology:   'bg-pink-50 text-pink-700 border-pink-200',
  ophthalmology: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  surgery:       'bg-slate-50 text-slate-700 border-slate-200',
  gynecology:    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  general:       'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// Функция для генерации миссии врача, если поля нет в БД
function getMission(specialty: string): string {
  const missions: Record<string, string> = {
    'кардиология': 'Помогаю пациентам обрести здоровое сердце и уверенность в завтрашнем дне',
    'неврология': 'Помогаю восстановить ясность ума и свободу движений',
    'стоматология': 'Возвращаю красоту и здоровье вашей улыбки',
    'педиатрия': 'Забочусь о самом ценном — здоровье ваших детей',
    'дерматология': 'Помогаю обрести уверенность через здоровую кожу',
    'офтальмология': 'Открываю мир ярких красок для ваших глаз',
    'хирургия': 'Возвращаю качество жизни через точность и заботу',
    'гинекология': 'С заботой о женском здоровье на каждом этапе жизни',
  };
  const key = specialty.toLowerCase();
  return missions[key] || `Помогаю пациентам достичь лучшего здоровья и качества жизни`;
}

function getReadingTime(article: any): number {
  const text = Object.values(article.overview || {}).join(' ') + Object.values(article.symptoms || {}).join(' ');
  const words = text.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

export default async function DoctorProfilePage({ params }: Props) {
  await dbConnect();
  const { lang, id } = await params;

  const doctor: any = await Doctor.findOne({
    $or: [
      { slug: id },
      ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : []),
    ],
  }).lean();

  if (!doctor) notFound();

  const articles: any[] = await Article.find({ authorId: doctor._id })
    .sort({ createdAt: -1 })
    .lean();

  const t = (field: any) => {
    if (!field) return '';
    return field[lang] || field['ru'] || '';
  };

  const specialtyLabel = t(doctor.specialty);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur.org';
  const doctorUrl = `${baseUrl}/${lang}/doctor/${doctor.slug || doctor._id}`;
  
  // Используем отдельное поле mission, если есть, иначе — генерируем
  const mission = t(doctor.mission) || getMission(specialtyLabel);

  const lastReviewedArticle = articles.find(a => a.lastMedicalReview);
  const lastMedicalReviewDate = lastReviewedArticle?.lastMedicalReview
    ? new Date(lastReviewedArticle.lastMedicalReview).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
  
  // JSON-LD с расширенными полями
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': ['Person', 'MedicalBusiness'],
    '@id': doctorUrl,
    name: doctor.name,
    jobTitle: specialtyLabel,
    description: mission, // Используем миссию как описание
    url: doctorUrl,
    image: doctor.image || undefined,
    worksFor: doctor.workplace ? { '@type': 'Organization', name: doctor.workplace } : undefined,
    alumniOf: doctor.education ? { '@type': 'EducationalOrganization', name: doctor.education } : undefined,
    sameAs: doctor.sameAs?.length > 0 ? doctor.sameAs : undefined,
    lastReviewed: lastReviewedArticle?.lastMedicalReview || undefined,
    knowsAbout: specialtyLabel || undefined,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Duxtur.org', item: `${baseUrl}/${lang}` },
        { '@type': 'ListItem', position: 2, name: 'Врачи', item: `${baseUrl}/${lang}/authors` },
        { '@type': 'ListItem', position: 3, name: doctor.name, item: doctorUrl },
      ],
    },
  };
  Object.keys(jsonLd).forEach((k) => jsonLd[k] === undefined && delete jsonLd[k]);

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Стили для печати (скрываем навигацию, делаем белый фон) */}
      <style>{`
        @media print {
          header, .share-area, .no-print { display: none !important; }
          body { background: white !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* HEADER (скрыт при печати) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-lg font-black tracking-tight text-blue-600">
            duxtur<span className="text-gray-300 font-light">.org</span>
          </Link>
          <Link
            href={`/${lang}/authors`}
            className="text-sm text-gray-400 hover:text-gray-700 transition font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Все врачи
          </Link>
        </div>
      </header>

      {/* HERO — Улучшенный: миссия, акцентный цвет */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2a52] to-[#0a1628]">
        {/* Декорации оставлены */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-10">
            {/* Аватар */}
            <div className="relative shrink-0 mx-auto md:mx-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl">
                <img
                  src={doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wide">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="..." clipRule="evenodd" /></svg>
                Верифицирован
              </div>
            </div>

            {/* Инфо */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              {/* Пилюля специализации — теперь с динамическим цветом */}
              <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="..." /></svg>
                {specialtyLabel}
              </span>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-3">
                {doctor.name}
              </h1>

              {/* Эмоциональный крючок — Миссия */}
              <p className="text-blue-200/90 text-sm md:text-base leading-relaxed max-w-xl mb-6 italic">
                {mission}
              </p>

              {/* Метрики */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <HeroStat icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} value={articles.length.toString()} label={articles.length === 1 ? 'статья' : articles.length < 5 ? 'статьи' : 'статей'} />
                {doctor.experience > 0 && <HeroStat icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} value={`${doctor.experience}`} label="лет опыта" />}
                {totalViews > 0 && <HeroStat icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} value={totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString()} label="прочтений" />}
                {doctor.languages?.length > 0 && <HeroStat icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>} value={doctor.languages.length.toString()} label={doctor.languages.length === 1 ? 'язык' : 'языка'} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая часть — Статьи (без изменений, код Клода идеален) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Публикации
              {articles.length > 0 && <span className="ml-2.5 bg-gray-100 text-gray-500 text-sm font-bold px-2.5 py-0.5 rounded-full">{articles.length}</span>}
            </h2>
          </div>
          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <p className="font-bold text-gray-700 mb-1 text-lg">Материалы готовятся</p>
              <p className="text-sm text-gray-400">Врач скоро опубликует первую статью</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article, idx) => {
                const catLabel = CATEGORY_LABELS[article.category]?.[lang] || CATEGORY_LABELS[article.category]?.ru || '';
                const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.general;
                const readingTime = getReadingTime(article);
                return (
                  <Link key={article._id} href={`/${lang}/blog/${article.slug}`} className="group flex bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-32 md:w-44 shrink-0 overflow-hidden relative">
                      <img src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'} alt={t(article.title)} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                      <div className="absolute top-3 left-3 w-7 h-7 bg-black/40 backdrop-blur-sm text-white text-xs font-black rounded-lg flex items-center justify-center">{idx + 1}</div>
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {catLabel && <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${catColor}`}>{catLabel}</span>}
                          <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455..." clipRule="evenodd" /></svg>
                            Проверено врачом
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 text-[15px]">{t(article.title)}</h3>
                        <p className="text-sm text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{t(article.overview)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{new Date(article.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{readingTime} мин</span>
                          {article.views > 0 && <><span className="text-gray-200">·</span><span className="text-xs text-gray-400 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>{article.views}</span></>}
                        </div>
                        <span className="text-blue-500 text-xs font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">Читать <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ПРАВАЯ ЧАСТЬ — Сайдбар с улучшенной структурой */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Досье врача (код Клода оставлен) */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="bg-gradient-to-r from-[#0a1628] to-[#0f2a52] px-5 py-4">
                <p className="text-blue-300/70 text-[10px] font-black uppercase tracking-[0.15em] mb-0.5">Профиль врача</p>
                <p className="text-white font-black text-base leading-tight">{doctor.name}</p>
                {specialtyLabel && <p className="text-blue-300/80 text-xs mt-1">{specialtyLabel}</p>}
              </div>
              <div className="p-5 space-y-4">
                {doctor.experience > 0 && <SidebarRow icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="Стаж" value={`${doctor.experience} лет`} />}
                {doctor.workplace && <SidebarRow icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} label="Место работы" value={doctor.workplace} />}
                {doctor.education && <SidebarRow icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>} label="Образование" value={doctor.education} />}
                {doctor.languages?.length > 0 && <SidebarRow icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>} label="Языки" value={doctor.languages.join(', ')} />}
              </div>
              {doctor.bio && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-gray-50 pt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-2">О враче</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Блок доверия + Кнопка "Поделиться" */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">Доверие и верификация</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Верифицированный автор</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">Диплом и квалификация подтверждены</p>
                  </div>
                </div>
                {lastMedicalReviewDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Медицинская проверка</p>
                      <p className="text-blue-600 text-xs font-semibold mt-0.5">{lastMedicalReviewDate}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Контент проверен практикующим врачом</p>
                    </div>
                  </div>
                )}
                {articles.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Активный автор</p>
                      <p className="text-gray-400 text-xs mt-0.5">Последняя публикация: {new Date(articles[0].createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* CTA перенесен сюда */}
              <div className="px-5 pb-5">
                <div className="border-t border-gray-50 pt-4">
                  <ShareButtons url={doctorUrl} title={`${doctor.name} — ${specialtyLabel}`} lang={lang} />
                </div>
              </div>
            </div>

            {/* Кнопка "Сохранить как PDF" (новая!) */}
            <button onClick={() => window.print()} className="no-print w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Сохранить как PDF
            </button>
          </div>
        </div>
      </div>

      {/* Мобильная Sticky-панель "Поделиться" (новая!) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 flex items-center justify-between gap-4 share-area z-50">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{doctor.name}</p>
          <p className="text-xs text-gray-500 truncate">{specialtyLabel}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(doctorUrl)} className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-gray-200 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Копировать
          </button>
          <ShareButtons url={doctorUrl} title={`${doctor.name} — ${specialtyLabel}`} lang={lang} />
        </div>
      </div>
    </div>
  );
}

/* Вспомогательные компоненты (код Клода) */
function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl">
      <span className="text-blue-300/80">{icon}</span>
      <div>
        <p className="font-black text-white text-sm leading-none">{value}</p>
        <p className="text-blue-200/60 text-[11px] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SidebarRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}
