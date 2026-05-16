'use client';

import Link from 'next/link';

interface ProfileCompletionBannerProps {
  doctor: any;
  lang: string;
}

export default function ProfileCompletionBanner({ doctor, lang }: ProfileCompletionBannerProps) {
  const steps = [
    { key: 'image', weight: 15, label: 'Фото профиля' },
    { key: 'bio', weight: 15, label: 'Биография' },
    { key: 'specialty', weight: 10, label: 'Специализация' },
    { key: 'experience', weight: 10, label: 'Стаж' },
    { key: 'languages', weight: 10, label: 'Языки' },
    { key: 'city', weight: 10, label: 'Город' },
    { key: 'priceRange', weight: 10, label: 'Цена' },
    { key: 'schedule', weight: 10, label: 'График работы' },
    { key: 'consultationTypes', weight: 10, label: 'Типы консультаций' },
  ];

  const t = (field: any) => field?.ru || field?.uz || field?.tg || field?.kk || field?.ky || '';

  const checkCompletion = (key: string) => {
    const val = doctor[key];
    if (key === 'image') return !!val && val !== 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
    if (key === 'bio' || key === 'specialty') return !!t(val);
    if (key === 'languages' || key === 'consultationTypes') return Array.isArray(val) && val.length > 0;
    if (key === 'experience') return typeof val === 'number' && val > 0;
    if (key === 'priceRange') return (val?.min || 0) > 0;
    if (key === 'schedule') return val && Object.values(val).some((d: any) => d.isWorking);
    return !!val;
  };

  const completedSteps = steps.filter(s => checkCompletion(s.key));
  const score = completedSteps.reduce((acc, s) => acc + s.weight, 0);
  const remainingSteps = steps.filter(s => !checkCompletion(s.key));

  if (score === 100) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900">Заполненность профиля: {score}%</h3>
          {score < 60 && (
             <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase">Профиль неполный</span>
          )}
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-1000 ${score < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>

        {remainingSteps.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Осталось заполнить:</p>
            <div className="flex flex-wrap gap-2">
              {remainingSteps.map(s => (
                <span key={s.key} className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                  + {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {score < 60 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <p className="text-xs text-blue-800 leading-relaxed">
              Ваш профиль заполнен менее чем на 60%. Пациенты реже находят и выбирают врачей с неполными данными. Заполните все поля, чтобы повысить доверие!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
