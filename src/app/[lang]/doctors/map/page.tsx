'use client';

import { useState, use, useCallback } from 'react';
import Link from 'next/link';
import DoctorMap from '@/components/DoctorMap';
import DoctorMapCard from '@/components/DoctorMapCard';
import { useUserLocation } from './_hooks/useUserLocation';
import { useMapData } from './_hooks/useMapData';
import { MapFiltersBar } from './_components/MapFiltersBar';
import { MapDesktopSidebar } from './_components/MapDesktopSidebar';
import { MapMobileBottomSheet } from './_components/MapMobileBottomSheet';
import { MapFloatingControls } from './_components/MapFloatingControls';
import { MapLoadingSpinner } from './_components/MapLoadingSpinner';

export default function DoctorMapSearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { location: userLocation } = useUserLocation();

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [targetDoctor, setTargetDoctor] = useState<any>(null);
  const [trackingMode, setTrackingMode] = useState(false);
  const [zoom, setZoom] = useState(13);
  const [sheetState, setSheetState] = useState<'collapsed' | 'half' | 'full'>('collapsed');

  const [filters, setFilters] = useState({
    specialty: '',
    city: '',
    priceMin: '',
    priceMax: '',
    consultationType: '',
    accepts: '',
    radius: '25',
  });

  const { allPins, allDoctors, isLoading } = useMapData(filters, userLocation, lang);

  const handleMapBoundsChange = useCallback(
    (bounds: any) => {
      // Logic for filtering visible doctors can be added here if needed in future
    },
    []
  );

  const expandSearch = () => {
    setFilters((prev) => ({ ...prev, radius: '50' }));
  };

  const doctorCount = allDoctors.length;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden relative">
      <header className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-white z-20">
        <Link href={`/${lang}/doctors`} className="flex items-center gap-2 text-slate-900 font-bold">
          duxtur<span className="text-blue-600">.org</span>
        </Link>
        <Link href={`/${lang}/doctors`} className="text-sm font-bold text-blue-600 px-4 py-2 bg-blue-50 rounded-full">
          {lang === 'ru' ? 'Списком' : "Ro'yxat"}
        </Link>
      </header>

      <MapFiltersBar
        lang={lang}
        activeSpecialty={filters.specialty}
        onChange={(specialty) => setFilters({ ...filters, specialty })}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <MapDesktopSidebar
          filters={filters}
          setFilters={setFilters}
          doctorCount={doctorCount}
          isLoading={isLoading}
          allDoctors={allDoctors}
          userLocation={userLocation}
          onDoctorSelect={setSelectedDoctor}
          expandSearch={expandSearch}
          lang={lang}
        />

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

          <MapFloatingControls
            trackingMode={trackingMode}
            onToggleTracking={() => setTrackingMode(!trackingMode)}
            zoom={zoom}
            onZoomChange={setZoom}
          />

          {selectedDoctor && (
            <DoctorMapCard
              doctor={selectedDoctor}
              lang={lang}
              hasLocation={!!userLocation}
              onBuildRoute={(doc) =>
                setTargetDoctor({
                  lat: doc.coordinates.lat,
                  lng: doc.coordinates.lng,
                  name: doc.name,
                })
              }
              onClose={() => setSelectedDoctor(null)}
            />
          )}

          <MapLoadingSpinner isLoading={isLoading} />

          <MapMobileBottomSheet
            state={sheetState}
            setState={setSheetState}
            lang={lang}
            doctorCount={doctorCount}
            allDoctors={allDoctors}
            isLoading={isLoading}
            filters={filters}
            setFilters={setFilters}
            onDoctorSelect={setSelectedDoctor}
            expandSearch={expandSearch}
          />
        </main>
      </div>
    </div>
  );
}
