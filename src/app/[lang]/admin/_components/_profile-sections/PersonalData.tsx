'use client';
import { Field, SectionHeader } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function PersonalData({ profile, setProfile }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
      <SectionHeader title="Личные данные" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          icon="👤"
          label="Полное имя"
          value={profile.name || ''}
          onChange={(v) => setProfile((p: any) => ({ ...p, name: v }))}
          placeholder="Иванов Иван Иванович"
        />
        <Field
          icon="📞"
          label="Телефон"
          value={profile.phone || ''}
          onChange={(v) => setProfile((p: any) => ({ ...p, phone: v }))}
          placeholder="+992 XXX XXX XXX"
          hint="Не отображается на сайте — только для администрации"
        />
      </div>
    </div>
  );
}
