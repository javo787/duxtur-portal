'use client';
import { useState } from 'react';
import { SectionHeader } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
  onGeocode: () => void;
  isGeocoding: boolean;
  onOpenMapPicker?: () => void;
}

export default function LocationClinic({
  profile,
  setProfile,
  onGeocode,
  isGeocoding,
  onOpenMapPicker,
}: Props) {
  const [geoError, setGeoError] = useState('');

  // Геолокация через браузер
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Геолокация не поддерживается браузером');
      return;
    }
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfile((p: any) => ({
          ...p,
          coordinates: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            type: 'Point',
            coordinates: [pos.coords.longitude, pos.coords.latitude],
          },
        }));
      },
      (err) => {
        setGeoError('Не удалось получить местоположение: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Статическая карта OSM (без ключей)
  const mapPreviewUrl =
    profile.coordinates?.lat && profile.coordinates?.lng
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${profile.coordinates.lat},${profile.coordinates.lng}&zoom=16&size=600x180&markers=${profile.coordinates.lat},${profile.coordinates.lng},red-pushpin`
      : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
      <SectionHeader title="Локация и клиника" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Город */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Город
          </label>
          <select
            value={profile.city || ''}
            onChange={(e) => setProfile((p: any) => ({ ...p, city: e.target.value }))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
          >
            <option value="">Выберите город...</option>
            {[
              'Душанбе',
              'Худжанд',
              'Куляб',
              'Бохтар',
              'Ташкент',
              'Самарканд',
              'Алматы',
              'Бишкек',
              'Астана',
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="other">Другой город</option>
          </select>
          {profile.city === 'other' && (
            <input
              type="text"
              placeholder="Введите название города"
              className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              onChange={(e) => setProfile((p: any) => ({ ...p, city: e.target.value }))}
            />
          )}
        </div>

        {/* Район / Ориентир */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Район / Ориентир
          </label>
          <input
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
            placeholder="Исмоили Сомони, возле парка"
            value={profile.district || ''}
            onChange={(e) => setProfile((p: any) => ({ ...p, district: e.target.value }))}
          />
        </div>

        {/* Название клиники */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Название клиники
          </label>
          <input
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
            placeholder="Медицинский центр 'Сино'"
            value={profile.clinicName || ''}
            onChange={(e) => setProfile((p: any) => ({ ...p, clinicName: e.target.value }))}
          />
        </div>

        {/* Адрес + кнопки геокода и выбора на карте */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Адрес
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              placeholder="ул. Рудаки, 10"
              value={profile.address || ''}
              onChange={(e) => setProfile((p: any) => ({ ...p, address: e.target.value }))}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onGeocode}
                disabled={isGeocoding}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {isGeocoding ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  '📍'
                )}
                Найти на карте
              </button>
              {onOpenMapPicker && (
                <button
                  type="button"
                  onClick={onOpenMapPicker}
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0"
                >
                  🗺 Выбрать на карте
                </button>
              )}
            </div>
          </div>
          {geoError && <p className="text-xs text-red-500 mt-2">{geoError}</p>}
        </div>

        {/* Кнопка текущего местоположения */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="w-full py-3 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            📌 Использовать моё текущее местоположение
          </button>
        </div>

        {/* Превью карты (OpenStreetMap static) */}
        {mapPreviewUrl && (
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-700 font-bold">
                  Координаты: {profile.coordinates.lat.toFixed(4)},{' '}
                  {profile.coordinates.lng.toFixed(4)}
                </span>
              </div>
              {onOpenMapPicker && (
                <button
                  onClick={onOpenMapPicker}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  Изменить точку
                </button>
              )}
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-100 h-[180px]">
              <img
                src={mapPreviewUrl}
                alt="Предпросмотр карты"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
