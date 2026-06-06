import ForgotPasswordForm from './ForgotPasswordForm';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Восстановление пароля | Duxtur.org',
    robots: { index: false },
    alternates: buildAlternates('forgot-password', lang),
  };
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <ForgotPasswordForm lang={lang} />;
}
