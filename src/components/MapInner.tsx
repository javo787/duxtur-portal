'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

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
  onMapBoundsChange?: (bounds: L.LatLngBounds) => void;
  userLocation?: { lat: number; lng: number };
  lang?: string;
  center?: [number, number];
  zoom?: number;
  trackingMode?: boolean;
  targetDoctor?: { lat: number; lng: number; name: string } | null;
  onClearRoute?: () => void;
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
  onMapBoundsChange,
  userLocation,
  lang = 'ru',
  center,
  zoom = 13,
  trackingMode = false,
  targetDoctor = null,
  onClearRoute,
}: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null);

  const defaultCenter: [number, number] = center || [38.559, 68.773]; // Душанбе

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: userLocation
        ? [userLocation.lat, userLocation.lng]
        : defaultCenter,
      zoom,
      zoomControl: false, // We'll add custom zoom controls in Task 3, but let's keep it false here as requested
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // @ts-ignore
    markersRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let color = '#16a34a'; // green
        if (count > 10) color = '#eab308'; // yellow
        if (count > 50) color = '#dc2626'; // red

        return L.divIcon({
          html: `<div style="background:${color}; width:40px; height:40px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; box-shadow:0 2px 8px rgba(0,0,0,0.2);">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [40, 40]
        });
      }
    }).addTo(map);

    map.on('moveend', () => {
      if (onMapBoundsChange) {
        onMapBoundsChange(map.getBounds());
      }
    });

    mapRef.current = map;

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Real-time tracking
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (trackingMode) {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            const latlng = L.latLng(latitude, longitude);

            if (!userMarkerRef.current) {
              const pulseIcon = L.divIcon({
                className: 'user-location-pulse',
                html: `<div class="pulse-dot"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });
              userMarkerRef.current = L.marker(latlng, { icon: pulseIcon, zIndexOffset: 1000 }).addTo(map);
            } else {
              userMarkerRef.current.setLatLng(latlng);
            }

            if (!userAccuracyRef.current) {
              userAccuracyRef.current = L.circle(latlng, {
                radius: accuracy,
                color: '#2563eb',
                fillColor: '#2563eb',
                fillOpacity: 0.15,
                weight: 1
              }).addTo(map);
            } else {
              userAccuracyRef.current.setLatLng(latlng).setRadius(accuracy);
            }

            // map.setView(latlng); // Optionally auto-center
          },
          (err) => console.error("Geolocation error:", err),
          { enableHighAccuracy: true }
        );
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyRef.current) {
        userAccuracyRef.current.remove();
        userAccuracyRef.current = null;
      }
    }
  }, [trackingMode]);

  // Sync zoom
  useEffect(() => {
    if (mapRef.current && mapRef.current.getZoom() !== zoom) {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // Route building
  useEffect(() => {
    if (!mapRef.current || !targetDoctor || !userLocation) {
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      // Use setTimeout to avoid synchronous setState during render/effect if needed,
      // though typically this is fine in useEffect.
      // But let's follow standard React patterns.
      if (routeInfo) setRouteInfo(null);
      return;
    }

    async function fetchRoute() {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation!.lng},${userLocation!.lat};${targetDoctor!.lng},${targetDoctor!.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          if (routeLayerRef.current) routeLayerRef.current.remove();

          routeLayerRef.current = L.polyline(coordinates as L.LatLngExpression[], {
            color: '#2563eb',
            weight: 4,
            opacity: 0.8
          }).addTo(mapRef.current!);

          mapRef.current!.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
          setRouteInfo({
            distance: route.distance / 1000,
            time: Math.round(route.duration / 60)
          });
        }
      } catch (err) {
        console.error("Route building error:", err);
      }
    }

    fetchRoute();
  }, [targetDoctor, userLocation]);

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

    // Static user marker if not tracking
    if (userLocation && !trackingMode) {
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
  }, [pins, userLocation, lang, onPinClick, trackingMode]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        .user-location-pulse { position: relative; }
        .pulse-dot {
          width: 14px; height: 14px;
          background: #2563eb;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.4);
        }
        .pulse-dot::after {
          content: '';
          position: absolute;
          width: 100%; height: 100%;
          background: #2563eb;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(3.5); opacity: 0; }
        }
      `}</style>

      <div
        ref={containerRef}
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200"
        style={{ minHeight: '350px' }}
      />

      {routeInfo && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Маршрут построен</p>
          <p className="text-sm font-black text-slate-900">{routeInfo.distance.toFixed(1)} км · {routeInfo.time} мин</p>
          <button
            onClick={onClearRoute}
            className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700"
          >
            Сбросить маршрут
          </button>
        </div>
      )}
    </div>
  );
}
