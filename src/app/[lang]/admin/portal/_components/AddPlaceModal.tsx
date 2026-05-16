'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MapPreview = dynamic(() => import('@/components/MapInner'), { ssr: false });

export default function AddPlaceModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'clinic',
    city: '',
    address: '',
    phone: '',
    workingHours: '',
    coordinates: { lat: 38.559, lng: 68.773, type: 'Point', coordinates: [68.773, 38.559] }
  });

  if (!isOpen) return null;

  const handleGeocode = async () => {
    if (!formData.address) return;
    setGeocoding(true);
    try {
      const query = `${formData.address}${formData.city ? ', ' + formData.city : ''}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Duxtur.org/1.0' }
      });
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setFormData({
          ...formData,
          coordinates: { lat, lng, type: 'Point', coordinates: [lng, lat] }
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Добавить место</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Название (RU)</label>
              <input
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Тип</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="clinic">Клиника</option>
                <option value="pharmacy">Аптека</option>
                <option value="hospital">Больница</option>
                <option value="lab">Лаборатория</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Город</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Адрес</label>
              <div className="flex gap-2">
                <input
                  required
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding}
                  className="bg-gray-700 hover:bg-gray-600 px-4 rounded-xl text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {geocoding ? '...' : '📍 Найти'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Телефон</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Часы работы</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                value={formData.workingHours}
                onChange={e => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="Пн-Пт 08:00-18:00"
              />
            </div>
          </div>

          <div className="h-48 w-full rounded-2xl overflow-hidden bg-gray-800 border border-gray-700">
             <MapPreview
                pins={[{
                    _id: 'preview',
                    name: formData.name || 'Preview',
                    type: formData.type as any,
                    coordinates: { lat: formData.coordinates.lat, lng: formData.coordinates.lng }
                }]}
                center={[formData.coordinates.lat, formData.coordinates.lng]}
                zoom={15}
             />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition shadow-xl shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'СОХРАНИТЬ МЕСТО'}
          </button>
        </form>
      </div>
    </div>
  );
}
