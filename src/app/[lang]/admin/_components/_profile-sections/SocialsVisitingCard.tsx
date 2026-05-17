'use client';
import { Field, SectionHeader } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function SocialsVisitingCard({ profile, setProfile }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
      <SectionHeader
        title="Соцсети и визитка"
        subtitle="Отображаются на визитке и помогают пациентам связаться с вами"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          icon="📸"
          label="Instagram"
          value={profile.instagram || ''}
          onChange={(v) => setProfile((p: any) => ({ ...p, instagram: v }))}
          placeholder="https://instagram.com/your.profile"
          hint="Полная ссылка на профиль"
        />
        <Field
          icon="✈️"
          label="Telegram"
          value={profile.telegram || ''}
          onChange={(v) => setProfile((p: any) => ({ ...p, telegram: v }))}
          placeholder="https://t.me/yourprofile"
          hint="t.me/username"
        />
        <Field
          icon="💬"
          label="WhatsApp"
          value={profile.whatsapp || ''}
          onChange={(v) => setProfile((p: any) => ({ ...p, whatsapp: v }))}
          placeholder="https://wa.me/992XXXXXXXXX"
          hint="wa.me/номер без пробелов"
        />
        <Field
          icon="🕐"
          label="Часы для визитки"
          value={profile.workingHours || ''}
          onChange={(v) => setProfile((p: any) => ({ ...p, workingHours: v }))}
          placeholder="Пн–Пт, 9:00–16:00"
          hint="Короткая строка для PDF-визитки"
        />
      </div>
    </div>
  );
}
