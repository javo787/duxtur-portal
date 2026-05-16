'use client';

import { useState, useEffect } from 'react';
import AddPlaceModal from './AddPlaceModal';

export default function PlacesSection() {
  const [places, setPlaces] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/places');
      const data = await res.json();
      setPlaces(data.places || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это место?')) return;
    try {
      const res = await fetch(`/api/admin/places?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPlaces();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-white">🗺 Места</h2>
          {total > 0 && (
            <span className="bg-blue-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full">
              {total}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
        >
          + Добавить место
        </button>
      </div>

      <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Загрузка...</div>
        ) : places.length === 0 ? (
          <div className="p-10 text-center text-gray-600">Нет добавленных мест</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Название</th>
                  <th className="px-6 py-4">Тип</th>
                  <th className="px-6 py-4">Город / Адрес</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {places.map((place) => (
                  <tr key={place._id} className="hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white text-sm">{place.name?.ru || place.name}</p>
                      <p className="text-[10px] text-gray-500">{place.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                        {place.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-400">{place.city}</p>
                      <p className="text-[10px] text-gray-500">{place.address}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(place._id)}
                        className="text-red-500 hover:text-red-400 font-bold text-xs"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddPlaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPlaces}
      />
    </section>
  );
}
