'use client';

import { useState, useEffect, use, useCallback } from 'react';
import DoctorMap from '@/components/DoctorMap';
import DoctorMapCard from '@/components/DoctorMapCard';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORY_LABELS } from '@/lib/doctor-constants';

type BottomSheetState = 'collapsed' | 'half' | 'full';

export default function DoctorMapSearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const [allPins, setAllPins] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();
  const [filters, setFilters] = useState({
    specialty: '',
    city: '',
    priceMin: '',
    priceMax: '',
    consultationType: '',
    accepts: '',
    radius: '25'
  });
  const [trackingMode, setTrackingMode] = useState(false);
  const [targetDoctor, setTargetDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleDoctors, setVisibleDoctors] = useState<any[]>([]);
  const [sheetState, setSheetState] = useState<BottomSheetState>('collapsed');
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Location permission denied")
      );
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, userLocation]);

  async function loadData() {
    setIsLoading(true);
    const sp = new URLSearchParams();

    // Priority: 1. City filter, 2. User Location (Radius)
    if (filters.city) {
      sp.set('city', filters.city);
    } else if (userLocation) {
      sp.set('lat', userLocation.lat.toString());
      sp.set('lng', userLocation.lng.toString());
      sp.set('radius', filters.radius || '25');
    }

    // Add other filters
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== 'radius' && k !== 'city') sp.set(k, v);
    });

    try {
      const placesSp = new URLSearchParams();
      if (filters.city) {
        placesSp.set('city', filters.city);
      } else if (userLocation) {
        placesSp.set('lat', userLocation.lat.toString());
        placesSp.set('lng', userLocation.lng.toString());
      }

      const [doctors, places] = await Promise.all([
        fetch(`/api/doctors/map?${sp.toString()}`).then(r => r.json()),
        fetch(`/api/places?${placesSp.toString()}`).then(r => r.json()),
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
        coordinates: {
            lat: p.coordinates?.lat || (p.coordinates?.coordinates?.[1]),
            lng: p.coordinates?.lng || (p.coordinates?.coordinates?.[0])
        },
        address: p.address,
      }));

      const pins = [...doctorPins, ...placePins];
      setAllPins(pins);

      const doctorsOnly = pins.filter(p => p.type === 'doctor');
      setAllDoctors([...doctorsOnly].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)));

      // Initial visible doctors calculation if allPins were empty
      if (allPins.length === 0) {
        setVisibleDoctors(doctorsOnly);
      }
    } catch (error) {
      console.error("Error loading map data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleMapBoundsChange = useCallback((bounds: any) => {
    const visible = allPins.filter(pin =>
        pin.type === 'doctor' &&
        bounds.contains([pin.coordinates.lat, pin.coordinates.lng])
    );
    setVisibleDoctors(visible);
  }, [allPins]);

  const cycleSheetState = () => {
    if (sheetState === 'collapsed') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('collapsed');
  };

  const getSheetHeight = () => {
    if (sheetState === 'collapsed') return 'h-[96px]';
    if (sheetState === 'half') return 'h-[45vh]';
    return 'h-[80vh]';
  };

  const expandSearch = () => {
    setFilters(prev => ({ ...prev, radius: '50' }));
  };

  const doctorCount = allDoctors.length;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden relative">
      <header className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-white z-20">
        <Link href={`/${lang}/doctors`} className="flex items-center gap-2 text-slate-900 font-bold">
           duxtur<span className="text-blue-600">.org</span>
        </Link>
        <Link href={`/${lang}/doctors`} className="text-sm font-bold text-blue-600 px-4 py-2 bg-blue-50 rounded-full">
           {lang === 'ru' ? 'Списком' : 'Ro\'yxat'}
        </Link>
      </header>

      {/* Specialty Chips Row (Mobile-first) */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white/80 backdrop-blur-md border-b z-10 no-scrollbar">
        <button
          onClick={() => setFilters({ ...filters, specialty: '' })}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!filters.specialty ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {lang === 'ru' ? 'Все' : 'Barchasi'}
        </button>
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilters({ ...filters, specialty: v.ru })}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filters.specialty === v.ru ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {v[lang] || v.ru}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[320px] border-r overflow-y-auto p-6 space-y-8 bg-slate-50/50">
           <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">📍 Город</label>
             <input
               type="text"
               placeholder="Поиск по городу..."
               className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none shadow-sm"
               value={filters.city}
               onChange={(e) => setFilters({...filters, city: e.target.value})}
             />
           </div>

           <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Тип приема</label>
             <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'in_person', label: '🏥 В клинике' },
                  { id: 'online', label: '💻 Онлайн' },
                  { id: 'home_visit', label: '🏠 На дому' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFilters({...filters, consultationType: filters.consultationType === t.id ? '' : t.id})}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all ${filters.consultationType === t.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <span>{t.label}</span>
                    {filters.consultationType === t.id && <span>✓</span>}
                  </button>
                ))}
             </div>
           </div>

           <div className="pt-6 border-t">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {filters.city
                  ? `Врачей в городе ${filters.city}: ${doctorCount}`
                  : userLocation
                    ? `Врачей в радиусе 25 км: ${doctorCount}`
                    : `Всего врачей: ${doctorCount}`
                }
              </p>
              {isLoading ? (
                <div className="space-y-3">
                   {[1,2,3].map(i => (
                      <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                   ))}
                </div>
              ) : doctorCount === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="text-xs font-bold text-slate-900 mb-1">Нет врачей в этой области</p>
                  <p className="text-[10px] text-slate-400 mb-4">Попробуйте расширить поиск</p>
                  <button
                    onClick={expandSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                  >
                    Расширить поиск
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {allDoctors.map(doc => (
                      <div
                        key={doc._id}
                        className="p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 cursor-pointer transition-all shadow-sm group"
                        onClick={() => setSelectedDoctor(doc)}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">{doc.name}</p>
                          {doc.distanceKm && (
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">📍 {doc.distanceKm.toFixed(1)} км</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{doc.specialty?.ru}</p>
                      </div>
                  ))}
                </div>
              )}
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
             onMapBoundsChange={handleMapBoundsChange}
             onMapClick={() => setSheetState('collapsed')}
             userLocation={userLocation}
             trackingMode={trackingMode}
             targetDoctor={targetDoctor}
             onClearRoute={() => setTargetDoctor(null)}
             zoom={!userLocation && !filters.city ? 5 : zoom}
             center={!userLocation && !filters.city ? [41.2995, 69.2401] : undefined}
             lang={lang}
           />

           {/* Floating Map Controls */}
           <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
              <button
                onClick={() => setTrackingMode(!trackingMode)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${trackingMode ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                title="Моё местоположение"
              >
                📍
              </button>
           </div>

           {/* Custom Zoom Controls */}
           <div className="absolute bottom-32 md:bottom-10 right-4 flex flex-col gap-1" style={{ zIndex: 1000 }}>
              <button
                onClick={() => setZoom(prev => Math.min(prev + 1, 19))}
                className="w-10 h-10 bg-white border border-slate-100 rounded-t-xl flex items-center justify-center font-bold text-slate-600 shadow-lg hover:bg-slate-50 transition-colors"
              >
                +
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 1, 1))}
                className="w-10 h-10 bg-white border border-slate-100 rounded-b-xl flex items-center justify-center font-bold text-slate-600 shadow-lg hover:bg-slate-50 transition-colors"
              >
                −
              </button>
           </div>

           {selectedDoctor && (
             <DoctorMapCard
               doctor={selectedDoctor}
               lang={lang}
               hasLocation={!!userLocation}
               onBuildRoute={(doc) => setTargetDoctor({ lat: doc.coordinates.lat, lng: doc.coordinates.lng, name: doc.name })}
               onClose={() => setSelectedDoctor(null)}
             />
           )}

           {/* Loading Spinner */}
{isLoading && (
   <div className="absolute top-4 left-1/2 -translate-x-1/2" style={{ zIndex: 1001 }}>
      <div className="bg-white px-4 py-2 rounded-full shadow-2xl border border-slate-100 flex items-center gap-2">
         <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
         <span className="text-xs font-bold text-slate-600">Загрузка...</span>
      </div>
   </div>
)}

           {/* Mobile Bottom Sheet */}
           <div
             className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-all duration-500 ease-in-out ${getSheetHeight()}`}
             style={{ zIndex: 1001 }}
             >
              {/* Drag Handle */}
              <div
                className="w-full py-4 flex flex-col items-center cursor-pointer relative"
                onClick={cycleSheetState}
              >
                 <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-2"></div>
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    {allDoctors.length} {lang === 'ru' ? 'врачей рядом' : 'yaqin oradagi shifokorlar'}
                 </p>
                 {sheetState !== 'collapsed' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSheetState('collapsed'); }}
                      className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full shadow-sm"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
              </div>

              <div className="overflow-y-auto h-full px-6 pb-32">
                 {sheetState === 'collapsed' && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                       {allDoctors.slice(0, 5).map(doc => (
                          <div key={doc._id} className="relative shrink-0 w-12 h-12 rounded-2xl overflow-hidden border border-slate-100">
                             <Image
                                src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                                alt=""
                                fill
                                sizes="48px"
                                quality={85}
                                className="object-cover"
                             />
                          </div>
                       ))}
                       {allDoctors.length > 5 && (
                          <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
                             +{allDoctors.length - 5}
                          </div>
                       )}
                    </div>
                 )}

                 {sheetState === 'half' && (
                    <div className="space-y-6 pt-4 animate-in fade-in duration-300">
                       <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">📍 Город</label>
                            <input
                              type="text"
                              placeholder="Ваш город..."
                              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-blue-500 outline-none"
                              value={filters.city}
                              onChange={(e) => setFilters({...filters, city: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Прием</label>
                            <div className="flex gap-2">
                              {[
                                { id: 'in_person', label: '🏥 Клиника' },
                                { id: 'online', label: '💻 Онлайн' },
                                { id: 'home_visit', label: '🏠 Домой' }
                              ].map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => setFilters({...filters, consultationType: filters.consultationType === t.id ? '' : t.id})}
                                  className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${filters.consultationType === t.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600'}`}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Принимает новых</p>
                                <button
                                  onClick={() => setFilters({...filters, accepts: filters.accepts === 'true' ? '' : 'true'})}
                                  className={`text-xs font-bold ${filters.accepts === 'true' ? 'text-blue-600' : 'text-slate-400'}`}
                                >
                                  {filters.accepts === 'true' ? 'Да' : 'Не важно'}
                                </button>
                             </div>
                             <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Цена до</p>
                                <input
                                  type="number"
                                  placeholder="500"
                                  className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full"
                                  value={filters.priceMax}
                                  onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                                />
                             </div>
                          </div>
                       </div>

                       <button
                        onClick={() => setSheetState('full')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl"
                       >
                         Показать результаты
                       </button>
                    </div>
                 )}

                 {sheetState === 'full' && (
                    <div className="space-y-4 pt-4 animate-in fade-in duration-300">
                       <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-900">Список врачей</h4>
                          <button onClick={() => setSheetState('half')} className="text-[10px] font-bold text-blue-600">Фильтры</button>
                       </div>

                       {isLoading ? (
                          <div className="space-y-4">
                             {[1,2,3].map(i => (
                                <div key={i} className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 animate-pulse">
                                   <div className="w-16 h-16 rounded-2xl bg-slate-100" />
                                   <div className="flex-1 space-y-2">
                                      <div className="h-4 w-32 bg-slate-100 rounded" />
                                      <div className="h-3 w-20 bg-slate-100 rounded" />
                                      <div className="h-3 w-full bg-slate-100 rounded" />
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : allDoctors.length === 0 ? (
                          <div className="py-10 text-center">
                             <p className="text-slate-400 text-sm">Никого не найдено</p>
                             <button
                               onClick={() => setZoom(prev => Math.max(prev - 2, 1))}
                               className="mt-4 px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600"
                             >
                               Отдалить карту
                             </button>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             {allDoctors.map(doc => (
                                <div
                                  key={doc._id}
                                  className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
                                  onClick={() => {
                                     setSelectedDoctor(doc);
                                     setSheetState('collapsed');
                                  }}
                                >
                                   <div className="relative w-16 h-16 shrink-0">
                                      <Image
                                        src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
                                        alt=""
                                        fill
                                        sizes="64px"
                                        quality={85}
                                        className="rounded-2xl object-cover"
                                      />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                                        {doc.distanceKm && (
                                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">📍 {doc.distanceKm.toFixed(1)} км</span>
                                        )}
                                      </div>
                                      <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">{doc.specialty?.ru}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                         <span className="text-xs">⭐ {doc.reviewAvg || 0}</span>
                                         <span className="text-[10px] text-slate-400">💰 От {doc.priceRange?.min} {doc.priceRange?.currency}</span>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}
