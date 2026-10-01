import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { assertAdminPage } from '@/lib/admin-content/guard';
import AdminShell, { Banner, StatusBadge } from '../../_shared/AdminShell';
import ClinicForm, { type ClinicDoc } from '../_components/ClinicForm';

export default async function EditClinicPage({
  params, searchParams,
}: { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { lang, id } = await params;
  const { error } = await searchParams;
  await assertAdminPage(lang);
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();

  await dbConnect();
  const raw = await Clinic.findById(id).lean();
  if (!raw) notFound();
  // Plain JSON copy: ObjectId/Date values can't be passed through server-component props as-is.
  const clinic = JSON.parse(JSON.stringify(raw)) as ClinicDoc;

  return (
    <AdminShell
      lang={lang}
      active="clinics"
      title={clinic.name?.ru || 'Клиника'}
      action={<StatusBadge status={clinic.status ?? 'pending'} />}
    >
      {error && <Banner kind="error">{error}</Banner>}
      <ClinicForm lang={lang} id={id} clinic={clinic} />
    </AdminShell>
  );
}
