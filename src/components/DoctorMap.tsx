'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface DoctorMapPin {
  _id: string;
  slug: string;
  name: string;
  specialty: any;
  coordinates: {
    lat: number;
    lng: number;
    coordinates: number[];
  };
  reviewAvg: number;
  reviewCount: number;
}

interface DoctorMapProps {
  doctors: DoctorMapPin[];
  onDoctorClick: (slug: string) => void;
  userLocation?: { lat: number; lng: number };
  lang: string;
}

declare global {
  interface Window {
    ymaps3: any;
  }
}

export default function DoctorMap({ doctors, onDoctorClick, userLocation, lang }: DoctorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapLoaded && window.ymaps3 && mapContainerRef.current) {
      initMap();
    }
  }, [mapLoaded, doctors]);

  async function initMap() {
    if (!window.ymaps3) return;
    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapControls } = window.ymaps3;
    const { YMapZoomControl, YMapGeolocationControl } = await window.ymaps3.import('@yandex/ymaps3-controls@0.0.1');
    const { YMapClusterer, clusterByGrid } = await window.ymaps3.import('@yandex/ymaps3-clusterer@0.0.1');

    if (mapRef.current) {
      mapRef.current.destroy();
    }

    const map = new YMap(mapContainerRef.current!, {
      location: {
        center: userLocation ? [userLocation.lng, userLocation.lat] : [68.78, 38.56], // Default Dushanbe
        zoom: 12
      }
    });

    map.addChild(new YMapDefaultSchemeLayer({}));
    map.addChild(new YMapDefaultFeaturesLayer({}));

    const controls = new YMapControls({ position: 'right' });
    controls.addChild(new YMapZoomControl({}));
    controls.addChild(new YMapGeolocationControl({}));
    map.addChild(controls);

    const markerElement = (doc: DoctorMapPin) => {
      const el = document.createElement('div');
      // Simple color mapping for specialties
      const colors: any = {
        'кардиология': 'bg-rose-600',
        'неврология': 'bg-violet-600',
        'стоматология': 'bg-sky-600',
        'педиатрия': 'bg-amber-600'
      };
      const spec = doc.specialty?.ru?.toLowerCase() || '';
      const colorClass = colors[spec] || 'bg-blue-600';

      el.className = `w-8 h-8 rounded-full ${colorClass} border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-white text-[10px] font-bold`;
      el.innerHTML = doc.reviewAvg ? doc.reviewAvg.toFixed(1) : '★';
      el.onclick = () => onDoctorClick(doc.slug);
      return el;
    };

    const clusterer = new YMapClusterer({
      method: clusterByGrid({ gridSize: 64 }),
      features: doctors.map(doc => ({
        type: 'Feature',
        id: doc._id,
        geometry: {
          type: 'Point',
          coordinates: doc.coordinates.coordinates || [doc.coordinates.lng, doc.coordinates.lat]
        },
        properties: { doctor: doc },
        onClick: () => onDoctorClick(doc.slug)
      })),
      marker: (feature: any) => new YMapMarker({
        coordinates: feature.geometry.coordinates,
        onClick: feature.onClick
      }, markerElement(feature.properties.doctor)),
      cluster: (coordinates: any, features: any) => new YMapMarker({
        coordinates,
      }, clusterElement(features.length))
    });

    map.addChild(clusterer);
    mapRef.current = map;
  }

  function clusterElement(count: number) {
    const el = document.createElement('div');
    el.className = 'w-10 h-10 rounded-full bg-blue-800 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black';
    el.innerHTML = count.toString();
    return el;
  }

  return (
    <div className="relative w-full h-[350px] md:h-[500px] bg-slate-100 overflow-hidden">
      <Script
        src={`https://api-maps.yandex.ru/3.0/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY}&lang=ru_RU`}
        onLoad={() => setMapLoaded(true)}
      />
      <div ref={mapContainerRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <p className="text-slate-400 font-bold animate-pulse">Загрузка карты...</p>
        </div>
      )}
    </div>
  );
}
