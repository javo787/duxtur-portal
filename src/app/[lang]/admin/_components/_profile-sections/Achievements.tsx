'use client';
import { SectionHeader, strField } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

const TYPE_OPTIONS = [
  { value: 'award', label: '🏆 Награда', placeholder: 'Лучший врач года — Минздрав РТ' },
  { value: 'certification', label: '📜 Сертификат', placeholder: 'Сертификат УЗИ-диагностики' },
  { value: 'membership', label: '🎓 Членство', placeholder: 'Член Ассоциации кардиологов РТ' },
  { value: 'publication', label: '📚 Публикация', placeholder: 'Статья в журнале «Здравоохранение Таджикистана»' },
];

export default function Achievements({ profile, setProfile }: Props) {
  const items: any[] = profile.achievements || [];

  const update = (index: number, patch: Record<string, any>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    setProfile((p: any) => ({ ...p, achievements: next }));
  };

  const remove = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setProfile((p: any) => ({ ...p, achievements: next }));
  };

  const add = () => {
    setProfile((p: any) => ({
      ...p,
      achievements: [...items, { type: 'award', title: '', issuer: '', year: new Date().getFullYear() }],
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-7">
      <SectionHeader
        title="Награды и достижения"
        subtitle="Сертификаты, членства в проф. сообществах, публикации — то, что не поместилось в «Образование»"
        accent
      />

      <div className="space-y-3">
        {items.map((item, index) => {
          const titleValue = typeof item.title === 'string' ? item.title : strField(item.title);
          const opt = TYPE_OPTIONS.find((o) => o.value === item.type) || TYPE_OPTIONS[0];
          return (
            <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <select
                  value={item.type || 'award'}
                  onChange={(e) => update(index, { type: e.target.value })}
                  className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-500"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => remove(index)}
                  className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0"
                >
                  Удалить
                </button>
              </div>
              <input
                type="text"
                value={titleValue}
                onChange={(e) => update(index, { title: e.target.value })}
                placeholder={opt.placeholder}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={item.issuer || ''}
                  onChange={(e) => update(index, { issuer: e.target.value })}
                  placeholder="Кем выдано (необязательно)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8"
                />
                <input
                  type="number"
                  value={item.year || ''}
                  onChange={(e) => update(index, { year: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Год"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8"
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={add}
        className="w-full mt-3 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition"
      >
        + Добавить достижение
      </button>
    </div>
  );
}
