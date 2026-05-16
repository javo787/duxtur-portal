'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

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

interface RouteInfo {
  distance: number;
  time: number;
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
    html: `<div style="width:36px;height:36px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:10px;font-weight:bold;">${label || ''}</span></div>`,
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
  // Store route info in a ref to avoid triggering re-renders during cleanup
  const routeInfoRef = useRef<RouteInfo | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  // Track whether component is mounted to avoid setState after unmount
  const mountedRef = useRef(true);

  const defaultCenter: [number, number] = center || [38.559, 68.773];

  // ── Map init (runs once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter,
      zoom,
      zoomControl: false,
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
        const color = count > 50 ? '#dc2626' : count > 10 ? '#eab308' : '#16a34a';
        return L.divIcon({
          html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [40, 40],
        });
      },
    }).addTo(map);

    map.on('moveend', () => {
      if (onMapBoundsChange) onMapBoundsChange(map.getBounds());
    });

    mapRef.current = map;

    return () => {
      mountedRef.current = false;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tracking mode ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    if (trackingMode) {
      if (!navigator.geolocation) return;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!mapRef.current) return;
          const { latitude, longitude, accuracy } = pos.coords;
          const latlng = L.latLng(latitude, longitude);

          if (!userMarkerRef.current) {
            const pulseIcon = L.divIcon({
              className: 'user-location-pulse',
              html: `<div class="pulse-dot"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });
            userMarkerRef.current = L.marker(latlng, { icon: pulseIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
          } else {
            userMarkerRef.current.setLatLng(latlng);
          }

          if (!userAccuracyRef.current) {
            userAccuracyRef.current = L.circle(latlng, {
              radius: accuracy,
              color: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 0.15,
              weight: 1,
            }).addTo(mapRef.current);
          } else {
            userAccuracyRef.current.setLatLng(latlng).setRadius(accuracy);
          }
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      userAccuracyRef.current?.remove();
      userAccuracyRef.current = null;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [trackingMode]);

  // ── Zoom sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current && mapRef.current.getZoom() !== zoom) {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // ── Route building ──────────────────────────────────────────────────────
  useEffect(() => {
    // Clear route when targetDoctor is null
    if (!targetDoctor || !userLocation) {
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      // Only update state if it actually changed (avoids render during cleanup)
      if (routeInfoRef.current !== null) {
        routeInfoRef.current = null;
        if (mountedRef.current) setRouteInfo(null);
      }
      return;
    }

    let cancelled = false;

    async function fetchRoute() {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLocation!.lng},${userLocation!.lat};${targetDoctor!.lng},${targetDoctor!.lat}?overview=full&geometries=geojson`
        );
        if (cancelled || !mapRef.current) return;

        const data = await res.json();
        if (data.routes?.[0]) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          routeLayerRef.current?.remove();
          routeLayerRef.current = L.polyline(coordinates as L.LatLngExpression[], {
            color: '#2563eb',
            weight: 4,
            opacity: 0.8,
          }).addTo(mapRef.current);

          mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });

          const info: RouteInfo = {
            distance: route.distance / 1000,
            time: Math.round(route.duration / 60),
          };
          routeInfoRef.current = info;
          if (mountedRef.current) setRouteInfo(info);
        }
      } catch (err) {
        console.warn('Route building error:', err);
      }
    }

    fetchRoute();

    return () => { cancelled = true; };
  }, [targetDoctor, userLocation]);

  // ── Markers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    for (const pin of pins) {
      const lat = pin.coordinates?.lat;
      const lng = pin.coordinates?.lng;
      if (!lat || !lng || !isFinite(lat) || !isFinite(lng)) continue;

      const color = PIN_COLORS[pin.type ?? 'default'] ?? PIN_COLORS.default;
      const ratingLabel = pin.reviewAvg ? pin.reviewAvg.toFixed(1) : '';
      const icon = createColoredIcon(color, ratingLabel);
      const marker = L.marker([lat, lng], { icon });

      const specialtyLabel = typeof pin.specialty === 'object'
        ? (pin.specialty?.[lang] || pin.specialty?.ru || '')
        : (pin.specialty || '');

      marker.bindPopup(`
        <div style="min-width:180px;font-family:sans-serif;">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${pin.name}</p>
          ${specialtyLabel ? `<p style="color:#2563eb;font-size:12px;margin:0 0 4px;">${specialtyLabel}</p>` : ''}
          ${pin.address ? `<p style="color:#666;font-size:11px;margin:0 0 8px;">📍 ${pin.address}</p>` : ''}
          ${pin.reviewAvg ? `<p style="color:#f59e0b;font-size:12px;margin:0 0 8px;">⭐ ${pin.reviewAvg}</p>` : ''}
          ${pin.slug ? `<a href="/${lang}/doctor/${pin.slug}" style="display:block;background:#2563eb;color:white;text-align:center;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:bold;text-decoration:none;">Профиль →</a>` : ''}
        </div>
      `);

      if (onPinClick && pin.slug) {
        const slug = pin.slug;
        marker.on('click', () => onPinClick(slug));
      }

      markersRef.current.addLayer(marker);
    }

    // Static user marker (non-tracking mode)
    if (userLocation && !trackingMode) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(239,68,68,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(markersRef.current)
        .bindPopup('Вы здесь');
    }
  }, [pins, userLocation, lang, onPinClick, trackingMode]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        .user-location-pulse { position: relative; }
        .pulse-dot { width:14px;height:14px;background:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 0 0 2px rgba(37,99,235,0.4); }
        .pulse-dot::after { content:'';position:absolute;width:100%;height:100%;background:#2563eb;border-radius:50%;animation:pulse 2s infinite; }
        @keyframes pulse { 0%{transform:scale(1);opacity:0.6}100%{transform:scale(3.5);opacity:0} }
      `}</style>

      <div
        ref={containerRef}
        className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200"
        style={{ minHeight: '350px' }}
      />

      {routeInfo && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-[1000]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Маршрут построен</p>
          <p className="text-sm font-black text-slate-900">
            {routeInfo.distance.toFixed(1)} км · {routeInfo.time} мин
          </p>
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
