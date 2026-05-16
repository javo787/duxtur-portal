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
  const [trackingMode, setTrackingMode] = useState(false);
  const [targetDoctor, setTargetDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleDoctors, setVisibleDoctors] = useState<any[]>([]);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
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
    loadData();
  }, [filters, userLocation]);

  async function loadData() {
    if (!userLocation && !filters.city) {
      setAllPins([]);
      return;
    }

    setIsLoading(true);
    const sp = new URLSearchParams();
    if (userLocation) {
      sp.set('lat', userLocation.lat.toString());
      sp.set('lng', userLocation.lng.toString());
      sp.set('radius', '20');
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });

    try {
      const placesSp = new URLSearchParams();
      if (userLocation) {
        placesSp.set('lat', userLocation.lat.toString());
        placesSp.set('lng', userLocation.lng.toString());
      }
      if (filters.city) placesSp.set('city', filters.city);

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

      setAllPins([...doctorPins, ...placePins]);
    } catch (error) {
      console.error("Error loading map data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleMapBoundsChange = (bounds: any) => {
    const visible = allPins.filter(pin =>
        pin.type === 'doctor' &&
        bounds.contains([pin.coordinates.lat, pin.coordinates.lng])
    );
    setVisibleDoctors(visible);
  };

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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Найдено: {allPins.filter(p => p.type === 'doctor').length}</p>
              <div className="space-y-3">
                 {allPins.filter(p => p.type === 'doctor').slice(0, 10).map(doc => (
                    <div
                      key={doc._id}
                      className="p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 cursor-pointer transition-all shadow-sm group"
                      onClick={() => setSelectedDoctor(doc)}
                    >
                       <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">{doc.name}</p>
                       <p className="text-[10px] text-slate-400 mt-0.5">{doc.specialty?.ru}</p>
                    </div>
                 ))}
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
             onMapBoundsChange={handleMapBoundsChange}
             userLocation={userLocation}
             trackingMode={trackingMode}
             targetDoctor={targetDoctor}
             onClearRoute={() => setTargetDoctor(null)}
             zoom={zoom}
             lang={lang}
           />

           {/* Floating Map Controls */}
           <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={() => setTrackingMode(!trackingMode)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${trackingMode ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                title="Моё местоположение"
              >
                📍
              </button>
              <button
                onClick={() => {
                   if (document.fullscreenElement) document.exitFullscreen();
                   else document.documentElement.requestFullscreen();
                }}
                className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-xl text-slate-600 hover:bg-slate-50 transition-all"
              >
                🗺
              </button>
           </div>

           {/* Custom Zoom Controls */}
           <div className="absolute bottom-32 md:bottom-10 right-4 flex flex-col gap-1 z-10">
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

           {/* Empty State Overlay */}
           {allPins.length === 0 && !isLoading && (
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-6 z-20">
                 <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm border border-slate-100">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Выберите город или включите локацию</h3>
                    <p className="text-sm text-slate-500 mb-6">Чтобы увидеть врачей и клиники поблизости</p>
                    <button
                       onClick={() => {
                          const city = prompt('Введите город (например, Душанбе):');
                          if (city) setFilters({ ...filters, city });
                       }}
                       className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-200"
                    >
                       Указать город
                    </button>
                 </div>
              </div>
           )}

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
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
                 <div className="bg-white px-4 py-2 rounded-full shadow-2xl border border-slate-100 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-600">Загрузка...</span>
                 </div>
              </div>
           )}

           {/* Mobile Bottom Sheet */}
           <div
             className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-all duration-500 ease-in-out z-40 ${isBottomSheetExpanded ? 'h-[80vh]' : 'h-24'}`}
           >
              {/* Drag Handle */}
              <div
                className="w-full py-4 flex flex-col items-center cursor-pointer"
                onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
              >
                 <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-2"></div>
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    {visibleDoctors.length} {lang === 'ru' ? 'врачей рядом' : 'yaqin oradagi shifokorlar'}
                 </p>
              </div>

              <div className="overflow-y-auto h-full px-6 pb-24">
                 {!isBottomSheetExpanded ? (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                       {visibleDoctors.slice(0, 5).map(doc => (
                          <div key={doc._id} className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden border border-slate-100">
                             <img src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" className="w-full h-full object-cover" />
                          </div>
                       ))}
                       {visibleDoctors.length > 5 && (
                          <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
                             +{visibleDoctors.length - 5}
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="space-y-6 pt-4">
                       {/* Mobile Filters */}
                       <div className="grid grid-cols-2 gap-3">
                          <button
                             onClick={() => {
                                const city = prompt('Ваш город?');
                                if (city) setFilters({...filters, city});
                             }}
                             className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left"
                          >
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Город</p>
                             <p className="text-xs font-bold text-slate-900 truncate">{filters.city || 'Не выбран'}</p>
                          </button>
                          <button
                             onClick={() => setTrackingMode(!trackingMode)}
                             className={`p-3 rounded-2xl border text-left ${trackingMode ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}
                          >
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Локация</p>
                             <p className="text-xs font-bold text-blue-600">{trackingMode ? 'Включена' : 'Выключена'}</p>
                          </button>
                       </div>

                       {/* Doctors List */}
                       <div className="space-y-4">
                          <h4 className="text-sm font-black text-slate-900">Список врачей в этой области</h4>
                          {visibleDoctors.length === 0 ? (
                             <div className="py-10 text-center">
                                <p className="text-slate-400 text-sm">Никого не найдено в этой области</p>
                                <button
                                  onClick={() => setZoom(prev => Math.max(prev - 2, 1))}
                                  className="mt-4 px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                  Увеличить радиус (отдалить)
                                </button>
                             </div>
                          ) : (
                             visibleDoctors.map(doc => (
                                <div
                                  key={doc._id}
                                  className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
                                  onClick={() => {
                                     setSelectedDoctor(doc);
                                     setIsBottomSheetExpanded(false);
                                  }}
                                >
                                   <img src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                                   <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                                      <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">{doc.specialty?.ru}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                         <span className="text-xs">⭐ {doc.reviewAvg || 0}</span>
                                         <span className="text-[10px] text-slate-400">💰 От {doc.priceRange?.min} {doc.priceRange?.currency}</span>
                                      </div>
                                   </div>
                                </div>
                             ))
                          )}
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}
