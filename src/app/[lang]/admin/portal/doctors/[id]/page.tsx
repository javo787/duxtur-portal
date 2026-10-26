import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Doctor from '@/models/Doctor';
import { assertStaffPage } from '@/lib/admin-content/guard';
import { checkAccess } from '@/lib/admin-scope';
import AdminShell, { Banner, StatusBadge } from '../../_shared/AdminShell';
import DoctorForm, { type ClinicOption, type DoctorDoc } from '../_components/DoctorForm';

export default async function EditDoctorPage({
  params, searchParams,
}: { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { lang, id } = await params;
  const { error } = await searchParams;
  const staff = await assertStaffPage(lang);
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  // a manager opens only the doctors they manage
  const access = await checkAccess(staff, 'edit', 'doctor', id);
  if (!access.ok) redirect(`/${lang}/admin/portal/doctors?error=${encodeURIComponent(access.error)}`);

  await dbConnect();
  const [raw, clinicsRaw] = await Promise.all([
    Doctor.findById(id).lean(),
    Clinic.find({}).select('name.ru city').sort({ 'name.ru': 1 }).limit(500).lean(),
  ]);
  if (!raw) notFound();
  const doctor = JSON.parse(JSON.stringify(raw)) as DoctorDoc;
  const clinics = JSON.parse(JSON.stringify(clinicsRaw)) as ClinicOption[];

  return (
    <AdminShell lang={lang} active="doctors" role={staff.role} title={doctor.name || 'Врач'} action={<StatusBadge status={doctor.status ?? 'pending'} />}>
      {error && <Banner kind="error">{error}</Banner>}
      <DoctorForm lang={lang} id={id} doctor={doctor} clinics={clinics} />
    </AdminShell>
  );
}
