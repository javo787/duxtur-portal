import type { Metadata } from 'next';
import { T } from '@/i18n';
import { buildPageUrl } from '@/lib/seo';

// The page itself is a client component and cannot export metadata. Without this it had the site-wide
// default title and, until the root canonical was removed, a canonical pointing at the home page.
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: `${T('doctors.title', lang)} — ${T('doctors.mapView', lang)}`,
    description: T('doctors.subtitle', lang),
    // A client-only map: there is no text for a crawler to read, so it stays out of the index (and out of the
    // sitemap). The links on it can still be followed.
    robots: { index: false, follow: true },
    alternates: { canonical: buildPageUrl(lang, 'doctors/map') },
  };
}

export default function DoctorsMapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
