import RegisterForm from './RegisterForm';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Регистрация врача | Duxtur.org',
    robots: { index: false },
    alternates: buildAlternates('register', lang),
  };
}

export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <RegisterForm lang={lang} />;
}
