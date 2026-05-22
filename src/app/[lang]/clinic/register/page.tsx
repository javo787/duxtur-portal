import { Metadata } from 'next';
import RegisterClinicForm from './RegisterClinicForm';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Регистрация клиники — Duxtur.org',
    description: 'Зарегистрируйте вашу клинику на портале Duxtur.org',
  };
}

export default async function RegisterClinicPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <RegisterClinicForm lang={lang} />;
}
