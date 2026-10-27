'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus } from 'lucide-react';
import AddPlaceModal from './AddPlaceModal';

export default function PlacesSection() {
  const [places, setPlaces] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupLogs, setCleanupLogs] = useState<any[]>([]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/places');
      const data = await res.json();
      setPlaces(data.places || []);
      setTotal(data.total || 0);
      setDeletedCount(data.deletedCount || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupLogs = async () => {
    try {
      const res = await fetch('/api/admin/places/cleanup');
      const data = await res.json();
      setCleanupLogs(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPlaces();
    fetchCleanupLogs();
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

  const handleCleanup = async () => {
    if (!confirm(`Начать очистку? Будут удалены записи старше 90 дней (${deletedCount} в корзине)`)) return;
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/places/cleanup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Удалено записей: ${data.deletedCount}`);
        fetchPlaces();
        fetchCleanupLogs();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/25">
              <MapPin className="h-[18px] w-[18px] text-emerald-300" aria-hidden />
            </span>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-white">
              Места на карте
              {total > 0 && (
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
                  {total}
                </span>
              )}
            </h2>
          </div>
          {deletedCount > 0 && (
            <p className="text-[11px] text-gray-500">
              В корзине: <span className="text-red-400">{deletedCount}</span>
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="ml-2 text-sky-300 hover:underline disabled:opacity-50"
              >
                {cleaning ? 'Очистка...' : 'Очистить (90дн)'}
              </button>
            </p>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white ring-1 ring-inset ring-white/10 transition-[transform,background-color] duration-150 ease-premium hover:bg-white/10 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Добавить место
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Загрузка...</div>
        ) : places.length === 0 ? (
          <div className="p-10 text-center text-gray-600">Нет добавленных мест</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <th className="px-6 py-4">Название</th>
                  <th className="px-6 py-4">Тип</th>
                  <th className="px-6 py-4">Город / Адрес</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {places.map((place) => (
                  <tr key={place._id} className="transition-colors duration-150 hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white text-sm">{place.name?.ru || place.name}</p>
                      <p className="text-[10px] text-gray-500">{place.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase text-gray-300 ring-1 ring-inset ring-white/10">
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
                        className="text-xs font-medium text-red-300 hover:text-red-200 hover:underline"
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

      {cleanupLogs.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-5">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">История очистки</h3>
          <div className="space-y-3">
            {cleanupLogs.map((log) => (
              <div key={log._id} className="flex items-center justify-between text-[10px] font-bold">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{new Date(log.performedAt).toLocaleString('ru')}</span>
                  <span className={`px-2 py-0.5 rounded uppercase ${log.performedBy === 'cron' ? 'bg-purple-900/40 text-purple-400' : 'bg-blue-900/40 text-blue-400'}`}>
                    {log.performedBy}
                  </span>
                </div>
                <span className="text-emerald-400">-{log.deletedCount} записей</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddPlaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPlaces}
      />
    </section>
  );
}
