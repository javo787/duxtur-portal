import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function PatientAppointmentsPage({ params }: { params: Promise<{ lang: string }> }) {
  const session = await auth();
  const { lang } = await params;
  if (!session) redirect(`/${lang}/signup`);

  await dbConnect();
  const appointments = await Appointment.find({ patientId: session.user?.id })
    .populate('doctorId', 'name image specialty slug')
    .sort({ date: -1 })
    .lean();

  const t = (field: any) => field?.[lang] || field?.ru || '';

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-black text-slate-900 mb-8">Мои записи</h1>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border shadow-sm">
            <p className="text-slate-500 mb-6">У вас пока нет записей</p>
            <Link href={`/${lang}/doctors`} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">Найти врача</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt: any) => (
              <div key={apt._id.toString()} className="bg-white rounded-2xl p-6 border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <Image
                     src={apt.doctorId?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                     alt={apt.doctorId?.name || 'Doctor'}
                     width={56} height={56}
                     className="w-14 h-14 rounded-xl object-cover"
                   />
                   <div>
                     <p className="font-bold text-slate-900">{apt.doctorId?.name}</p>
                     <p className="text-xs text-blue-500">{t(apt.doctorId?.specialty)}</p>
                     <p className="text-xs text-slate-400 mt-1">
                       {new Date(apt.date).toLocaleDateString(lang)} в {apt.timeSlot}
                     </p>
                   </div>
                </div>
                <div className="text-right">
                   <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                     apt.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                     apt.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                     'bg-slate-50 text-slate-400'
                   }`}>
                     {apt.status}
                   </span>
                   {apt.status !== 'cancelled' && new Date(apt.date) > new Date() && (
                     <button className="block text-xs font-bold text-red-500 hover:underline">Отменить</button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
