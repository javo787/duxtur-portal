import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getT, Locale } from '@/i18n';
import { buildAlternates, buildBreadcrumbJsonLd, BASE_URL } from '@/lib/seo';
import ClinicHero from './_components/ClinicHero';
import ClinicTabs from './_components/ClinicTabs';
import ClinicViewTracker from '@/components/ClinicViewTracker';
import HomeFooter from '@/components/home/HomeFooter';
import { cache } from 'react';

export const revalidate = 3600; // 1 hour

const getClinic = cache(async (slug: string) => {
  await dbConnect();
  return Clinic.findOne({ slug, status: { $in: ['approved', 'pre_imported'] } })
    .populate('doctorIds', 'name image specialty slug experience reviewAvg reviewCount')
    .lean();
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lang: string }> }): Promise<Metadata> {
  const { slug, lang } = (await params) as { slug: string; lang: Locale };
  const clinic = await getClinic(slug);
  const t = getT(lang);
  if (!clinic) return { title: t('clinic.notFound') };

  const name = (clinic.name as any)[lang] || (clinic.name as any).ru;
  const desc = (clinic.description as any)[lang] || (clinic.description as any).ru || '';

  return {
    title: `${name} — ${t('clinic.type_' + clinic.type)} | Duxtur.org`,
    description: desc.substring(0, 160),
    alternates: buildAlternates(`clinics/${slug}`, lang),
    openGraph: {
      type: 'website',
      images: [clinic.coverImage || clinic.logo || `${BASE_URL}/og-default.png`],
    },
  };
}

export default async function ClinicProfilePage({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  const { slug, lang } = (await params) as { slug: string; lang: Locale };
  const clinic = await getClinic(slug);

  if (!clinic) notFound();

  // Filter out any potential null doctor references (audit point 11)
  if (clinic.doctorIds) {
    clinic.doctorIds = (clinic.doctorIds as any[]).filter(Boolean);
  }

  // Ensure rating exists even if not in DB document (for lean)
  if (!clinic.rating) {
    clinic.rating = { avg: 0, count: 0 };
  }

  const t = getT(lang);

  // Build JSON-LD MedicalClinic schema
  let openingHours: string[] = [];
  if (clinic.workingHours && typeof clinic.workingHours === 'object' && !Array.isArray(clinic.workingHours)) {
    openingHours = Object.entries(clinic.workingHours)
      .filter(([_, v]: any) => v && v.isWorking)
      .map(([day, v]: any) => {
        const dayMap: Record<string, string> = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };
        const shortDay = day.toLowerCase().substring(0, 3);
        return dayMap[shortDay] ? `${dayMap[shortDay]} ${v.open}-${v.close}` : null;
      })
      .filter((v): v is string => v !== null);
  }

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: (clinic.name as any)[lang] || (clinic.name as any).ru,
    description: (clinic.description as any)?.[lang] || (clinic.description as any)?.ru,
    url: `${BASE_URL}/${lang}/clinics/${slug}`,
    logo: clinic.logo,
    image: clinic.coverImage || clinic.logo,
    telephone: clinic.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address,
      addressLocality: clinic.city,
      addressCountry: clinic.city === 'Ташкент' || clinic.city === 'Самарканд' ? 'UZ' :
                      clinic.city === 'Алматы' || clinic.city === 'Астана' ? 'KZ' :
                      clinic.city === 'Бишкек' ? 'KG' : 'TJ'
    },
    openingHours,
    // aggregateRating is only added if there are actual reviews (audit point 7)
    aggregateRating: clinic.rating?.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: clinic.rating.avg,
      reviewCount: clinic.rating.count,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    sameAs: [
      clinic.website,
      clinic.telegram && `https://t.me/${clinic.telegram.replace('@', '')}`,
      clinic.instagram && `https://instagram.com/${clinic.instagram.replace('@', '')}`,
      clinic.whatsapp && `https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`
    ].filter(Boolean),
    medicalSpecialty: clinic.specialties?.length ? clinic.specialties : undefined,
    employee: (clinic.doctorIds as any[])?.map((doc: any) => ({
      '@type': 'Person',
      name: doc.name,
      jobTitle: (doc.specialty && typeof doc.specialty === 'object') ? (doc.specialty[lang] || doc.specialty.ru) : doc.specialty,
      url: `${BASE_URL}/${lang}/doctor/${doc.slug}`,
    })),
    breadcrumb: buildBreadcrumbJsonLd([
      { name: 'Duxtur.org', url: `/${lang}` },
      { name: t('clinic.title'), url: `/${lang}/clinics` },
      { name: (clinic.name as any)[lang] || (clinic.name as any).ru, url: `/${lang}/clinics/${slug}` },
    ]),
    priceRange: '$$',
  };

  // Remove undefined fields
  Object.keys(jsonLd).forEach(k => (jsonLd as any)[k] === undefined && delete (jsonLd as any)[k]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <ClinicViewTracker slug={slug} />
      {/* dangerouslySetInnerHTML is safe here as jsonLd is a strictly constructed server-side object (audit point 12) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ClinicHero clinic={clinic} lang={lang} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <ClinicTabs clinic={clinic} lang={lang} />
      </div>
      <HomeFooter lang={lang} />
    </div>
  );
}
