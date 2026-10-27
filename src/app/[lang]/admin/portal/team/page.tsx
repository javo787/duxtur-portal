import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import { assertAdminPage } from '@/lib/admin-content/guard';
import { addManager, removeManager } from '@/app/actions/admin-team';
import { ActionBtn } from '@/app/[lang]/admin/_components/ActionBtn';
import AdminShell from '../_shared/AdminShell';
import { inputCls } from '../_shared/FormBits';
import AddManagerForm from './AddManagerForm';

interface ManagerRow { _id: { toString(): string }; email: string; name?: string; createdAt?: Date }

export default async function TeamPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const staff = await assertAdminPage(lang);

  await dbConnect();
  const managers = await User.find({ role: 'portal_manager' }).select('email name createdAt').sort({ email: 1 }).lean<ManagerRow[]>();
  const counts = await Promise.all(managers.map(async m => {
    const [doctors, clinics] = await Promise.all([
      Doctor.countDocuments({ managedBy: m._id }), Clinic.countDocuments({ managedBy: m._id }),
    ]);
    return { id: m._id.toString(), doctors, clinics };
  }));

  return (
    <AdminShell lang={lang} active="team" staff={staff} title={`Команда (${managers.length})`}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400 space-y-2">
        <p className="font-bold text-white">Что может менеджер</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Добавлять врачей и клиник: добавленные им записи закрепляются за ним.</li>
          <li>Брать заявки из очереди: одобрил или отклонил заявку, и она закреплена за ним.</li>
          <li>Редактировать, блокировать, удалять и модерировать (статьи и отзывы врачей и клиник) только свои записи.</li>
          <li>Видит в журнале и корзине только свои действия. Чужие записи и записи администратора ему недоступны.</li>
          <li>Не может: назначать менеджеров, импортировать места, пользоваться ИИ-помощником, входить через Telegram или Duxtur Edu.</li>
        </ul>
        <p>Назначить можно только обычный аккаунт (не врача, не клинику). Человек должен выйти и войти на сайт заново. Снятие роли работает сразу.</p>
      </div>

      <AddManagerForm action={addManager} inputClass={inputCls} />

      <div className="space-y-3">
        {managers.length === 0 && <div className="border border-gray-800 rounded-2xl p-8 text-center text-gray-500">Менеджеров пока нет</div>}
        {managers.map(m => {
          const c = counts.find(x => x.id === m._id.toString());
          const id = m._id.toString();
          return (
            <div key={id} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white break-all">{m.email}</p>
                <p className="text-xs text-gray-500 mt-1">{m.name || 'Без имени'} · врачей: {c?.doctors ?? 0} · клиник: {c?.clinics ?? 0}</p>
              </div>
              <ActionBtn
                action={removeManager.bind(null, id)}
                label="Снять роль"
                color="bg-red-800 hover:bg-red-700"
                confirm="Снять роль менеджера? Доступ закроется сразу, а его записи перейдут к администратору."
              />
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
