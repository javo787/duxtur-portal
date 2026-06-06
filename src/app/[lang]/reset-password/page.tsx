import ResetPasswordForm from './ResetPasswordForm';
import type { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';
import { Suspense } from 'react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Сброс пароля | Duxtur.org',
    robots: { index: false },
    alternates: buildAlternates('reset-password', lang),
  };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Декоративные круги */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/50 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-extrabold text-slate-900">
            duxtur<span className="text-blue-600">.org</span>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
          <div className="h-[3px] brand-line" />
          <div className="p-8">
            <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-6">Сброс пароля</h1>
            <Suspense fallback={<div className="text-center p-4">Загрузка...</div>}>
              <ResetPasswordForm lang={lang} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
