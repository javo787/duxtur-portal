import React from 'react';

interface MapLoadingSpinnerProps {
  isLoading: boolean;
}

export function MapLoadingSpinner({ isLoading }: MapLoadingSpinnerProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2" style={{ zIndex: 1001 }}>
      <div className="bg-white px-4 py-2 rounded-full shadow-2xl border border-slate-100 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-slate-600">Загрузка...</span>
      </div>
    </div>
  );
}
