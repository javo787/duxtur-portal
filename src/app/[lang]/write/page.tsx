import type { Metadata } from 'next';
import AuthorStudio from './AuthorStudio';

export const metadata: Metadata = {
  title: 'Кабинет автора | Duxtur.org',
  robots: { index: false, follow: false },
};

export default async function WritePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <AuthorStudio lang={lang} />;
}
