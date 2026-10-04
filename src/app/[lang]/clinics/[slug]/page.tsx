import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getT, Locale } from '@/i18n';
import { buildAlternates, buildBreadcrumbJsonLd, BASE_URL } from '@/lib/seo';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { clinicSerif } from '@/lib/fonts';
import ClinicHero, { ClinicCover } from './_components/ClinicHero';
import ClinicPanel, { panelHasContent } from './_components/ClinicPanel';
import ClinicBody from './_components/ClinicBody';
import ClinicDock from './_components/ClinicDock';
import type { ClinicView } from './_components/shared';
import ClinicViewTracker from '@/components/ClinicViewTracker';
import HomeFooter from '@/components/home/HomeFooter';
import { cache } from 'react';
import { hasRealWorkingHours } from '@/lib/clinic-hours';
import { facebookHref } from '@/lib/social';
import { whatsappUrl } from '@/lib/clinic-display';

export const revalidate = 3600; // 1 hour

type LocalizedText = Partial<Record<string, string>>;
type WorkingHoursEntry = { open: string; close: string; isWorking?: boolean };
type ClinicDoctor = {
  name?: string;
  specialty?: string | Record<string, string>;
  slug?: string;
};

const getLocalizedText = (value: LocalizedText | undefined, lang: string): string => value?.[lang] || value?.ru || '';

const getClinic = cache(async (slug: string) => {
  await dbConnect();
  return Clinic.findOne({ slug, status: { $in: ['approved', 'pre_imported'] } })
    .populate('doctorIds', 'name image specialty slug experience reviewAvg reviewCount schedule consultationTypes')
    .lean();
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lang: string }> }): Promise<Metadata> {
  const { slug, lang } = (await params) as { slug: string; lang: Locale };
  const clinic = await getClinic(slug);
  const t = getT(lang);
  if (!clinic) return { title: t('clinic.notFound') };

  const name = getLocalizedText(clinic.name as LocalizedText | undefined, lang);
  const desc = getLocalizedText(clinic.description as LocalizedText | undefined, lang);

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
    clinic.doctorIds = (clinic.doctorIds as unknown[]).filter(Boolean);
  }

  // Ensure rating exists even if not in DB document (for lean)
  if (!clinic.rating) {
    clinic.rating = { avg: 0, count: 0 };
  }

  const t = getT(lang);
  const clinicName = getLocalizedText(clinic.name as LocalizedText | undefined, lang);
  const clinicDescription = getLocalizedText(clinic.description as LocalizedText | undefined, lang);

  // Build JSON-LD MedicalClinic schema
  let openingHours: string[] = [];
  const workingHoursRecord = clinic.workingHours as Record<string, WorkingHoursEntry | undefined> | undefined;

  // pre_imported clinics carry only schema defaults (08:00-18:00 every day): never publish them as real hours.
  if (hasRealWorkingHours(clinic) && workingHoursRecord) {
    openingHours = Object.entries(workingHoursRecord)
      .filter(([, v]) => v && v.isWorking)
      .map(([day, v]) => {
        const dayMap: Record<string, string> = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };
        const shortDay = day.toLowerCase().substring(0, 3);
        return dayMap[shortDay] ? `${dayMap[shortDay]} ${v!.open}-${v!.close}` : null;
      })
      .filter((v): v is string => v !== null);
  }

  const sameAs = [
    clinic.website,
    clinic.telegram && `https://t.me/${clinic.telegram.replace('@', '')}`,
    clinic.instagram && `https://instagram.com/${clinic.instagram.replace('@', '')}`,
    facebookHref(clinic.facebook),
    clinic.whatsapp && `https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`,
  ].filter(Boolean) as string[];

  const employeeEntries = (clinic.doctorIds as ClinicDoctor[] | undefined)?.map((doc) => ({
    '@type': 'Person',
    name: doc.name,
    jobTitle: (doc.specialty && typeof doc.specialty === 'object') ? (doc.specialty[lang] || doc.specialty.ru) : doc.specialty,
    url: `${BASE_URL}/${lang}/doctor/${doc.slug}`,
  }));

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: clinicName,
    description: clinicDescription,
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
                      clinic.city === 'Бишкек' ? 'KG' : 'TJ',
    },
    openingHours,
    // aggregateRating is only added if there are actual reviews (audit point 7)
    aggregateRating: clinic.rating?.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: clinic.rating.avg,
      reviewCount: clinic.rating.count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    sameAs,
    medicalSpecialty: clinic.specialties?.length ? clinic.specialties : undefined,
    employee: employeeEntries,
    breadcrumb: buildBreadcrumbJsonLd([
      { name: 'Duxtur.org', url: `/${lang}` },
      { name: t('clinic.title'), url: `/${lang}/clinics` },
      { name: clinicName, url: `/${lang}/clinics/${slug}` },
    ]),
    priceRange: '$$',
  };

  // Remove undefined fields
  Object.keys(jsonLd).forEach((key) => {
    if (jsonLd[key] === undefined) delete jsonLd[key];
  });

  const view = clinic as unknown as ClinicView;
  const doctors = (clinic.doctorIds as unknown[]) ?? [];
  const hasBooking = doctors.length > 0;
  const hasPanel = panelHasContent(view, hasBooking);
  const whatsappHref = clinic.whatsapp ? whatsappUrl(clinic.whatsapp) : null;

  return (
    <div className={`${clinicSerif.variable} min-h-screen bg-background text-foreground`}>
      <ClinicViewTracker slug={slug} />
      {/* dangerouslySetInnerHTML is safe here as jsonLd is a strictly constructed server-side object (audit point 12) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 text-sm md:px-8">
        <Link href={`/${lang}/clinics`} className="-ml-1 inline-flex items-center gap-1 text-foreground/70 hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('clinic.title')}
        </Link>
        <Link href={`/${lang}`} className="font-clinic text-base font-semibold">
          duxtur<span className="text-primary">.org</span>
        </Link>
      </nav>

      <ClinicCover clinic={view} />

      <main className={`mx-auto max-w-6xl px-4 md:px-8 ${hasPanel ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-14' : ''}`}>
        <ClinicHero clinic={view} lang={lang} />
        {hasPanel && <ClinicPanel clinic={view} lang={lang} hasBooking={hasBooking} />}
        <ClinicBody clinic={view} lang={lang} doctors={doctors} />
      </main>

      <ClinicDock
        phone={clinic.phone || undefined}
        whatsappHref={whatsappHref}
        hasBooking={hasBooking}
        labels={{ book: t('clinic.book'), call: t('clinic.call') }}
      />
      <HomeFooter lang={lang} />
    </div>
  );
}
