import React from 'react';

interface MapFloatingControlsProps {
  trackingMode: boolean;
  onToggleTracking: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function MapFloatingControls({
  trackingMode,
  onToggleTracking,
  zoom,
  onZoomChange,
}: MapFloatingControlsProps) {
  return (
    <>
      {/* Tracking Button */}
      <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
        <button
          onClick={onToggleTracking}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${
            trackingMode
              ? 'bg-blue-600 border-blue-700 text-white'
              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
          }`}
          title="Моё местоположение"
        >
          📍
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-32 md:bottom-10 right-4 flex flex-col gap-1" style={{ zIndex: 1000 }}>
        <button
          onClick={() => onZoomChange(Math.min(zoom + 1, 19))}
          className="w-10 h-10 bg-white border border-slate-100 rounded-t-xl flex items-center justify-center font-bold text-slate-600 shadow-lg hover:bg-slate-50 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => onZoomChange(Math.max(zoom - 1, 1))}
          className="w-10 h-10 bg-white border border-slate-100 rounded-b-xl flex items-center justify-center font-bold text-slate-600 shadow-lg hover:bg-slate-50 transition-colors"
        >
          −
        </button>
      </div>
    </>
  );
}
