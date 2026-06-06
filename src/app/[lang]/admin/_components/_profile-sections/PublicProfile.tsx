'use client';
import { Field, Textarea, SectionHeader, strField } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function PublicProfile({ profile, setProfile }: Props) {
  const workplaceValue = strField(profile.workplace);
  const educationValue = strField(profile.education);
  const bioValue = strField(profile.bio);

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-7">
      <SectionHeader
        title="Публичный профиль"
        subtitle="Повышает доверие пациентов и рейтинг в поиске (Google E-E-A-T)"
        accent
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          icon="🏛️"
          label="Место работы"
          value={workplaceValue}
          onChange={(v) => setProfile((p: any) => ({ ...p, workplace: v }))}
          placeholder="Городская больница №1, Душанбе"
          hint="Будет переведено на все языки автоматически"
        />
        <Field
          icon="🎓"
          label="Образование"
          value={educationValue}
          onChange={(v) => setProfile((p: any) => ({ ...p, education: v }))}
          placeholder="ТГМУ, Лечебное дело, 2010"
          hint="Будет переведено на все языки автоматически"
        />
        <div className="md:col-span-2">
          <Field
            icon="🔗"
            label="Внешние профили — sameAs (через запятую)"
            value={profile.sameAs?.join(', ') || ''}
            onChange={(v) =>
              setProfile((p: any) => ({
                ...p,
                sameAs: v.split(',').map((l: string) => l.trim()).filter(Boolean),
              }))
            }
            placeholder="https://linkedin.com/in/..., https://researchgate.net/profile/..."
            hint="LinkedIn, ResearchGate, медреестр — повышают доверие Google"
          />
        </div>
        <div className="md:col-span-2">
          <Textarea
            icon="📝"
            label="Биография"
            value={bioValue}
            onChange={(v) => setProfile((p: any) => ({ ...p, bio: v }))}
            placeholder="Кардиолог с 12-летним стажем. Специализируюсь на аритмиях и сердечной недостаточности. Работаю в Республиканском кардиологическом центре Душанбе."
            hint="2–3 предложения об опыте и специализации. Переведётся автоматически."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
