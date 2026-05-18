import { useState, useEffect } from 'react';

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        console.warn('Location permission denied', err);
        setError(err.message);
        setIsLoading(false);
      }
    );
  }, []);

  return { location, error, isLoading };
}
