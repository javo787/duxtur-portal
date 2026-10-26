import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { assertStaffPage } from '@/lib/admin-content/guard';
import {
  AUDIT_ACTIONS, AUDIT_ENTITY_LABELS, AUDIT_ENTITY_TYPES, auditEntityHref, isAuditAction,
} from '@/lib/admin-moderation';
import AdminShell from '../_shared/AdminShell';
import { inputCls } from '../_shared/FormBits';

const PAGE_SIZE = 50;

interface Row {
  _id: string; actorEmail?: string; actorRole?: string; action: string; entityType: string; entityId: string;
  entityLabel?: string; meta?: Record<string, unknown>; createdAt: Date;
}

const when = (d: Date) => new Date(d).toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe', dateStyle: 'short', timeStyle: 'short' });

export default async function AuditPage({
  params, searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ type?: string; action?: string; q?: string; page?: string }>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  const staff = await assertStaffPage(lang);

  const type = (AUDIT_ENTITY_TYPES as readonly string[]).includes(sp.type ?? '') ? sp.type : '';
  const action = isAuditAction(sp.action) ? sp.action : '';
  const q = (sp.q ?? '').trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  // a manager reads only their own actions
  const filter: Record<string, unknown> = staff.role === 'portal_admin' ? {} : { actorId: staff.userId };
  if (type) filter.entityType = type;
  if (action) filter.action = action;
  if (q) filter.entityLabel = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  await dbConnect();
  const [rows, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean<Row[]>(),
    AuditLog.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(type && { type }), ...(action && { action }), ...(q && { q }), page: String(p) })}`;

  return (
    <AdminShell lang={lang} active="audit" role={staff.role} title={`Журнал действий (${total})`}>
      <p className="text-sm text-gray-500 -mt-2">
        Записываются изменения, сделанные в админке: одобрения, отказы с причиной, блокировки, скрытие отзывов, удаления и восстановления.
        Время указано по Душанбе.
      </p>

      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Поиск по названию или имени…" className={`${inputCls} max-w-xs`} />
        <select name="type" defaultValue={type} className={`${inputCls} max-w-[180px]`}>
          <option value="">Все объекты</option>
          {AUDIT_ENTITY_TYPES.map(t => <option key={t} value={t}>{AUDIT_ENTITY_LABELS[t]}</option>)}
        </select>
        <select name="action" defaultValue={action} className={`${inputCls} max-w-[260px]`}>
          <option value="">Все действия</option>
          {Object.entries(AUDIT_ACTIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm">Найти</button>
      </form>

      <div className="border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Когда</th>
              <th className="text-left p-3">Кто</th>
              <th className="text-left p-3">Что сделано</th>
              <th className="text-left p-3">Над чем</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Записей пока нет</td></tr>}
            {rows.map(r => {
              const href = auditEntityHref(r.entityType, r.entityId, lang);
              const reason = typeof r.meta?.reason === 'string' ? r.meta.reason : '';
              const label = r.entityLabel || '—';
              return (
                <tr key={String(r._id)} className="align-top hover:bg-gray-900/50">
                  <td className="p-3 whitespace-nowrap text-gray-400">{when(r.createdAt)}</td>
                  <td className="p-3 text-gray-300 break-all">{r.actorEmail || '—'}{r.actorRole === 'portal_manager' && <span className="ml-2 text-[10px] uppercase bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">менеджер</span>}</td>
                  <td className="p-3">
                    <div className="font-semibold">{isAuditAction(r.action) ? AUDIT_ACTIONS[r.action] : r.action}</div>
                    {reason && <div className="text-xs text-gray-500 mt-1 whitespace-pre-line break-words max-w-xs">Причина: {reason}</div>}
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] text-gray-500 mr-2">{AUDIT_ENTITY_LABELS[r.entityType as keyof typeof AUDIT_ENTITY_LABELS] ?? r.entityType}</span>
                    {href ? <Link href={href} className="text-blue-400 hover:underline">{label}</Link> : <span>{label}</span>}
                  </td>
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
