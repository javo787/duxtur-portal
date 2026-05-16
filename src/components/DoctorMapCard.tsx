'use client';

import Link from 'next/link';
import Image from 'next/image';

interface DoctorMapCardProps {
  doctor: any;
  lang: string;
  onClose: () => void;
}

export default function DoctorMapCard({ doctor, lang, onClose }: DoctorMapCardProps) {
  if (!doctor) return null;

  const t = (field: any) => field?.[lang] || field?.ru || '';

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:top-4 md:right-4 md:bottom-auto w-auto md:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-300 z-50">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm z-10"
      >
        ✕
      </button>

      <div className="p-5 flex gap-4">
        <div className="relative shrink-0">
          <Image
            src={doctor.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
            alt={doctor.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-slate-900 text-sm leading-tight truncate">{doctor.name}</h3>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-1">{t(doctor.specialty)}</p>
          <div className="flex items-center gap-1 mt-1">
             <span className="text-xs">⭐ {doctor.reviewAvg || 0}</span>
             <span className="text-[10px] text-slate-400">({doctor.reviewCount || 0})</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
           <span>💰 От {doctor.priceRange?.min || 0} {doctor.priceRange?.currency || 'TJS'}</span>
           {doctor.distanceKm && <span>📍 {doctor.distanceKm.toFixed(1)} км</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/${lang}/doctor/${doctor.slug || doctor._id}`}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-center text-[11px] font-bold transition"
          >
            Профиль
          </Link>
          <button className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center text-[11px] font-bold transition">
            Записаться
          </button>
        </div>
      </div>
    </div>
  );
}
