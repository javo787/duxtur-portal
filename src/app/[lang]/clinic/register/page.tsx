import { Metadata } from 'next';
import RegisterClinicForm from './RegisterClinicForm';
import { T } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    // No " — Duxtur.org": the root layout's title template adds the site name.
    title: T('clinic.registerClinic', lang),
    // clinic.heroSubtitle is the pitch for clinics; home.heroSubtitle is about articles.
    description: T('clinic.heroSubtitle', lang),
    // Without its own alternates the page inherited the site-wide canonical (the home page).
    alternates: buildAlternates('clinic/register', lang),
  };
}

export default async function RegisterClinicPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <RegisterClinicForm lang={lang} />;
}
