import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import type { Metadata } from 'next';
import { buildAlternates, buildBreadcrumbJsonLd } from '@/lib/seo';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';
import UI from '@/dictionaries/doctor-translations';
import { getT } from '@/i18n';
import DoctorsPageContent from './_components/DoctorsPageContent';

// Helper function to determine the best index to use based on query and sort
function determineBestIndex(query: any, sort: any): any {
  // If we have a geospatial query, use the 2dsphere index
  if (query.coordinates?. $geoWithin) {
    return { 'coordinates.coordinates': '2dsphere' };
  }

  // If sorting by rating, use the review index
  if (sort.reviewAvg || sort.reviewCount) {
    return { reviewAvg: -1, reviewCount: -1 };
  }

  // If sorting by price, use the price index
  if (sort['priceRange.min']) {
    return { 'priceRange.min': 1 };
  }

  // If sorting by experience, use the experience index
  if (sort.experience) {
    return { experience: -1 };
  }

  // If filtering by city, use the city index
  if (query.city) {
    return { city: 1 };
  }

  // If filtering by specialty, use the specialty index
  if (query['specialty.ru']) {
    return { 'specialty.ru': 1 };
  }

  // Default to createdAt index for newest first
  return { createdAt: -1 };
}

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const sp = await searchParams;
  const city = sp.city as string | undefined;
  const specialty = sp.specialty as string | undefined;

  let title = UI.title[lang] || UI.title.ru;
  if (specialty && CATEGORY_LABELS[specialty]) {
    const specLabel = CATEGORY_LABELS[specialty][lang] || CATEGORY_LABELS[specialty].ru;
    title = `${specLabel}`;
  }
  if (city) title += ` ${lang === 'ru' ? 'в ' : ''}${city}`;
  return {
    title: `${title} — Duxtur.org`,
    description: UI.subtitle[lang] || UI.subtitle.ru,
    alternates: buildAlternates('doctors', lang),
  };
}

export default async function DoctorsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  const t = getT(lang);

  await dbConnect();

  // Получаем список городов для фильтра
  const cities: string[] = await Doctor.distinct('city', { status: 'approved' });

  // Формируем query
  const query: any = { status: 'approved' };

  // Гео-поиск — $geoWithin вместо $near (не требует сортировки)
  if (sp.lat && sp.lng) {
    const lat = parseFloat(sp.lat as string);
    const lng = parseFloat(sp.lng as string);
    const radiusKm = parseFloat((sp.radius as string) || '20');
    const earthRadiusKm = 6371;
    query['coordinates'] = {
      $geoWithin: {
        $centerSphere: [
          [lng, lat],
          radiusKm / earthRadiusKm, // радиус в радианах
        ],
      },
    };
  }

  if (sp.city) query.city = new RegExp(sp.city as string, 'i');
  if (sp.specialty)
    query['specialty.ru'] = CATEGORY_LABELS[sp.specialty as string]?.ru || sp.specialty;
  if (sp.type) query.consultationTypes = sp.type;
  if (sp.accepts === 'true') query.acceptsNewPatients = true;
  if (sp.priceMin || sp.priceMax) {
    query['priceRange.min'] = { $gte: parseInt((sp.priceMin as string) || '0') };
    if (sp.priceMax) query['priceRange.max'] = { $lte: parseInt(sp.priceMax as string) };
  }
  if (sp.exp) {
    const minExp = parseInt(sp.exp as string);
    if (!isNaN(minExp)) query.experience = { $gte: minExp };
  }
  if (sp.lang_spoken) {
    const selectedLangs = Array.isArray(sp.lang_spoken) ? sp.lang_spoken : [sp.lang_spoken];
    query.languages = { $in: selectedLangs };
  }

  // Сортировка
  let sort: any = { createdAt: -1 };
  if (sp.sort === 'rating') sort = { reviewAvg: -1, reviewCount: -1 };
  if (sp.sort === 'price_asc') sort = { 'priceRange.min': 1 };
  if (sp.sort === 'price_desc') sort = { 'priceRange.min': -1 };
  if (sp.sort === 'exp') sort = { experience: -1 };

  const page = parseInt((sp.page as string) || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .sort(sort)
      .hint(determineBestIndex(query, sort))
      .skip(skip)
      .limit(limit)
      .select('name specialty experience city image slug status reviewAvg reviewCount priceRange consultationTypes')
      .lean(),
    Doctor.countDocuments(query).hint({ _id: 1 }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Хлебные крошки для JSON-LD
  const breadcrumbItems = [
    { name: 'Duxtur.org', url: `/${lang}` },
    { name: UI.title[lang] || UI.title.ru, url: `/${lang}/doctors` },
  ];
  if (sp.specialty && CATEGORY_LABELS[sp.specialty as string]) {
    breadcrumbItems.push({
      name: CATEGORY_LABELS[sp.specialty as string][lang] || CATEGORY_LABELS[sp.specialty as string].ru,
      url: `/${lang}/doctors/${sp.specialty}`,
    });
  }
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);

  // Передаём данные в клиентский компонент
  return (
    <DoctorsPageContent
      lang={lang}
      searchParams={sp}
      doctors={JSON.parse(JSON.stringify(doctors))}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      cities={cities}
      breadcrumbJsonLd={breadcrumbJsonLd}
    />
  );
}
