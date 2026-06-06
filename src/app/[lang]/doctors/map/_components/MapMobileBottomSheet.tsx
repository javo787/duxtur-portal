import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useT } from '@/i18n';

type BottomSheetState = 'collapsed' | 'half' | 'full';

interface MapMobileBottomSheetProps {
  state: BottomSheetState;
  setState: (state: BottomSheetState) => void;
  lang: string;
  doctorCount: number;
  allDoctors: any[];
  isLoading: boolean;
  filters: any;
  setFilters: (filters: any) => void;
  onDoctorSelect: (doc: any) => void;
  expandSearch: () => void;
}

export function MapMobileBottomSheet({
  state,
  setState,
  lang,
  doctorCount,
  allDoctors,
  isLoading,
  filters,
  setFilters,
  onDoctorSelect,
  expandSearch,
}: MapMobileBottomSheetProps) {
  const { t } = useT(lang);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe) {
      if (state === 'collapsed') setState('half');
      else if (state === 'half') setState('full');
    } else if (isDownSwipe) {
      if (state === 'full') setState('half');
      else if (state === 'half') setState('collapsed');
    }
  };

  const getSheetHeight = () => {
    if (state === 'collapsed') return 'h-[96px]';
    if (state === 'half') return 'h-[45vh]';
    return 'h-[80vh]';
  };

  return (
    <>
      {/* Backdrop */}
      {state === 'full' && (
        <div
          className="fixed inset-0 bg-black/20 z-[1000] lg:hidden animate-in fade-in duration-300"
          onClick={() => setState('half')}
        />
      )}

      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-all duration-500 ease-in-out z-[1001] ${getSheetHeight()}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag Handle */}
        <div
          className="w-full py-4 flex flex-col items-center cursor-pointer relative"
          onClick={() => {
            if (state === 'collapsed') setState('half');
            else if (state === 'half') setState('full');
            else setState('collapsed');
          }}
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-2"></div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
            {doctorCount} {t('map.doctorsNearby')}
          </p>
          {state !== 'collapsed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setState('collapsed');
              }}
              className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full shadow-sm"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        <div className="overflow-y-auto h-full px-6 pb-32 no-scrollbar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {state === 'collapsed' && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {allDoctors.slice(0, 5).map((doc) => (
                <div
                  key={doc._id}
                  className="relative shrink-0 w-12 h-12 rounded-2xl overflow-hidden border border-slate-100"
                >
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

          {state === 'half' && (
            <div className="space-y-6 pt-4 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    📍 {t('map.filterCity')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('map.filterCity')}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-blue-500 outline-none"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    {t('map.filterType')}
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'in_person', label: t('map.inClinic') },
                      { id: 'online', label: t('map.online') },
                      { id: 'home_visit', label: t('map.atHome') },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            consultationType: filters.consultationType === type.id ? '' : type.id,
                          })
                        }
                        className={`flex-1 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                          filters.consultationType === type.id
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-100 text-slate-600'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('doctors.acceptsNew')}</p>
                    <button
                      onClick={() =>
                        setFilters({ ...filters, accepts: filters.accepts === 'true' ? '' : 'true' })
                      }
                      className={`text-xs font-bold ${filters.accepts === 'true' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                      {filters.accepts === 'true' ? t('common.yes') : t('common.all')}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('map.priceTo')}</p>
                    <input
                      type="number"
                      placeholder="500"
                      className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full"
                      value={filters.priceMax}
                      onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setState('full')}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl"
              >
                {t('map.showResults')}
              </button>
            </div>
          )}

          {state === 'full' && (
            <div className="space-y-4 pt-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">{t('map.doctorList')}</h4>
                <button onClick={() => setState('half')} className="text-[10px] font-bold text-blue-600">
                  {t('map.listFilters')}
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 animate-pulse"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-slate-100 rounded" />
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                        <div className="h-3 w-full bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : doctorCount === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-slate-900 font-bold text-lg mb-2">{t('map.noResults')}</p>
                  <p className="text-slate-400 text-sm mb-6">{t('map.noResultsDesc')}</p>
                  <button
                    onClick={expandSearch}
                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-100"
                  >
                    {t('map.expandSearch')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {allDoctors.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-transform duration-100"
                      onClick={() => {
                        onDoctorSelect(doc);
                        setState('collapsed');
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
                          <p className="font-bold text-slate-900 text-sm truncate">{doc.name}</p>
                          {doc.distanceKm && (
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                              📍 {doc.distanceKm.toFixed(1)} {t('map.km')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">
                          {doc.specialty?.[lang] || doc.specialty?.ru}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs">⭐ {doc.reviewAvg || 0}</span>
                          <span className="text-[10px] text-slate-400">
                            💰 {t('common.from')} {doc.priceRange?.min} {doc.priceRange?.currency}
                          </span>
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
    </>
  );
}
