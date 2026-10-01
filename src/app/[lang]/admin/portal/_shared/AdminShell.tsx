import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV = [
  { key: 'portal', label: 'Панель', href: (l: string) => `/${l}/admin/portal` },
  { key: 'clinics', label: 'Клиники', href: (l: string) => `/${l}/admin/portal/clinics` },
  { key: 'doctors', label: 'Врачи', href: (l: string) => `/${l}/admin/portal/doctors` },
] as const;

export default function AdminShell({
  lang, active, title, action, children,
}: { lang: string; active: 'portal' | 'clinics' | 'doctors'; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 font-sans text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex flex-wrap items-center gap-4 sticky top-0 z-40">
        <h1 className="font-extrabold text-lg">
          duxtur<span className="text-blue-400">.com</span>
          <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Admin Portal</span>
        </h1>
        <nav className="flex gap-1 text-sm">
          {NAV.map(n => (
            <Link
              key={n.key}
              href={n.href(lang)}
              className={`px-3 py-1.5 rounded-lg transition ${active === n.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}

export function Banner({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) {
  const cls = kind === 'error' ? 'bg-red-950/60 border-red-800 text-red-200' : 'bg-emerald-950/60 border-emerald-800 text-emerald-200';
  return <div className={`border rounded-xl px-4 py-3 text-sm whitespace-pre-line ${cls}`}>{children}</div>;
}

export const STATUS_STYLES: Record<string, string> = {
  pre_imported: 'bg-amber-900/40 text-amber-300 border-amber-700',
  pending: 'bg-blue-900/40 text-blue-300 border-blue-700',
  approved: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  rejected: 'bg-red-900/40 text-red-300 border-red-700',
  banned: 'bg-gray-800 text-gray-300 border-gray-600',
};
export const STATUS_LABELS: Record<string, string> = {
  pre_imported: 'Импорт (не подтверждён)', pending: 'На модерации', approved: 'Одобрена', rejected: 'Отклонена', banned: 'Заблокирована',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? 'border-gray-700 text-gray-400'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
