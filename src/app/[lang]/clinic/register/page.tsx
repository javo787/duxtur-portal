import { Metadata } from 'next';
import RegisterClinicForm from './RegisterClinicForm';
import { T } from '@/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: `${T('clinic.registerClinic', lang)} — Duxtur.org`,
    description: T('home.heroSubtitle', lang), // Using subtitle as a high-quality description
  };
}

export default async function RegisterClinicPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <RegisterClinicForm lang={lang} />;
}
