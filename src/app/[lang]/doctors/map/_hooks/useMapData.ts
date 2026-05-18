import { useState, useEffect, useCallback, useRef } from 'react';

interface Filters {
  specialty: string;
  city: string;
  priceMin: string;
  priceMax: string;
  consultationType: string;
  accepts: string;
  radius: string;
}

export function useMapData(filters: Filters, userLocation: { lat: number; lng: number } | undefined, lang: string) {
  const [allPins, setAllPins] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
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
        fetch(`/api/doctors/map?${sp.toString()}`).then((r) => r.json()),
        fetch(`/api/places?${placesSp.toString()}`).then((r) => r.json()),
      ]);

      // Безопасное извлечение координат и фильтрация записей без корректных lat/lng
      const doctorPins = (doctors || [])
        .map((d: any) => {
          const lat = d.coordinates?.lat ?? d.coordinates?.coordinates?.[1];
          const lng = d.coordinates?.lng ?? d.coordinates?.coordinates?.[0];
          return {
            ...d,
            type: 'doctor',
            coordinates: {
              lat: (lat !== undefined && lat !== null && !isNaN(Number(lat))) ? Number(lat) : undefined,
              lng: (lng !== undefined && lng !== null && !isNaN(Number(lng))) ? Number(lng) : undefined,
            },
          };
        })
        .filter((d: any) => d.coordinates.lat !== undefined && d.coordinates.lng !== undefined);

      const placePins = (places || [])
        .map((p: any) => {
          const lat = p.coordinates?.lat ?? p.coordinates?.coordinates?.[1];
          const lng = p.coordinates?.lng ?? p.coordinates?.coordinates?.[0];
          return {
            _id: p._id,
            name: p.name?.[lang] || p.name?.ru || p.name,
            type: p.type,
            coordinates: {
              lat: (lat !== undefined && lat !== null && !isNaN(Number(lat))) ? Number(lat) : undefined,
              lng: (lng !== undefined && lng !== null && !isNaN(Number(lng))) ? Number(lng) : undefined,
            },
            address: p.address,
          };
        })
        .filter((p: any) => p.coordinates.lat !== undefined && p.coordinates.lng !== undefined);

      const pins = [...doctorPins, ...placePins];
      setAllPins(pins);

      const doctorsOnly = pins.filter((p) => p.type === 'doctor');
      setAllDoctors([...doctorsOnly].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)));
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, userLocation, lang]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadData();
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadData]);

  return { allPins, allDoctors, isLoading, reload: loadData };
}
