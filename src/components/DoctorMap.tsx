'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] md:h-[500px] bg-slate-100 flex items-center justify-center">
      <p className="text-slate-400 font-bold animate-pulse">Загрузка карты...</p>
    </div>
  )
});

export default function DoctorMap(props: any) {
  return <MapComponent {...props} />;
}
