import type { ReactNode } from 'react';

export const inputCls =
  'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500';

export function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-bold">{title}</h3>
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function Label({ text, hint, children }: { text: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-gray-400">{text}</span>
      {children}
      {hint && <span className="block text-[11px] text-gray-600">{hint}</span>}
    </label>
  );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const c = cols === 1 ? '' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  return <div className={`grid grid-cols-1 ${c} gap-4`}>{children}</div>;
}

export const LANG_LABELS: Record<string, string> = { ru: 'Русский', tg: 'Тоҷикӣ', uz: 'Oʻzbekcha', kk: 'Қазақша', ky: 'Кыргызча' };
export const LANG_ORDER = ['ru', 'tg', 'uz', 'kk', 'ky'] as const;

export function MultiLang({
  prefix, values, required, textarea, rows = 3,
}: { prefix: string; values?: Partial<Record<string, string>>; required?: boolean; textarea?: boolean; rows?: number }) {
  return (
    <Grid cols={textarea ? 1 : 2}>
      {LANG_ORDER.map(l => (
        <Label key={l} text={`${LANG_LABELS[l]}${l === 'ru' && required ? ' *' : ''}`}>
          {textarea ? (
            <textarea name={`${prefix}_${l}`} defaultValue={values?.[l] ?? ''} rows={rows} className={inputCls} />
          ) : (
            <input name={`${prefix}_${l}`} defaultValue={values?.[l] ?? ''} required={l === 'ru' && required} className={inputCls} />
          )}
        </Label>
      ))}
    </Grid>
  );
}

export function ImagePicker({
  label, urlName, fileName, current,
}: { label: string; urlName: string; fileName: string; current?: string }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-gray-400">{label}</span>
      <div className="flex items-start gap-4">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-700 bg-gray-800" />
        ) : (
          <div className="w-20 h-20 rounded-lg border border-dashed border-gray-700 grid place-items-center text-[10px] text-gray-600">нет</div>
        )}
        <div className="flex-1 space-y-2">
          <input type="file" name={fileName} accept="image/jpeg,image/png,image/webp" className="text-xs text-gray-400" />
          <input name={urlName} defaultValue={current ?? ''} placeholder="или ссылка https://res.cloudinary.com/…" className={inputCls} />
          <p className="text-[11px] text-gray-600">JPG, PNG или WebP до 5 МБ. Файл загружается в Cloudinary, ссылка подставится сама.</p>
        </div>
      </div>
    </div>
  );
}
