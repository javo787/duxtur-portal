'use client';
import { SectionHeader } from './_shared';

interface Props {
  profile: any;
  setProfile: (p: any) => void;
}

export default function CardDesign({ profile, setProfile }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
      <SectionHeader title="Дизайн визитки" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color picker */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-3">
            🎨 Акцентный цвет
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={profile.accentColor || '#2563eb'}
              onChange={(e) => setProfile((p: any) => ({ ...p, accentColor: e.target.value }))}
              className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer p-0.5 bg-white"
            />
            <div>
              <p className="text-sm font-mono text-slate-700">{profile.accentColor || '#2563eb'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Цвет кнопок и полос визитки</p>
            </div>
          </div>
        </div>

        {/* Theme select */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-3">
            🌓 Тема визитки
          </label>
          <div className="flex gap-2">
            {(['dark', 'light'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => setProfile((p: any) => ({ ...p, cardTheme: theme }))}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-150
                  ${profile.cardTheme === theme || (!profile.cardTheme && theme === 'dark')
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                {theme === 'dark' ? '🌑 Тёмная' : '☀️ Светлая'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {profile.cardTheme === 'light' ? 'Экономит чернила при печати' : 'Рекомендуется для экранов'}
          </p>
        </div>
      </div>
    </div>
  );
}
