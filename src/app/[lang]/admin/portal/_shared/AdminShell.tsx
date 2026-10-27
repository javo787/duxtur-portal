import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  LayoutDashboard, FileText, PenLine, Building2, Stethoscope, ArrowUpRight, ShieldCheck, Sparkles, ScrollText, Trash2,
} from 'lucide-react';
import SignOutButton from './SignOutButton';
import { getPortalCounts } from './counts';

export type PortalSection = 'portal' | 'articles' | 'write' | 'clinics' | 'doctors' | 'audit' | 'trash';

interface NavItem {
  key: PortalSection;
  label: string;
  icon: typeof LayoutDashboard;
  href: (lang: string) => string;
  /** Which count (if any) is shown as a badge on this item. */
  badge?: 'moderation' | 'articles';
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Обзор',
    items: [
      { key: 'portal', label: 'Панель', icon: LayoutDashboard, href: l => `/${l}/admin/portal`, badge: 'moderation' },
    ],
  },
  {
    title: 'Контент',
    items: [
      { key: 'articles', label: 'Статьи', icon: FileText, href: l => `/${l}/admin/portal/articles`, badge: 'articles' },
      { key: 'write', label: 'Написать статью', icon: PenLine, href: l => `/${l}/admin/portal/articles/new` },
    ],
  },
  {
    title: 'Каталог',
    items: [
      { key: 'clinics', label: 'Клиники', icon: Building2, href: l => `/${l}/admin/portal/clinics` },
      { key: 'doctors', label: 'Врачи', icon: Stethoscope, href: l => `/${l}/admin/portal/doctors` },
    ],
  },
  {
    title: 'Контроль',
    items: [
      { key: 'audit', label: 'Журнал', icon: ScrollText, href: l => `/${l}/admin/portal/audit` },
      { key: 'trash', label: 'Корзина', icon: Trash2, href: l => `/${l}/admin/portal/trash` },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

function Badge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="ml-auto min-w-5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums text-amber-300 ring-1 ring-inset ring-amber-400/25">
      {value > 99 ? '99+' : value}
    </span>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="duxtur.com">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.7)] ring-1 ring-inset ring-white/20">
        <ShieldCheck className="h-[18px] w-[18px] text-white" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-white">
          duxtur<span className="text-sky-400">.com</span>
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">Admin Portal</span>
      </span>
    </Link>
  );
}

export default async function AdminShell({
  lang, active, title, description, action, children,
}: {
  lang: string;
  active: PortalSection;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const counts = await getPortalCounts();
  const badgeFor = (item: NavItem) =>
    item.badge === 'moderation' ? counts.doctors + counts.clinics + counts.articles
    : item.badge === 'articles' ? counts.articles
    : 0;

  return (
    <div className="min-h-screen bg-[#05070c] font-sans text-gray-100 antialiased lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      {/* Soft light behind the content: depth without any motion */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(60rem_28rem_at_70%_-10%,rgba(56,120,255,0.10),transparent_60%),radial-gradient(40rem_24rem_at_0%_100%,rgba(20,184,166,0.06),transparent_60%)]"
      />

      {/* ───────── Sidebar (desktop) ───────── */}
      <aside className="relative z-10 hidden h-screen flex-col border-r border-white/[0.06] bg-white/[0.015] px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:flex">
        <div className="px-2 pb-6"><Brand /></div>

        <nav aria-label="Разделы портала" className="flex-1 space-y-6 overflow-y-auto pr-1">
          {NAV_GROUPS.map(group => (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = item.key === active;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href(lang)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                          isActive
                            ? 'bg-white/[0.07] font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                            : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-100'
                        }`}
                      >
                        {isActive && <span aria-hidden className="absolute -left-4 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400" />}
                        <Icon className={`h-4 w-4 ${isActive ? 'text-sky-300' : 'text-gray-500 group-hover:text-gray-300'}`} aria-hidden />
                        {item.label}
                        <Badge value={badgeFor(item)} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 space-y-1 border-t border-white/[0.06] pt-4">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.05]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-br from-amber-300 to-orange-500 text-[11px] font-bold text-gray-900">SA</span>
            <span className="leading-tight">
              <span className="block text-[13px] font-medium text-gray-100">Супер-администратор</span>
              <span className="block text-[11px] text-gray-500">Полный доступ</span>
            </span>
          </div>
          <Link href={`/${lang}`} className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors duration-200 hover:bg-white/[0.04] hover:text-gray-100">
            <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300" aria-hidden />
            На сайт
          </Link>
          <SignOutButton lang={lang} />
        </div>
      </aside>

      {/* ───────── Content column ───────── */}
      <div className="relative z-10 min-w-0">
        {/* Top bar (mobile / tablet): brand + scrollable section pills */}
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070c]/80 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Brand />
            <Link href={`/${lang}`} className="rounded-lg px-2.5 py-1.5 text-xs text-gray-400 ring-1 ring-inset ring-white/10 hover:text-white">На сайт</Link>
          </div>
          <nav aria-label="Разделы портала" className="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {ALL_ITEMS.map(item => {
              const isActive = item.key === active;
              const n = badgeFor(item);
              return (
                <Link
                  key={item.key}
                  href={item.href(lang)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] ring-1 ring-inset transition-colors duration-200 ${
                    isActive ? 'bg-white/10 font-medium text-white ring-white/20' : 'text-gray-400 ring-white/[0.07] hover:text-white'
                  }`}
                >
                  {item.label}
                  {n > 0 && <span className="rounded-full bg-amber-400/20 px-1.5 text-[10px] font-semibold tabular-nums text-amber-300">{n}</span>}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400/90">
                <Sparkles className="h-3 w-3" aria-hidden /> Duxtur Admin
              </p>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.9rem]">{title}</h1>
              {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-400">{description}</p>}
            </div>
            {action}
          </div>
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function Banner({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) {
  const cls = kind === 'error'
    ? 'border-red-500/25 bg-red-500/[0.08] text-red-200'
    : 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-200';
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`whitespace-pre-line rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export const STATUS_STYLES: Record<string, string> = {
  pre_imported: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  pending: 'bg-sky-400/10 text-sky-300 ring-sky-400/25',
  approved: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  rejected: 'bg-red-400/10 text-red-300 ring-red-400/25',
  banned: 'bg-gray-400/10 text-gray-300 ring-gray-400/25',
};
export const STATUS_LABELS: Record<string, string> = {
  pre_imported: 'Импорт (не подтверждён)', pending: 'На модерации', approved: 'Одобрена', rejected: 'Отклонена', banned: 'Заблокирована',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] ?? 'bg-white/5 text-gray-400 ring-white/10'}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
