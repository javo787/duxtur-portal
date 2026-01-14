import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { updateDoctorStatus } from '@/app/actions/admin';
import Link from 'next/link';

function ActionButton({ id, status, label, color }: any) {
  const updateWithId = updateDoctorStatus.bind(null, id, status);
  return (
    <form action={updateWithId}>
      <button className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md transition transform active:scale-95 ${color}`}>
        {label}
      </button>
    </form>
  );
}

export default async function AdminDashboard({ params }: { params: Promise<{ lang: string }> }) {
  await dbConnect();
  const { lang } = await params;
  
  const pendingDoctors = await Doctor.find({ status: 'pending' }).sort({ createdAt: -1 });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/${lang}`} className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 text-gray-500">
               ← Назад
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900">Админ-панель 🛡️</h1>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold text-sm">
            Заявок: {pendingDoctors.length}
          </div>
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm text-center text-gray-400">
            <p className="text-xl">Все спокойно. Новых заявок нет.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingDoctors.map((doc: any) => (
              <div key={doc._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative group">
                  <img src={doc.documentImage} alt="Diplom" className="w-full h-full object-cover" />
                  <a href={doc.documentImage} target="_blank" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold text-sm cursor-pointer">
                    🔍 Открыть
                  </a>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{doc.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{doc.specialty?.ru || "Врач"}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-2 py-1 rounded">📞 {doc.phone}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">📧 {doc.userId?.email || "Email скрыт"}</span>
                  </div>

                  <div className="flex gap-3">
                    <ActionButton id={doc.id} status="approved" label="Одобрить ✅" color="bg-green-600 hover:bg-green-700" />
                    <ActionButton id={doc.id} status="rejected" label="Отклонить ❌" color="bg-red-600 hover:bg-red-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
