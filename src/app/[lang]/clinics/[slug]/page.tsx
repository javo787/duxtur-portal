import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getT, Locale } from '@/i18n';
import { BASE_URL, buildAlternates, ogAlternateLocales, ogLocale, safeJsonLd } from '@/lib/seo';
import {
  buildClinicDescription,
  buildClinicJsonLd,
  buildClinicTitle,
  clinicIndexability,
  clinicName,
  OG_IMAGE_SIZE,
  ogImageUrl,
  type ClinicSeoDoctor,
  type ClinicSeoInput,
} from '@/lib/clinic-seo';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Source_Serif_4 } from 'next/font/google';
import ClinicHero, { ClinicCover } from './_components/ClinicHero';
import ClinicPanel, { panelHasContent } from './_components/ClinicPanel';
import ClinicBody from './_components/ClinicBody';
import ClinicDock from './_components/ClinicDock';
import type { ClinicView } from './_components/shared';
import ClinicViewTracker from '@/components/ClinicViewTracker';
import HomeFooter from '@/components/home/HomeFooter';
import { cache } from 'react';
import { whatsappUrl } from '@/lib/clinic-display';

export const revalidate = 3600; // 1 hour

// Display face for clinic pages. Fraunces has no Cyrillic, so ru/tg/kk/ky headings fell back to a system serif.
const clinicSerif = Source_Serif_4({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-clinic-serif',
  display: 'swap',
  axes: ['opsz'],
});

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
  if (!clinic) return { title: t('clinic.notFound'), robots: { index: false, follow: false } };

  const seo = clinic as unknown as ClinicSeoInput;
  const name = clinicName(seo, lang);
  // No " | Duxtur.org" here: the root layout's title template already appends it.
  const title = buildClinicTitle(seo, lang, t);
  const { text: description } = buildClinicDescription(seo, lang, t);
  const { index } = clinicIndexability(seo);
  const alternates = buildAlternates(`clinics/${slug}`, lang);
  const image = ogImageUrl(seo.coverImage || seo.logo);
  const preview = image
    ? {
        url: image.url,
        alt: name,
        ...(image.transformed ? OG_IMAGE_SIZE : {}),
      }
    : { url: `${BASE_URL}/og-default.png`, width: 1424, height: 752, alt: name };

  return {
    title,
    description,
    // Unclaimed imports without text of their own stay out of the index, but their links are still followed.
    ...(index ? {} : { robots: { index: false, follow: true } }),
    alternates,
    // A page-level openGraph replaces the root one entirely, so siteName and locale must be repeated here.
    openGraph: {
      type: 'website',
      siteName: 'Duxtur.org',
      title: `${title} | Duxtur.org`,
      description,
      url: alternates.canonical,
      locale: ogLocale(lang),
      alternateLocale: ogAlternateLocales(lang),
      images: [preview],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Duxtur.org`,
      description,
      images: [preview.url],
    },
  };
}

export default async function ClinicProfilePage({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  const { slug, lang } = (await params) as { slug: string; lang: Locale };
  const clinic = await getClinic(slug);

  if (!clinic) notFound();

  // Filter out any potential null doctor references (audit point 11)
  const doctors = ((clinic.doctorIds as unknown[] | undefined) ?? []).filter(Boolean);

  const t = getT(lang);

  // One @graph: clinic (+ branches), the page about it and the breadcrumb. Built and unit-tested in lib/clinic-seo.
  const jsonLd = buildClinicJsonLd({
    clinic: clinic as unknown as ClinicSeoInput,
    lang,
    t,
    doctors: doctors as ClinicSeoDoctor[],
  });

  // Rating defaults to 0/0 when the document has none (lean documents skip schema defaults).
  const view = { ...clinic, rating: clinic.rating ?? { avg: 0, count: 0 } } as unknown as ClinicView;
  const hasBooking = doctors.length > 0;
  const hasPanel = panelHasContent(view, hasBooking);
  const whatsappHref = view.whatsapp ? whatsappUrl(view.whatsapp) : null;

  return (
    <div className={`${clinicSerif.variable} min-h-screen bg-background text-foreground`}>
      <ClinicViewTracker slug={slug} />
      {/* safeJsonLd escapes "<", so a clinic name containing "</script>" cannot break out of the tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 text-sm md:px-8">
        <Link href={`/${lang}/clinics`} className="-ml-1 inline-flex items-center gap-1 text-foreground/70 hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('clinic.title')}
        </Link>
        <Link href={`/${lang}`} className="font-clinic text-base font-semibold">
          duxtur<span className="text-primary">.org</span>
        </Link>
      </nav>

      <ClinicCover clinic={view} lang={lang} />

      <main className={`mx-auto max-w-6xl px-4 md:px-8 ${hasPanel ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-14' : ''}`}>
        <ClinicHero clinic={view} lang={lang} />
        {hasPanel && <ClinicPanel clinic={view} lang={lang} hasBooking={hasBooking} />}
        <ClinicBody clinic={view} lang={lang} doctors={doctors} />
      </main>

      <ClinicDock
        phone={view.phone || undefined}
        whatsappHref={whatsappHref}
        hasBooking={hasBooking}
        labels={{ book: t('clinic.book'), call: t('clinic.call') }}
      />
      <HomeFooter lang={lang} />
    </div>
  );
}
