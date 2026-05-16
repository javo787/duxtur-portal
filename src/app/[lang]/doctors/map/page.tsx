'use client';

import { useState, useEffect, use } from 'react';
import DoctorMap from '@/components/DoctorMap';
import DoctorMapCard from '@/components/DoctorMapCard';
import Link from 'next/link';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';

export default function DoctorMapSearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [allPins, setAllPins] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();
  const [filters, setFilters] = useState({
    specialty: '',
    city: '',
    priceMin: '',
    priceMax: '',
    consultationType: '',
    accepts: ''
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Location permission denied")
      );
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [filters, userLocation]);

  async function loadData() {
    const sp = new URLSearchParams();
    if (userLocation) {
      sp.set('lat', userLocation.lat.toString());
      sp.set('lng', userLocation.lng.toString());
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });

    try {
      const [doctors, places] = await Promise.all([
        fetch(`/api/doctors/map?${sp.toString()}`).then(r => r.json()),
        fetch(`/api/places?city=${filters.city || ''}`).then(r => r.json()),
      ]);

      const doctorPins = (doctors || []).map((d: any) => ({
        ...d,
        type: 'doctor',
        coordinates: {
          lat: d.coordinates?.lat || (d.coordinates?.coordinates?.[1]),
          lng: d.coordinates?.lng || (d.coordinates?.coordinates?.[0])
        }
      }));

      const placePins = (places || []).map((p: any) => ({
        _id: p._id,
        name: p.name?.[lang] || p.name?.ru || p.name,
        type: p.type,
        coordinates: p.coordinates,
        address: p.address,
      }));

      setAllPins([...doctorPins, ...placePins]);
    } catch (error) {
      console.error("Error loading map data:", error);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="h-16 border-b flex items-center justify-between px-6 shrink-0">
        <Link href={`/${lang}/doctors`} className="flex items-center gap-2 text-slate-900 font-bold">
           duxtur<span className="text-blue-600">.org</span>
        </Link>
        <Link href={`/${lang}/doctors`} className="text-sm font-bold text-blue-600">
           Списком
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Filters */}
        <aside className="hidden md:block w-[300px] border-r overflow-y-auto p-6 space-y-6">
           <div>
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Специализация</label>
             <select
               className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
               value={filters.specialty}
               onChange={(e) => setFilters({...filters, specialty: e.target.value})}
             >
               <option value="">Все</option>
               {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                 <option key={k} value={v.ru}>{v[lang] || v.ru}</option>
               ))}
             </select>
           </div>

           <div>
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Тип приема</label>
             <div className="space-y-2">
                {['in_person', 'online', 'home_visit'].map(t => (
                  <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={filters.consultationType === t}
                      onChange={() => setFilters({...filters, consultationType: t})}
                    />
                    <span>{t === 'in_person' ? 'В клинике' : t === 'online' ? 'Онлайн' : 'На дому'}</span>
                  </label>
                ))}
                <button onClick={() => setFilters({...filters, consultationType: ''})} className="text-[10px] text-blue-600 font-bold">Сбросить</button>
             </div>
           </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative h-full">
           <DoctorMap
             pins={allPins}
             onPinClick={(slug: string) => {
               const doc = allPins.find((p: any) => p.slug === slug && p.type === 'doctor');
               if (doc) setSelectedDoctor(doc);
             }}
             userLocation={userLocation}
             lang={lang}
           />
           {selectedDoctor && (
             <DoctorMapCard
               doctor={selectedDoctor}
               lang={lang}
               onClose={() => setSelectedDoctor(null)}
             />
           )}
        </main>
      </div>
    </div>
  );
}
