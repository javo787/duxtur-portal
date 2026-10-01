import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { assertAdminPage } from '@/lib/admin-content/guard';
import { DOCTOR_STATUSES } from '@/lib/admin-content/doctor-form';
import AdminShell, { Banner, StatusBadge, STATUS_LABELS } from '../_shared/AdminShell';
import { inputCls } from '../_shared/FormBits';

const PAGE_SIZE = 40;
interface Row { _id: string; name?: string; status?: string; city?: string; clinicName?: string; specialty?: { ru?: string }; phone?: string; image?: string }

export default async function DoctorsAdminPage({
  params, searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; saved?: string; deleted?: string }>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  await assertAdminPage(lang);

  const q = (sp.q ?? '').trim().slice(0, 80);
  const status = (DOCTOR_STATUSES as readonly string[]).includes(sp.status ?? '') ? sp.status : '';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  await dbConnect();
  const [rows, total] = await Promise.all([
    Doctor.find(filter).select('name status city clinicName specialty.ru phone image').sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean<Row[]>(),
    Doctor.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`;

  return (
    <AdminShell
      lang={lang}
      active="doctors"
      title={`Врачи (${total})`}
      action={<Link href={`/${lang}/admin/portal/doctors/new`} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-sm">＋ Создать врача</Link>}
    >
      {sp.saved && <Banner kind="ok">Сохранено</Banner>}
      {sp.deleted && <Banner kind="ok">Врач удалён</Banner>}

      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Поиск по имени…" className={`${inputCls} max-w-xs`} />
        <select name="status" defaultValue={status} className={`${inputCls} max-w-[220px]`}>
          <option value="">Все статусы</option>
          {DOCTOR_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm">Найти</button>
      </form>

      <div className="border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
            <tr><th className="text-left p-3">Врач</th><th className="text-left p-3 hidden md:table-cell">Специальность</th><th className="text-left p-3 hidden md:table-cell">Клиника</th><th className="text-left p-3">Статус</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Ничего не найдено</td></tr>}
            {rows.map(r => (
              <tr key={String(r._id)} className="hover:bg-gray-900/50">
                <td className="p-3 font-semibold">{r.name || '—'}<div className="text-[11px] text-gray-600 font-normal">{r.city}</div></td>
                <td className="p-3 hidden md:table-cell text-gray-400">{r.specialty?.ru || '—'}</td>
                <td className="p-3 hidden md:table-cell text-gray-400">{r.clinicName || '—'}</td>
                <td className="p-3"><StatusBadge status={r.status ?? 'pending'} /></td>
                <td className="p-3 text-right"><Link href={`/${lang}/admin/portal/doctors/${String(r._id)}`} className="text-blue-400 hover:underline">Править</Link></td>
              </tr>
            ))}
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
