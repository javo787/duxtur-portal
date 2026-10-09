import SignupForm from './SignupForm';
import { returnPath } from '@/lib/return-path';
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

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { lang } = await params;
  // Coming from Duxtur Edu ("Sign in with e-mail"): after signing in the person goes back there.
  const back = returnPath((await searchParams).next);
  return <SignupForm lang={lang} back={back} />;
}
