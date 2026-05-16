import SignupForm from './SignupForm';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Регистрация пациента | Duxtur.org',
    robots: { index: false },
    alternates: buildAlternates('signup', lang),
  };
}

export default async function SignupPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SignupForm lang={lang} />;
}
