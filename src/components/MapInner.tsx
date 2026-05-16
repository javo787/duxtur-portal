'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Фикс иконок Leaflet в Next.js
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapPin {
  _id: string;
  slug?: string;
  name: string;
  specialty?: any;
  coordinates: { lat: number; lng: number };
  reviewAvg?: number;
  type?: 'doctor' | 'clinic' | 'pharmacy' | 'hospital' | 'lab';
  address?: string;
}

interface MapInnerProps {
  pins: MapPin[];
  onPinClick?: (slug: string) => void;
  userLocation?: { lat: number; lng: number };
  lang?: string;
  center?: [number, number];
  zoom?: number;
}

// Цвета по типу
const PIN_COLORS: Record<string, string> = {
  doctor:   '#2563eb',
  clinic:   '#16a34a',
  pharmacy: '#dc2626',
  hospital: '#be123c',
  lab:      '#0891b2',
  default:  '#7c3aed',
};

function createColoredIcon(color: string, label?: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px; height:36px;
        background:${color};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="transform:rotate(45deg); color:white; font-size:10px; font-weight:bold;">
          ${label || ''}
        </span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

export default function MapInner({
  pins,
  onPinClick,
  userLocation,
  lang = 'ru',
  center,
  zoom = 13,
}: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const defaultCenter: [number, number] = center || [38.559, 68.773]; // Душанбе

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: userLocation
        ? [userLocation.lat, userLocation.lng]
        : defaultCenter,
      zoom,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Обновить маркеры при изменении pins
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    pins.forEach(pin => {
      const lat = pin.coordinates?.lat;
      const lng = pin.coordinates?.lng;
      if (!lat || !lng) return;

      const color = PIN_COLORS[pin.type || 'default'];
      const ratingLabel = pin.reviewAvg ? pin.reviewAvg.toFixed(1) : '';
      const icon = createColoredIcon(color, ratingLabel);

      const marker = L.marker([lat, lng], { icon });

      const specialtyLabel = typeof pin.specialty === 'object'
        ? (pin.specialty?.[lang] || pin.specialty?.ru || '')
        : (pin.specialty || '');

      marker.bindPopup(`
        <div style="min-width:180px; font-family:sans-serif;">
          <p style="font-weight:700; font-size:14px; margin:0 0 4px;">${pin.name}</p>
          ${specialtyLabel ? `<p style="color:#2563eb; font-size:12px; margin:0 0 4px;">${specialtyLabel}</p>` : ''}
          ${pin.address ? `<p style="color:#666; font-size:11px; margin:0 0 8px;">📍 ${pin.address}</p>` : ''}
          ${pin.reviewAvg ? `<p style="color:#f59e0b; font-size:12px; margin:0 0 8px;">⭐ ${pin.reviewAvg}</p>` : ''}
          ${pin.slug ? `<a href="/${lang}/doctor/${pin.slug}" style="display:block; background:#2563eb; color:white; text-align:center; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:bold; text-decoration:none;">Профиль →</a>` : ''}
        </div>
      `);

      marker.on('click', () => {
        if (onPinClick && pin.slug) onPinClick(pin.slug);
      });

      marker.addTo(markersRef.current!);
    });

    // Маркер пользователя
    if (userLocation) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(239,68,68,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(markersRef.current!)
        .bindPopup('Вы здесь');
    }
  }, [pins, userLocation, lang, onPinClick]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200"
      style={{ height: '100%', minHeight: '350px' }}
    />
  );
}
