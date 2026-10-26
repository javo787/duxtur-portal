import AdminShell, { Banner } from '../../_shared/AdminShell';
import { assertStaffPage } from '@/lib/admin-content/guard';
import ClinicForm from '../_components/ClinicForm';

export default async function NewClinicPage({
  params, searchParams,
}: { params: Promise<{ lang: string }>; searchParams: Promise<{ error?: string }> }) {
  const { lang } = await params;
  const { error } = await searchParams;
  const staff = await assertStaffPage(lang);
  return (
    <AdminShell lang={lang} active="clinics" role={staff.role} title="Новая клиника">
      {error && <Banner kind="error">{error}</Banner>}
      <ClinicForm lang={lang} id="new" />
    </AdminShell>
  );
}
