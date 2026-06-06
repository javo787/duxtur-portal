'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n';

export default function NearMeButton({ lang }: { lang: string }) {
  const { t } = useT(lang);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert(t('doctors.noGeolocation'));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const params = new URLSearchParams(searchParams.toString());
        params.set('lat', latitude.toString());
        params.set('lng', longitude.toString());
        params.set('radius', '20'); // 20km radius default
        router.push(`?${params.toString()}`);
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert(t('doctors.geolocationError'));
        setLoading(false);
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleNearMe}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition disabled:opacity-50`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{t('doctors.nearMe')}</span>
      )}
    </button>
  );
}
