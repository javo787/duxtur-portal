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
      </div>
    </div>
  );
}
