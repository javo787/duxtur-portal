'use client';

import { useEffect, useState } from 'react';
import { getCachedMap, cacheMap } from '@/lib/indexeddb-cache';

/**
 * Статичное превью карты по координатам с офлайн-кэшем в IndexedDB:
 * при первом успешном показе картинка кэшируется, при повторном заходе
 * (в том числе офлайн) отдаётся из кэша вместо сети.
 */
export function useMapPreview(coordinates: { lat: number; lng: number }) {
  const [mapPreviewLoading, setMapPreviewLoading] = useState(false);
  const [mapPreviewError, setMapPreviewError] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (coordinates.lat === 0) return;
    const key = `map_${coordinates.lat}_${coordinates.lng}`;
    const primaryUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=600x300&markers=${coordinates.lat},${coordinates.lng},red-pushpin`;

    const loadMap = async () => {
      const cached = await getCachedMap(key, 7);
      if (cached) {
        setMapPreviewUrl(cached);
        setMapPreviewLoading(false);
        setMapPreviewError(false);
        setIsCached(true);
      } else {
        setMapPreviewUrl(primaryUrl);
        setIsCached(false);
      }
    };
    loadMap();
  }, [coordinates]);

  // Вызывается при смене координат (например, после выбора точки на карте) —
  // сбрасывает состояние показа под новую загрузку.
  const notifyCoordinatesChanged = () => {
    setMapPreviewLoading(true);
    setMapPreviewError(false);
  };

  const handleRetry = () => {
    setMapPreviewError(false);
    setMapPreviewLoading(true);
  };

  const handleImageError = () => {
    setMapPreviewLoading(false);
    setMapPreviewError(true);
  };

  const handleImageLoad = async () => {
    setMapPreviewLoading(false);
    if (mapPreviewUrl && mapPreviewUrl.startsWith('http')) {
      setIsCaching(true);
      const key = `map_${coordinates.lat}_${coordinates.lng}`;
      const success = await cacheMap(key, mapPreviewUrl);
      setIsCaching(false);
      if (success) setIsCached(true);
    }
  };

  return {
    mapPreviewUrl,
    mapPreviewLoading,
    mapPreviewError,
    isCaching,
    isCached,
    notifyCoordinatesChanged,
    handleRetry,
    handleImageError,
    handleImageLoad,
  };
}
