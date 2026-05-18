import React from 'react';

interface MapDesktopSidebarProps {
  filters: any;
  setFilters: (filters: any) => void;
  doctorCount: number;
  isLoading: boolean;
  allDoctors: any[];
  userLocation: any;
  onDoctorSelect: (doc: any) => void;
  expandSearch: () => void;
  lang: string;
}

export function MapDesktopSidebar({
  filters,
  setFilters,
  doctorCount,
  isLoading,
  allDoctors,
  userLocation,
  onDoctorSelect,
  expandSearch,
  lang,
}: MapDesktopSidebarProps) {
  return (
    <aside className="hidden lg:block w-[320px] border-r overflow-y-auto p-6 space-y-8 bg-slate-50/50">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
          📍 Город
        </label>
        <input
          type="text"
          placeholder="Поиск по городу..."
          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none shadow-sm"
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
          Тип приема
        </label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'in_person', label: '🏥 В клинике' },
            { id: 'online', label: '💻 Онлайн' },
            { id: 'home_visit', label: '🏠 На дому' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() =>
                setFilters({
                  ...filters,
                  consultationType: filters.consultationType === t.id ? '' : t.id,
                })
              }
              className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all ${
                filters.consultationType === t.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
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
            : `Всего врачей: ${doctorCount}`}
        </p>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white border border-slate-100 rounded-xl animate-pulse flex items-center px-3 gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  <div className="h-2 w-1/3 bg-slate-100 rounded" />
                </div>
              </div>
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
            {allDoctors.map((doc) => (
              <div
                key={doc._id}
                className="p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 cursor-pointer transition-all shadow-sm group active:scale-95 duration-100"
                onClick={() => onDoctorSelect(doc)}
              >
                <div className="flex justify-between items-start">
                  <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                    {doc.name}
                  </p>
                  {doc.distanceKm && (
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      📍 {doc.distanceKm.toFixed(1)} км
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {doc.specialty?.[lang] || doc.specialty?.ru}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
