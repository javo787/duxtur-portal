import LoginForm from './LoginForm';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Вход в кабинет | Duxtur.org',
    robots: { index: false },
    alternates: buildAlternates('login', lang),
  };
}

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <LoginForm lang={lang} />;
}
