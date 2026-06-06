export function strField(field: any, lang = 'ru'): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.ru || '';
}

export function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <svg
      className={`animate-spin ${size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'} text-current`}
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function Field({
  label, value, onChange, placeholder, type = 'text', hint, icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; icon?: string;
}) {
  return (
    <div className="group">
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
        {icon && <span className="text-xs">{icon}</span>}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl
          focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8
          outline-none transition-all duration-200 text-slate-800 text-sm
          placeholder:text-slate-300 group-hover:border-slate-300"
      />
      {hint && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

export function Textarea({
  label, value, onChange, placeholder, hint, icon, rows = 4,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; icon?: string; rows?: number;
}) {
  return (
    <div className="group">
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
        {icon && <span className="text-xs">{icon}</span>}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl
          focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/8
          outline-none transition-all duration-200 resize-none text-slate-800 text-sm
          placeholder:text-slate-300 group-hover:border-slate-300"
      />
      {hint && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, accent = false }: { title: string; subtitle?: string; accent?: boolean }) {
  return (
    <div className={`pb-4 mb-5 border-b ${accent ? 'border-blue-100' : 'border-slate-100'}`}>
      <h3 className={`text-xs font-black uppercase tracking-[0.18em] ${accent ? 'text-blue-500' : 'text-slate-400'}`}>
        {title}
      </h3>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
