import dbConnect from '@/lib/mongodb';
import TrashItem from '@/models/TrashItem';
import { assertStaffPage } from '@/lib/admin-content/guard';
import { AUDIT_ENTITY_LABELS, TRASH_RETENTION_DAYS, trashDaysLeft } from '@/lib/admin-moderation';
import { purgeFromTrash, restoreFromTrash } from '@/app/actions/admin-trash';
import { ActionBtn } from '@/app/[lang]/admin/_components/ActionBtn';
import AdminShell from '../_shared/AdminShell';

interface Row {
  _id: string; entityType: string; label?: string; deletedByEmail?: string; deletedAt: Date; expiresAt: Date;
}

const when = (d: Date) => new Date(d).toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe', dateStyle: 'short', timeStyle: 'short' });

export default async function TrashPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const staff = await assertStaffPage(lang);

  await dbConnect();
  // The snapshots themselves are heavy and not needed to draw the list
  const rows = await TrashItem.find(staff.role === 'portal_admin' ? {} : { deletedById: staff.userId })
    .select('entityType label deletedByEmail deletedAt expiresAt')
    .sort({ deletedAt: -1 })
    .limit(200)
    .lean<Row[]>();

  return (
    <AdminShell lang={lang} active="trash" role={staff.role} title={`Корзина (${rows.length})`}>
      <p className="text-sm text-gray-500 -mt-2">
        Удалённое хранится {TRASH_RETENTION_DAYS} дней и потом исчезает само, вместе с копией аккаунта.
        «Восстановить» возвращает запись и всё, что удалялось вместе с ней (статьи врача, связь врача с клиникой).
        «Стереть» удаляет копию сразу, это уже нельзя отменить.
      </p>

      <div className="space-y-3">
        {rows.length === 0 && (
          <div className="border border-gray-800 rounded-2xl p-8 text-center text-gray-500">Корзина пуста</div>
        )}
        {rows.map(r => {
          const id = String(r._id);
          const days = trashDaysLeft(r.expiresAt);
          return (
            <div key={id} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                    {AUDIT_ENTITY_LABELS[r.entityType as keyof typeof AUDIT_ENTITY_LABELS] ?? r.entityType}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${days <= 3 ? 'bg-red-900/50 text-red-300' : 'bg-gray-800 text-gray-400'}`}>
                    осталось дней: {days}
                  </span>
                </div>
                <p className="font-bold text-white text-sm break-words">{r.label || 'Без названия'}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Удалил: {r.deletedByEmail || '—'} · {when(r.deletedAt)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <ActionBtn action={restoreFromTrash.bind(null, id)} label="♻️ Восстановить" color="bg-green-700 hover:bg-green-600" />
                <ActionBtn
                  action={purgeFromTrash.bind(null, id)}
                  label="Стереть"
                  color="bg-red-800 hover:bg-red-700"
                  confirm="Стереть копию навсегда? Восстановить её потом будет нельзя."
                />
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
