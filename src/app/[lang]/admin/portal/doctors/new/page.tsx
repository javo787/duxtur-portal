import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { assertAdminPage } from '@/lib/admin-content/guard';
import AdminShell, { Banner } from '../../_shared/AdminShell';
import DoctorForm, { type ClinicOption } from '../_components/DoctorForm';

export default async function NewDoctorPage({
  params, searchParams,
}: { params: Promise<{ lang: string }>; searchParams: Promise<{ error?: string }> }) {
  const { lang } = await params;
  const { error } = await searchParams;
  await assertAdminPage(lang);
  await dbConnect();
  const clinics = JSON.parse(JSON.stringify(await Clinic.find({}).select('name.ru city').sort({ 'name.ru': 1 }).limit(500).lean())) as ClinicOption[];
  return (
    <AdminShell lang={lang} active="doctors" title="Новый врач">
      {error && <Banner kind="error">{error}</Banner>}
      <DoctorForm lang={lang} id="new" clinics={clinics} />
    </AdminShell>
  );
}
