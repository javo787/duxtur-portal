import DoctorCard from './DoctorCard';

interface DoctorsGridProps {
  doctors: any[];
  lang: string;
  L: (key: string) => string;
}

export default function DoctorsGrid({ doctors, lang, L }: DoctorsGridProps) {
  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-4xl" aria-hidden="true">🔍</div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{L('no_doctors')}</h3>
        <p className="text-slate-500 mb-8 text-sm">{L('be_first')}</p>
        <Link href={`/${lang}/register`} className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
          {L('register_now')} →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {doctors.map((doc) => (
        <DoctorCard key={doc._id} doctor={doc} lang={lang} L={L} />
      ))}
    </div>
  );
}
