'use client';
import { SectionHeader } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

const DAYS = [
  { id: 'mon', label: 'Понедельник' },
  { id: 'tue', label: 'Вторник' },
  { id: 'wed', label: 'Среда' },
  { id: 'thu', label: 'Четверг' },
  { id: 'fri', label: 'Пятница' },
  { id: 'sat', label: 'Суббота' },
  { id: 'sun', label: 'Воскресенье' },
];

export default function Schedule({ profile, setProfile }: Props) {
  const schedule = profile.schedule || {};

  const toggleDay = (day: string) => {
    setProfile((p: any) => ({
      ...p,
      schedule: {
        ...p.schedule,
        [day]: {
          ...(p.schedule?.[day] || {}),
          isWorking: !p.schedule?.[day]?.isWorking,
        },
      },
    }));
  };

  const copyMonToFri = () => {
    const mon = schedule.mon || { open: '09:00', close: '18:00', isWorking: true };
    setProfile((p: any) => ({
      ...p,
      schedule: {
        ...p.schedule,
        tue: { ...mon },
        wed: { ...mon },
        thu: { ...mon },
        fri: { ...mon },
      },
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
      <SectionHeader title="График работы" />
      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day.id} className="flex flex-col md:flex-row md:items-center gap-4 py-3 border-b border-slate-50 last:border-0">
            <div className="w-32">
              <p className="text-sm font-bold text-slate-700">{day.label}</p>
              <button
                onClick={() => toggleDay(day.id)}
                className={`text-[10px] font-bold uppercase mt-1 ${
                  schedule[day.id]?.isWorking ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {schedule[day.id]?.isWorking ? '● Работает' : '○ Выходной'}
              </button>
            </div>

            {schedule[day.id]?.isWorking && (
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="time"
                  value={schedule[day.id]?.open || '09:00'}
                  onChange={(e) =>
                    setProfile((p: any) => ({
                      ...p,
                      schedule: {
                        ...p.schedule,
                        [day.id]: { ...(p.schedule?.[day.id] || {}), open: e.target.value },
                      },
                    }))
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
                <span className="text-slate-400">—</span>
                <input
                  type="time"
                  value={schedule[day.id]?.close || '18:00'}
                  onChange={(e) =>
                    setProfile((p: any) => ({
                      ...p,
                      schedule: {
                        ...p.schedule,
                        [day.id]: { ...(p.schedule?.[day.id] || {}), close: e.target.value },
                      },
                    }))
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
                {day.id === 'mon' && (
                  <button
                    onClick={copyMonToFri}
                    className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition"
                  >
                    Копировать Пн–Пт
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
