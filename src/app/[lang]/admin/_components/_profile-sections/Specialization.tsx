'use client';
import { Field, SectionHeader, strField } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function Specialization({ profile, setProfile }: Props) {
  const specialtyValue = strField(profile.specialty);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
      <SectionHeader
        title="Специализация"
        subtitle="Введите специализацию — остальные языки переведутся автоматически при сохранении"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          icon="🩺"
          label="Специализация (на русском)"
          value={specialtyValue}
          onChange={(v) => setProfile((p: any) => ({ ...p, specialty: v }))}
          placeholder="Кардиолог"
          hint="Будет автоматически переведена на uz, kk, ky, tg"
        />
        <Field
          icon="⏱"
          label="Стаж (лет)"
          value={profile.experience?.toString() || '0'}
          onChange={(v) => setProfile((p: any) => ({ ...p, experience: parseInt(v) || 0 }))}
          placeholder="10"
          type="number"
        />
        <div className="md:col-span-2">
          <Field
            icon="🌐"
            label="Языки консультации (через запятую)"
            value={profile.languages?.join(', ') || ''}
            onChange={(v) =>
              setProfile((p: any) => ({
                ...p,
                languages: v.split(',').map((l: string) => l.trim()).filter(Boolean),
              }))
            }
            placeholder="Русский, Тоҷикӣ, O'zbek, English"
          />
        </div>
        <div className="md:col-span-2">
          <ExpertiseTagsField profile={profile} setProfile={setProfile} />
        </div>
      </div>
    </div>
  );
}

function ExpertiseTagsField({ profile, setProfile }: Props) {
  const tags: any[] = profile.expertiseTags || [];
  const values = tags.map((t) => (typeof t === 'string' ? t : strField(t)));

  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
        🎯 Направления и процедуры
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold"
          >
            {tag}
            <button
              onClick={() => {
                const next = [...tags];
                next.splice(i, 1);
                setProfile((p: any) => ({ ...p, expertiseTags: next }));
              }}
              className="text-blue-400 hover:text-blue-700"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Например: ЭКГ, УЗИ сердца — Enter, чтобы добавить"
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8 focus:bg-white"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const value = (e.target as HTMLInputElement).value.trim();
            if (value) {
              setProfile((p: any) => ({ ...p, expertiseTags: [...tags, value] }));
              (e.target as HTMLInputElement).value = '';
            }
          }
        }}
      />
      <p className="text-[11px] text-slate-400 mt-1.5">Конкретные процедуры и услуги — переводятся автоматически</p>
    </div>
  );
}
