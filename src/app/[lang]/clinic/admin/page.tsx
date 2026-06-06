import dbConnect from '@/lib/mongodb';
import Clinic from '@/models/Clinic';
import Appointment from '@/models/Appointment';
import Review from '@/models/Review';
import Doctor from '@/models/Doctor';
import ClinicInvitation from '@/models/ClinicInvitation';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getT } from '@/i18n';
import ClinicAdminTabs from './_components/ClinicAdminTabs';

export default async function ClinicAdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const session = await auth();
  const { lang } = await params;

  if (!session || (session.user as any)?.role !== 'clinic') {
    redirect(`/${lang}/login`);
  }

  await dbConnect();
  const clinic = await Clinic.findOne({ userId: session.user?.id }).lean();

  if (!clinic) {
    redirect(`/${lang}`);
  }

  // Fetch stats for Overview
  const [appointmentsCount, reviewsCount, doctorsCount, pendingInvitationsCount] = await Promise.all([
    Appointment.countDocuments({ doctorId: { $in: clinic.doctorIds || [] } }),
    Review.countDocuments({ clinicId: clinic._id, isVerified: true }),
    Doctor.countDocuments({ clinicId: clinic._id }),
    ClinicInvitation.countDocuments({ clinicId: clinic._id, status: 'pending' }),
  ]);

  const stats = {
    appointments: appointmentsCount,
    reviews: reviewsCount,
    doctors: doctorsCount,
    pendingInvitations: pendingInvitationsCount,
    views: clinic.profileViews || 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
          {(clinic.name as any)[lang] || (clinic.name as any).ru}
        </h1>
        <div className="flex items-center gap-2">
           <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
             clinic.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
           }`}>
             {clinic.status}
           </span>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <ClinicAdminTabs lang={lang} clinic={JSON.parse(JSON.stringify(clinic))} stats={stats} />
      </main>
    </div>
  );
}
