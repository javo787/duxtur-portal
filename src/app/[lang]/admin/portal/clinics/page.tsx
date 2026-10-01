import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import { assertAdminPage } from '@/lib/admin-content/guard';
import { clinicCompleteness, CLINIC_STATUSES } from '@/lib/admin-content/clinic-form';
import { hasRealWorkingHours } from '@/lib/clinic-hours';
import AdminShell, { Banner, StatusBadge, STATUS_LABELS } from '../_shared/AdminShell';
import { inputCls } from '../_shared/FormBits';

const PAGE_SIZE = 40;

interface Row {
  _id: string; status?: string; importSource?: string; city?: string; phone?: string; website?: string;
  address?: string; logo?: string; name?: { ru?: string }; description?: { ru?: string };
  specialties?: string[]; coordinates?: { lat?: number | null };
  workingHours?: Record<string, { open: string; close: string; isWorking: boolean }>;
}

export default async function ClinicsAdminPage({
  params, searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; saved?: string; deleted?: string }>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  await assertAdminPage(lang);

  const q = (sp.q ?? '').trim().slice(0, 80);
  const status = (CLINIC_STATUSES as readonly string[]).includes(sp.status ?? '') ? sp.status : '';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) filter['name.ru'] = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  await dbConnect();
  const [rows, total] = await Promise.all([
    Clinic.find(filter)
      .select('name.ru status importSource city phone website address logo description.ru specialties coordinates.lat workingHours')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean<Row[]>(),
    Clinic.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`;

  return (
    <AdminShell
      lang={lang}
      active="clinics"
      title={`Клиники (${total})`}
      action={<Link href={`/${lang}/admin/portal/clinics/new`} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-sm">＋ Создать клинику</Link>}
    >
      {sp.saved && <Banner kind="ok">Сохранено</Banner>}
      {sp.deleted && <Banner kind="ok">Клиника удалена</Banner>}

      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Поиск по названию…" className={`${inputCls} max-w-xs`} />
        <select name="status" defaultValue={status} className={`${inputCls} max-w-[220px]`}>
          <option value="">Все статусы</option>
          {CLINIC_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm">Найти</button>
      </form>

      <div className="border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
            <tr><th className="text-left p-3">Клиника</th><th className="text-left p-3 hidden md:table-cell">Город</th><th className="text-left p-3">Статус</th><th className="text-left p-3">Заполнено</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Ничего не найдено</td></tr>}
            {rows.map(r => {
              const id = String(r._id);
              const comp = clinicCompleteness({
                phone: r.phone, website: r.website, logo: r.logo, description: r.description, specialties: r.specialties,
                coordinates: r.coordinates, address: r.address,
                hoursFilled: hasRealWorkingHours({ status: r.status, workingHours: r.workingHours as never }) && !!r.workingHours,
              });
              const pct = Math.round((comp.done / comp.total) * 100);
              return (
                <tr key={id} className="hover:bg-gray-900/50">
                  <td className="p-3 font-semibold">{r.name?.ru || '—'}<div className="text-[11px] text-gray-600 font-normal">{r.importSource}</div></td>
                  <td className="p-3 hidden md:table-cell text-gray-400">{r.city || '—'}</td>
                  <td className="p-3"><StatusBadge status={r.status ?? 'pending'} /></td>
                  <td className="p-3" title={comp.missing.length ? `Не хватает: ${comp.missing.join(', ')}` : 'Всё заполнено'}>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className={`h-full ${pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-gray-400">{comp.done}/{comp.total}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right"><Link href={`/${lang}/admin/portal/clinics/${id}`} className="text-blue-400 hover:underline">Править</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          {page > 1 && <Link href={qs(page - 1)} className="text-blue-400">← Назад</Link>}
          <span className="text-gray-500">{page} / {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className="text-blue-400">Вперёд →</Link>}
        </div>
      )}
    </AdminShell>
  );
}
