'use client';
import { Field, SectionHeader } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function AppointmentsPricing({ profile, setProfile }: Props) {
  const types = profile.consultationTypes || ['in_person'];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
      <SectionHeader title="Прием и цены" />
      <div className="space-y-6">
        {/* Принимает новых */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Принимает новых пациентов</p>
            <p className="text-xs text-slate-400">Отображается в поиске</p>
          </div>
          <button
            onClick={() => setProfile((p: any) => ({ ...p, acceptsNewPatients: !p.acceptsNewPatients }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${profile.acceptsNewPatients !== false ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.acceptsNewPatients !== false ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Типы консультаций */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
            Типы консультаций
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'in_person', label: '🏥 Очно' },
              { id: 'online', label: '💻 Онлайн' },
              { id: 'home_visit', label: '🏠 На дому' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  const next = types.includes(type.id)
                    ? types.filter((t: string) => t !== type.id)
                    : [...types, type.id];
                  setProfile((p: any) => ({ ...p, consultationTypes: next }));
                }}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all
                  ${types.includes(type.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Цены */}
        <div className="grid grid-cols-2 gap-4">
          <Field
            icon="💰"
            label="Цена от (TJS)"
            value={profile.priceRange?.min?.toString() || '0'}
            onChange={(v) =>
              setProfile((p: any) => ({
                ...p,
                priceRange: { ...p.priceRange, min: parseInt(v) || 0 },
              }))
            }
            type="number"
          />
          <Field
            icon="💰"
            label="Цена до (TJS)"
            value={profile.priceRange?.max?.toString() || '0'}
            onChange={(v) =>
              setProfile((p: any) => ({
                ...p,
                priceRange: { ...p.priceRange, max: parseInt(v) || 0 },
              }))
            }
            type="number"
          />
        </div>
      </div>
    </div>
  );
}
