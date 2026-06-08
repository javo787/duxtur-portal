'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@/hooks/useTheme';

if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface Props {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

export default function LocationPickerModal({
  initialLat = 38.559,
  initialLng = 68.773,
  onConfirm,
  onCancel,
}: Props) {
  const theme = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true,
    });

    const tiles = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/${theme === 'dark' ? 'dark-v11' : 'light-v11'}/tiles/{z}/{x}/{y}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
      attribution: '&copy; <a href="https://www.mapbox.com">Mapbox</a> &copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 22,
    }).addTo(map);

    tileLayerRef.current = tiles;

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setSelectedLat(pos.lat);
      setSelectedLng(pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setSelectedLat(e.latlng.lat);
      setSelectedLng(e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (tileLayerRef.current) {
      const style = theme === 'dark' ? 'dark-v11' : 'light-v11';
      tileLayerRef.current.setUrl(
        `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
    }
  }, [theme]);

  const handleConfirm = () => {
    onConfirm(selectedLat, selectedLng);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-[90%] max-w-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Укажите точку на карте</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Перетащите маркер или кликните по карте, чтобы выбрать местоположение.
        </p>
        <div
          ref={mapContainerRef}
          className="w-full h-[400px] rounded-2xl border border-slate-200 overflow-hidden"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
