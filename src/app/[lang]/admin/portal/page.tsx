// src/app/[lang]/admin/portal/page.tsx  (НОВЫЙ ФАЙЛ)

import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import { updateDoctorStatus } from '@/app/actions/admin';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

function ActionButton({ id, status, label, color }: any) {
  const updateWithId = updateDoctorStatus.bind(null, id, status);
  return (
    <form action={updateWithId}>
      <button className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow transition active:scale-95 ${color}`}>
        {label}
      </button>
    </form>
  );
}

export default async function PortalAdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const session = await auth();
  const { lang } = await params;

  if (!session || (session.user as any)?.role !== 'portal_admin') {
    redirect(`/${lang}/login`);
  }

  await dbConnect();

  const [pendingDoctors, approvedDoctors, totalArticles] = await Promise.all([
    Doctor.find({ status: 'pending' }).sort({ createdAt: -1 }),
    Doctor.find({ status: 'approved' }).sort({ createdAt: -1 }),
    Article.countDocuments(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}`} className="text-slate-400 hover:text-white text-sm transition">← На сайт</Link>
          <span className="text-slate-600">|</span>
          <h1 className="font-extrabold text-lg tracking-tight">
            duxtur<span className="text-blue-400">.com</span>
            <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin Portal</span>
          </h1>
        </div>
        <div className="text-xs text-slate-400">Только для администратора платформы</div>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Ожидают проверки" value={pendingDoctors.length} color="bg-yellow-50 border-yellow-200 text-yellow-700" icon="⏳" />
          <StatCard label="Врачей одобрено" value={approvedDoctors.length} color="bg-green-50 border-green-200 text-green-700" icon="✅" />
          <StatCard label="Статей на портале" value={totalArticles} color="bg-blue-50 border-blue-200 text-blue-700" icon="📄" />
          <StatCard label="Всего авторов" value={approvedDoctors.length} color="bg-purple-50 border-purple-200 text-purple-700" icon="👨‍⚕️" />
        </div>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Новые заявки врачей</h2>
            {pendingDoctors.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-extrabold px-3 py-1 rounded-full animate-pulse">
                {pendingDoctors.length} новых
              </span>
            )}
          </div>
          {pendingDoctors.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center text-gray-400 border border-gray-100">
              <div className="text-4xl mb-3">🎉</div>
              <p className="font-medium">Все заявки обработаны</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingDoctors.map((doc: any) => (
                <div key={doc._id} className="bg-white p-6 rounded-2xl border border-yellow-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <a href={doc.documentImage} target="_blank" rel="noopener noreferrer"
                    className="w-full md:w-44 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative group block">
                    <img src={doc.documentImage} alt="Диплом" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">🔍 Открыть</div>
                  </a>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{doc.name}</h3>
                        <p className="text-blue-600 font-semibold text-sm">{doc.specialty?.ru || 'Специализация не указана'}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">На проверке</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                      <span className="bg-gray-100 px-3 py-1 rounded-lg">📞 {doc.phone}</span>
                      <span className="bg-gray-100 px-3 py-1 rounded-lg">📅 {new Date(doc.createdAt).toLocaleDateString('ru')}</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <ActionButton id={doc._id.toString()} status="approved" label="✅ Одобрить" color="bg-green-600 hover:bg-green-700" />
                      <ActionButton id={doc._id.toString()} status="rejected" label="❌ Отклонить" color="bg-red-500 hover:bg-red-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Одобренные авторы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedDoctors.map((doc: any) => (
              <div key={doc._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <img src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt={doc.name} className="w-14 h-14 rounded-full object-cover border-2 border-green-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{doc.name}</p>
                  <p className="text-sm text-blue-600">{doc.specialty?.ru}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📞 {doc.phone}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full shrink-0">✓ Активен</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: any) {
  return (
    <div className={`p-5 rounded-2xl border ${color} flex items-center gap-4`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-extrabold leading-none">{value}</p>
        <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
      </div>
    </div>
  );
}
