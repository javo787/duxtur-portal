import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await dbConnect();
  const { id, lang } = await params;
  const doctor = await Doctor.findOne({ $or: [{ slug: id }, { _id: id.match(/^[a-f\d]{24}$/i) ? id : null }] });
  if (!doctor) return { title: 'Врач не найден' };
  const specialty = doctor.specialty?.[lang] || doctor.specialty?.ru || '';
  return {
    title: `${doctor.name} — ${specialty} | Duxtur.com`,
    description: `Статьи и профиль врача ${doctor.name}. ${specialty} на портале Duxtur.com`,
    alternates: buildAlternates(`doctor/${id}`),
  };
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur-portal.vercel.app';
  const doctorUrl = `${baseUrl}/${lang}/doctor/${doctor.slug || doctor._id}`;
  // Дата последней медицинской проверки — берём из самой свежей статьи
  const lastReviewedArticle = articles.find(a => a.lastMedicalReview);
  const lastMedicalReviewDate = lastReviewedArticle?.lastMedicalReview
    ? new Date(lastReviewedArticle.lastMedicalReview).toLocaleDateString('ru', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;
  
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': ['Person', 'MedicalBusiness'],
    '@id': doctorUrl,
    name: doctor.name,
    jobTitle: specialtyLabel,
    url: doctorUrl,
    image: doctor.image || undefined,
    worksFor: doctor.workplace
      ? { '@type': 'Organization', name: doctor.workplace }
      : { '@type': 'Organization', name: 'Duxtur.com', url: baseUrl },
    alumniOf: doctor.education
      ? { '@type': 'EducationalOrganization', name: doctor.education }
      : undefined,
    description: doctor.bio || undefined,
    sameAs: doctor.sameAs?.length > 0 ? doctor.sameAs : undefined,
    lastReviewed: lastReviewedArticle?.lastMedicalReview || undefined,
    knowsAbout: specialtyLabel || undefined,
  };
  Object.keys(jsonLd).forEach((k) => jsonLd[k] === undefined && delete jsonLd[k]);

  return (
     <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/${lang}`} className="text-xl font-extrabold text-blue-600">
            duxtur<span className="text-gray-300 font-light">.com</span>
          </Link>
          <Link href={`/${lang}`} className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
            ← Назад
          </Link>
        </div>
      </header>

      {/* HERO — градиентный баннер */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center gap-10">

          {/* Аватар */}
          <div className="relative shrink-0">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
              <img
                src={doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Verified badge */}
            <div className="absolute -bottom-3 -right-3 bg-green-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Верифицирован
            </div>
          </div>

          {/* Инфо */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-blue-300 font-bold text-sm uppercase tracking-widest mb-2">
              {specialtyLabel}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
              {doctor.name}
            </h1>

            {doctor.bio && (
              <p className="text-blue-100/80 text-sm leading-relaxed max-w-xl mt-2 mb-4">
                {doctor.bio}
              </p>
            )}

            {/* Статы */}
            <div className="flex flex-wrap gap-6 justify-center md:justify-start mt-6">
              <Stat
                icon="📝"
                value={articles.length.toString()}
                label={articles.length === 1 ? 'статья' : articles.length < 5 ? 'статьи' : 'статей'}
              />
              {doctor.experience > 0 && (
                <Stat icon="🏥" value={`${doctor.experience}`} label="лет опыта" />
              )}
              {doctor.languages?.length > 0 && (
                <Stat icon="🌐" value={doctor.languages.join(', ')} label="языки" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ЛЕВАЯ ЧАСТЬ — статьи */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Статьи автора
              <span className="ml-3 text-base font-bold text-gray-400">
                {articles.length}
              </span>
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="text-4xl mb-3">✍️</div>
              <p className="font-bold text-gray-600 mb-1">Статьи готовятся</p>
              <p className="text-sm text-gray-400">Врач скоро опубликует первый материал</p>
            </div>
          ) : (
            <div className="space-y-5">
              {articles.map((article) => (
                <Link
                  key={article._id}
                  href={`/${lang}/blog/${article.slug}`}
                  className="group flex bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300"
                >
                  <div className="w-36 md:w-48 shrink-0 overflow-hidden">
                    <img
                      src={article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'}
                      alt={t(article.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Проверено врачом
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                        {t(article.title)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {t(article.overview)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <span className="text-xs text-gray-400">
                        {new Date(article.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition">
                        Читать →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ПРАВАЯ ЧАСТЬ — карточка врача */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">

            {/* О враче */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-extrabold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                О враче
              </h3>
              <div className="space-y-4">
                <InfoRow
                  icon="🏥"
                  label="Специализация"
                  value={specialtyLabel}
                />
                {doctor.experience > 0 && (
                  <InfoRow
                    icon="📅"
                    label="Стаж"
                    value={`${doctor.experience} лет`}
                  />
                )}
                {doctor.workplace && (
                  <InfoRow
                    icon="🏛️"
                    label="Место работы"
                    value={doctor.workplace}
                  />
                )}
                {doctor.education && (
                  <InfoRow
                    icon="🎓"
                    label="Образование"
                    value={doctor.education}
                  />
                )}
                {doctor.languages?.length > 0 && (
                  <InfoRow
                    icon="🌐"
                    label="Языки"
                    value={doctor.languages.join(', ')}
                  />
                )}
              </div>
            </div>

            {/* Последняя медицинская проверка */}
            {lastMedicalReviewDate && (
              <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-blue-800 text-sm">Медицинская проверка</p>
                    <p className="text-blue-600 text-xs mt-1 font-semibold">{lastMedicalReviewDate}</p>
                    <p className="text-blue-700/70 text-xs mt-1 leading-relaxed">
                      Контент проверен практикующим врачом
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Верификация */}
            <div className="bg-green-50 rounded-3xl p-5 border border-green-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-green-800 text-sm">Верифицированный автор</p>
                  <p className="text-green-700 text-xs mt-1 leading-relaxed">
                    Диплом и квалификация подтверждены командой Duxtur.com
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-2xl">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-extrabold text-white leading-none">{value}</p>
        <p className="text-blue-200 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
