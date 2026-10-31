import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

/**
 * Building blocks of the portal pages. Server components only (no state), so the whole dashboard is plain HTML:
 * readable before any JavaScript arrives.
 */

export type Tone = 'neutral' | 'sky' | 'emerald' | 'amber' | 'red' | 'violet';
type Icon = ComponentType<{ className?: string }>;

const TONE: Record<Tone, { text: string; soft: string; ring: string; stroke: string; glow: string }> = {
  neutral: { text: 'text-gray-600 dark:text-gray-300', soft: 'bg-gray-100 dark:bg-white/[0.06]', ring: 'ring-black/5 dark:ring-white/10', stroke: '#9ca3af', glow: 'from-black/5 dark:from-white/10' },
  sky: { text: 'text-sky-600 dark:text-sky-300', soft: 'bg-sky-50 dark:bg-sky-400/10', ring: 'ring-sky-500/20 dark:ring-sky-400/25', stroke: '#38bdf8', glow: 'from-sky-500/10 dark:from-sky-400/20' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-300', soft: 'bg-emerald-50 dark:bg-emerald-400/10', ring: 'ring-emerald-500/20 dark:ring-emerald-400/25', stroke: '#34d399', glow: 'from-emerald-500/10 dark:from-emerald-400/20' },
  amber: { text: 'text-amber-600 dark:text-amber-300', soft: 'bg-amber-50 dark:bg-amber-400/10', ring: 'ring-amber-500/20 dark:ring-amber-400/25', stroke: '#fbbf24', glow: 'from-amber-500/10 dark:from-amber-400/20' },
  red: { text: 'text-red-600 dark:text-red-300', soft: 'bg-red-50 dark:bg-red-400/10', ring: 'ring-red-500/20 dark:ring-red-400/25', stroke: '#f87171', glow: 'from-red-500/10 dark:from-red-400/20' },
  violet: { text: 'text-violet-600 dark:text-violet-300', soft: 'bg-violet-50 dark:bg-violet-400/10', ring: 'ring-violet-500/20 dark:ring-violet-400/25', stroke: '#a78bfa', glow: 'from-violet-500/10 dark:from-violet-400/20' },
};

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return (
    <Tag className={`rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.025] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}>
      {children}
    </Tag>
  );
}

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${t.soft} ${t.text} ${t.ring}`}>
      {children}
    </span>
  );
}

export function Avatar({ src, name, size = 44, rounded = 'full' }: { src?: string; name: string; size?: number; rounded?: 'full' | 'xl' }) {
  const shape = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '·';
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size }} className={`${shape} shrink-0 bg-gray-100 dark:bg-white/5 object-cover ring-1 ring-black/5 dark:ring-white/10`} />
  ) : (
    <span style={{ width: size, height: size }} className={`${shape} grid shrink-0 place-items-center bg-linear-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-800 text-xs font-semibold text-gray-600 dark:text-gray-200 ring-1 ring-black/5 dark:ring-white/10`}>
      {initials}
    </span>
  );
}

export function SectionHeader({ id, icon: Icon, title, count, tone = 'neutral', description, action }: {
  id?: string; icon: Icon; title: string; count?: number; tone?: Tone; description?: string; action?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div id={id} className="mb-4 flex scroll-mt-24 flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${t.soft} ${t.ring}`}>
          <Icon className={`h-[18px] w-[18px] ${t.text}`} />
        </span>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
            {title}
            {count !== undefined && count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset ${t.soft} ${t.text} ${t.ring}`}>{count}</span>
            )}
          </h2>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text }: { icon?: Icon; title: string; text?: string }) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-gray-100 dark:bg-white/[0.05] ring-1 ring-inset ring-black/5 dark:ring-white/10">
        <Icon className="h-5 w-5 text-gray-400" />
      </span>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{title}</p>
      {text && <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">{text}</p>}
    </Card>
  );
}

/** A small trend line from the last N days. Drawn on the server as SVG: no chart library, no JavaScript. */
export function Sparkline({ values, tone = 'sky', label }: { values: number[]; tone?: Tone; label: string }) {
  const W = 120, H = 36, PAD = 3;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? (W - PAD * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [PAD + i * step, H - PAD - (v / max) * (H - PAD * 2)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z` : '';
  const color = TONE[tone].stroke;
  const gradId = `spark-${tone}-${values.length}-${values.reduce((a, b) => a + b, 0)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-9 w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#${gradId})`} />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />}
    </svg>
  );
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'sky', series, seriesLabel, href }: {
  label: string; value: number | string; hint?: string; icon: Icon; tone?: Tone;
  series?: number[]; seriesLabel?: string; href?: string;
}) {
  const t = TONE[tone];
  const body = (
    <Card className={`group relative h-full overflow-hidden p-5 transition-[transform,border-color] duration-200 ease-premium ${href ? 'hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-white/15' : ''}`}>
      <div aria-hidden className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-linear-to-br ${t.glow} to-transparent blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-gray-900 dark:text-white tabular-nums">{typeof value === 'number' ? value.toLocaleString('ru-RU') : value}</p>
          {hint && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${t.soft} ${t.ring}`}>
          <Icon className={`h-[18px] w-[18px] ${t.text}`} />
        </span>
      </div>
      {series && series.length > 1 && (
        <div className="relative mt-4">
          <Sparkline values={series} tone={tone} label={seriesLabel ?? label} />
        </div>
      )}
    </Card>
  );
  return href ? <Link href={href} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">{body}</Link> : body;
}
