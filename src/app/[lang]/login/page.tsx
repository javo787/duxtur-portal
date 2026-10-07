import LoginForm from './LoginForm';
import { eduReturnPath } from '@/lib/edu-return';
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

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { lang } = await params;
  // Coming from Duxtur Edu ("Sign in with e-mail"): after signing in the person goes back there.
  const back = eduReturnPath((await searchParams).next);
  return <LoginForm lang={lang} back={back} />;
}
