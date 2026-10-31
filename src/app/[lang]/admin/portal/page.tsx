import Link from 'next/link';
import {
  Users, Stethoscope, FileText, Building2, Eye, MessageSquareText, Hourglass, PenLine, ArrowRight,
  CircleCheck, CircleX, Trash2, Ban, EyeOff, Undo2,
} from 'lucide-react';
import { auth } from '@/auth';
import { assertStaffPage } from '@/lib/admin-content/guard';
import { articleScope, queueQuery, type OwnedIds } from '@/lib/admin-queue';
import { managedIds } from '@/lib/admin-scope';
import type { Staff } from '@/lib/admin-access';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import {
  toggleDoctorBan,
  banClinic,
} from '@/app/actions/admin';
import AdminShell from './_shared/AdminShell';
import { getPortalTrends, sum, TREND_DAYS } from './_shared/trends';
import { ActionButton } from './_components/ActionButton';
import { Moderation } from './_views/Moderation';
import { Avatar, Card, EmptyState, KpiCard, SectionHeader } from './_components/ui';
import PlacesSection from './_components/PlacesSection';
import { AdminAIAssistantWrapper } from './AdminAIAssistantWrapper';

const VIEWS = ['overview', 'moderation', 'directory'] as const;
type View = (typeof VIEWS)[number];

const DIRECTORY_LIMIT = 60;
const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';


/** Greeting by the hour in Dushanbe (the portal's home time), not by the server's clock. */
function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('ru-RU', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dushanbe' }).format(new Date()));
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 18) return 'Добрый день';
  if (hour >= 18 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

function pluralize(n: number, forms: [string, string, string]): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

const viewLinkCls =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-gray-200 ring-1 ring-inset ring-white/10 transition-colors duration-150 hover:bg-white/[0.09]';

export default async function PortalAdminPage({
  params, searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { lang } = await params;
  const { view: rawView } = await searchParams;
  // The administrator and the managers (a manager's role is rechecked in the database); everybody else goes to the login page
  const staff = await assertStaffPage(lang);
  const isAdmin = staff.role === 'portal_admin';
  const session = await auth();

  const view: View = (VIEWS as readonly string[]).includes(rawView ?? '') ? (rawView as View) : 'overview';

  await dbConnect();
  const Review = (await import('@/models/Review')).default;

  // An administrator sees everything. A manager sees the queue (applications nobody has taken) and, of everything
  // else, only what belongs to their doctors and clinics: every count and every list asks queueQuery.
  const own = isAdmin ? null : await managedIds(staff);
  const q = (tab: Parameters<typeof queueQuery>[1], status: string) => queueQuery(staff, tab, status, own);

  // Numbers every view needs (badges, tabs, KPIs).
  const [
    doctorsPending, doctorsApproved, doctorsBanned, doctorsRejected,
    clinicsPending, clinicsApproved,
    articlesPending, articlesPublished,
    totalUsers, reviewsPublished, reviewsHidden, viewsAgg,
  ] = await Promise.all([
    Doctor.countDocuments(q('doctors', 'pending')),
    Doctor.countDocuments(q('doctors', 'approved')),
    Doctor.countDocuments(q('doctors', 'banned')),
    Doctor.countDocuments(q('doctors', 'rejected')),
    Clinic.countDocuments(q('clinics', 'pending')),
    Clinic.countDocuments(q('clinics', 'approved')),
    Article.countDocuments(q('articles', 'pending')),
    Article.countDocuments(q('articles', 'published')),
    isAdmin ? User.countDocuments() : Promise.resolve(0),
    Review.countDocuments(q('reviews', 'published')),
    Review.countDocuments(q('reviews', 'hidden')),
    Article.aggregate<{ _id: null; views: number }>([
      { $match: articleScope(staff, own) },
      { $group: { _id: null, views: { $sum: '$views' } } },
    ]),
  ]);
  const reviewsTotal = reviewsPublished + reviewsHidden;
  const articleViews = viewsAgg[0]?.views ?? 0;
  const queueTotal = doctorsPending + clinicsPending + articlesPending;

  const base = `/${lang}/admin/portal`;
  const tabs: { id: View; label: string; count: number }[] = [
    { id: 'overview', label: 'Обзор', count: 0 },
    { id: 'moderation', label: 'Модерация', count: queueTotal + reviewsHidden },
    { id: 'directory', label: 'База', count: 0 },
  ];

  return (
    <AdminShell
      lang={lang}
      active="portal"
      staff={staff}
      title="Панель управления"
      description={isAdmin ? 'Заявки, модерация, статьи и каталог — всё в одном месте.' : 'Ваши записи и очередь новых заявок.'}
      action={!isAdmin ? undefined : (
        <Link
          href={`${base}/articles/new`}
          className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-b from-sky-400 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.8)] ring-1 ring-inset ring-white/25 transition-[transform,filter] duration-200 ease-premium hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          <PenLine className="h-4 w-4" aria-hidden /> Написать статью
        </Link>
      )}
    >
      {/* View switcher */}
      <nav aria-label="Вид панели" className="-mt-2 flex gap-1 rounded-xl bg-white/[0.03] p-1 ring-1 ring-inset ring-white/[0.06] sm:w-fit">
        {tabs.map(tab => {
          const isActive = tab.id === view;
          return (
            <Link
              key={tab.id}
              href={tab.id === 'overview' ? base : `${base}?view=${tab.id}`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm transition-colors duration-200 sm:flex-none ${
                isActive ? 'bg-white/10 font-medium text-white shadow-sm' : 'text-gray-400 hover:text-gray-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="rounded-full bg-amber-400/15 px-1.5 text-[11px] font-semibold tabular-nums text-amber-300">{tab.count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {view === 'overview' && (
        <Overview
          lang={lang}
          name={session?.user?.name || ''}
          isAdmin={isAdmin}
          queueTotal={queueTotal}
          counts={{
            doctorsApproved, clinicsApproved, articlesPending, articlesPublished, doctorsPending, clinicsPending,
            totalUsers, reviewsTotal, reviewsHidden, articleViews,
          }}
        />
      )}
      {view === 'moderation' && <Moderation lang={lang} staff={staff} own={own} />}
      {view === 'directory' && (
        <Directory lang={lang} staff={staff} own={own} counts={{ doctorsApproved, clinicsApproved, doctorsBanned, doctorsRejected }} />
      )}

      {isAdmin && <AdminAIAssistantWrapper />}
    </AdminShell>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ═════════════════════════════════════════════════════════════════════════════

async function Overview({ lang, name, isAdmin, queueTotal, counts }: {
  lang: string;
  name: string;
  isAdmin: boolean;
  queueTotal: number;
  counts: {
    doctorsApproved: number; clinicsApproved: number; articlesPending: number; articlesPublished: number;
    doctorsPending: number; clinicsPending: number; totalUsers: number; reviewsTotal: number;
    reviewsHidden: number; articleViews: number;
  };
}) {
  const base = `/${lang}/admin/portal`;
  // Portal-wide numbers and charts are the administrator's; a manager sees only their own totals
  const trends = isAdmin ? await getPortalTrends() : null;
  const today = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dushanbe' }).format(new Date());
  const firstName = name.trim().split(/\s+/)[0];

  const queue = [
    { label: 'Заявки врачей', value: counts.doctorsPending, icon: Stethoscope, href: `${base}?view=moderation#doctors` },
    { label: 'Заявки клиник', value: counts.clinicsPending, icon: Building2, href: `${base}?view=moderation#clinics` },
    { label: 'Статьи на проверке', value: counts.articlesPending, icon: FileText, href: `${base}?view=moderation#articles` },
    { label: 'Скрытые отзывы', value: counts.reviewsHidden, icon: EyeOff, href: `${base}?view=moderation#reviews` },
  ];

  return (
    <>
      {/* Hero */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_16rem_at_85%_-20%,rgba(56,189,248,0.18),transparent_65%),radial-gradient(30rem_14rem_at_0%_120%,rgba(99,102,241,0.14),transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-medium capitalize text-gray-400">{today}</p>
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
              {queueTotal > 0
                ? <>На проверке <span className="font-medium text-amber-300">{queueTotal}</span> {pluralize(queueTotal, ['заявка', 'заявки', 'заявок'])}. Начните с очереди — это самое срочное.</>
                : 'Очередь пуста: все заявки и статьи обработаны.'}
            </p>
          </div>
          <Link
            href={queueTotal > 0 || !isAdmin ? `${base}?view=moderation` : `${base}/articles`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-colors duration-200 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            {queueTotal > 0 || !isAdmin ? 'Открыть очередь' : 'Все статьи'} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Card>

      {/* KPIs */}
      <section aria-label="Ключевые показатели" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {trends && (
          <KpiCard
            label="Пользователи" value={counts.totalUsers} icon={Users} tone="sky"
            hint={`+${sum(trends.users)} за ${TREND_DAYS} дн.`} series={trends.users} seriesLabel="Новые пользователи по дням"
          />
        )}
        <KpiCard
          label="Врачи на портале" value={counts.doctorsApproved} icon={Stethoscope} tone="emerald"
          hint={trends ? `+${sum(trends.doctors)} заявок за ${TREND_DAYS} дн.` : 'Под вашим управлением'} series={trends?.doctors} seriesLabel="Новые заявки врачей по дням"
          href={`${base}/doctors`}
        />
        <KpiCard
          label="Опубликовано статей" value={counts.articlesPublished} icon={FileText} tone="violet"
          hint={trends ? `+${sum(trends.articles)} за ${TREND_DAYS} дн.` : 'Статьи ваших врачей'}
          series={trends?.articles} seriesLabel="Новые статьи по дням" href={isAdmin ? `${base}/articles` : undefined}
        />
        <KpiCard
          label="Клиники" value={counts.clinicsApproved} icon={Building2} tone="amber"
          hint={trends ? `+${sum(trends.clinics)} за ${TREND_DAYS} дн.` : 'Под вашим управлением'} series={trends?.clinics} seriesLabel="Новые клиники по дням"
          href={`${base}/clinics`}
        />
        <KpiCard label="Просмотры статей" value={counts.articleViews} icon={Eye} tone="sky" hint="За всё время" />
        <KpiCard
          label="Отзывы" value={counts.reviewsTotal} icon={MessageSquareText} tone="neutral"
          hint={counts.reviewsHidden > 0 ? `${counts.reviewsHidden} скрыто` : 'Все опубликованы'}
        />
      </section>

      {/* Queue */}
      <section aria-labelledby="queue-title">
        <SectionHeader id="queue-title" icon={Hourglass} title="Требует внимания" tone="amber" description="Нажмите на карточку, чтобы перейти к разделу модерации." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {queue.map(q => {
            const Icon = q.icon;
            const urgent = q.value > 0;
            return (
              <Link
                key={q.label}
                href={q.href}
                className={`group rounded-2xl border p-4 transition-[transform,border-color,background-color] duration-200 ease-premium hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                  urgent ? 'border-amber-400/25 bg-amber-400/[0.05] hover:border-amber-400/40' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${urgent ? 'text-amber-300' : 'text-gray-500'}`} aria-hidden />
                  <ArrowRight className="h-3.5 w-3.5 text-gray-600 transition-transform duration-200 ease-premium group-hover:translate-x-0.5 group-hover:text-gray-300" aria-hidden />
                </div>
                <p className={`mt-3 text-2xl font-semibold tabular-nums ${urgent ? 'text-white' : 'text-gray-500'}`}>{q.value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{q.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick access */}
      <section aria-label="Быстрые переходы" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          ...(isAdmin ? [{ href: `${base}/articles/new`, icon: PenLine, title: 'Написать статью', text: 'Под подписью «Редакция Duxtur», сразу на сайте' }] : []),
          { href: `${base}/clinics`, icon: Building2, title: 'Клиники', text: 'Править любую клинику или создать новую' },
          { href: `${base}/doctors`, icon: Stethoscope, title: 'Врачи', text: 'Править профили или создать вручную' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
              <Card className="flex h-full items-center gap-4 p-4 transition-[transform,border-color] duration-200 ease-premium group-hover:-translate-y-0.5 group-hover:border-white/15">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/10">
                  <Icon className="h-5 w-5 text-sky-300" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">{item.title}</span>
                  <span className="block truncate text-xs text-gray-500">{item.text}</span>
                </span>
              </Card>
            </Link>
          );
        })}
      </section>

      {isAdmin && <PlacesSection />}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DIRECTORY
// ═════════════════════════════════════════════════════════════════════════════

async function Directory({ lang, staff, own, counts }: {
  lang: string;
  staff: Staff;
  own: OwnedIds | null;
  counts: { doctorsApproved: number; clinicsApproved: number; doctorsBanned: number; doctorsRejected: number };
}) {
  const base = `/${lang}/admin/portal`;
  const [approvedDoctors, approvedClinics, bannedDoctors, rejectedDoctors] = await Promise.all([
    Doctor.find(queueQuery(staff, 'doctors', 'approved', own)).sort({ createdAt: -1 }).limit(DIRECTORY_LIMIT).lean<DoctorRow[]>(),
    Clinic.find(queueQuery(staff, 'clinics', 'approved', own)).sort({ createdAt: -1 }).limit(DIRECTORY_LIMIT).lean<ClinicRow[]>(),
    Doctor.find(queueQuery(staff, 'doctors', 'banned', own)).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
    Doctor.find(queueQuery(staff, 'doctors', 'rejected', own)).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
  ]);

  const seeAll = (href: string, shown: number, total: number) => (
    <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 hover:underline">
      {total > shown ? `Показаны ${shown} из ${total} · Все` : 'Открыть список'} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );

  return (
    <>
      <section aria-labelledby="authors">
        <SectionHeader
          id="authors" icon={Stethoscope} title="Активные врачи и авторы" count={counts.doctorsApproved} tone="emerald"
          action={seeAll(`${base}/doctors`, approvedDoctors.length, counts.doctorsApproved)}
        />
        {approvedDoctors.length === 0 ? (
          <EmptyState icon={Stethoscope} title="Нет активных врачей" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {approvedDoctors.map((doc: DoctorRow) => (
              <Card key={String(doc._id)} as="article" className="flex items-center gap-4 p-4">
                <Avatar src={doc.image || FALLBACK_AVATAR} name={doc.name || ''} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{doc.name}</p>
                  <p className="truncate text-xs text-sky-300">{doc.specialty?.ru}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{doc.phone}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link href={`/${lang}/doctor/${doc.slug || doc._id}`} target="_blank" className={viewLinkCls}>
                    <Eye className="h-3.5 w-3.5" aria-hidden /> Профиль
                  </Link>
                  <ActionButton action={toggleDoctorBan.bind(null, doc._id.toString(), true)} label="Бан" variant="warning" icon={Ban} confirm="Заблокировать врача?" />
                  <ActionButton action={deleteDoctor.bind(null, doc._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить врача, его аккаунт и статьи? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="approved-clinics">
        <SectionHeader
          id="approved-clinics" icon={Building2} title="Одобренные клиники" count={counts.clinicsApproved} tone="sky"
          action={seeAll(`${base}/clinics`, approvedClinics.length, counts.clinicsApproved)}
        />
        {approvedClinics.length === 0 ? (
          <EmptyState icon={Building2} title="Нет одобренных клиник" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {approvedClinics.map((clinic: ClinicRow) => (
              <Card key={String(clinic._id)} as="article" className="flex items-center gap-4 p-4">
                <Avatar src={clinic.logo || FALLBACK_AVATAR} name={clinic.name?.ru || ''} size={52} rounded="xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{clinic.name?.ru}</p>
                  <p className="truncate text-xs text-sky-300">{[clinic.type, clinic.city].filter(Boolean).join(' · ')}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Врачей: {clinic.doctorIds?.length || 0}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link href={`/${lang}/clinics/${clinic.slug}`} target="_blank" className={viewLinkCls}>
                    <Eye className="h-3.5 w-3.5" aria-hidden /> Профиль
                  </Link>
                  <ActionButton action={banClinic.bind(null, clinic._id.toString(), true)} label="Бан" variant="warning" icon={Ban} confirm="Заблокировать клинику?" />
                  <ActionButton action={deleteClinic.bind(null, clinic._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить клинику? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {bannedDoctors.length > 0 && (
        <section aria-labelledby="banned">
          <SectionHeader id="banned" icon={Ban} title="Заблокированные" count={counts.doctorsBanned} tone="red" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bannedDoctors.map((doc: DoctorRow) => (
              <Card key={String(doc._id)} as="article" className="flex items-center gap-4 border-red-400/15 p-4">
                <div className="opacity-60"><Avatar src={doc.image || FALLBACK_AVATAR} name={doc.name || ''} size={44} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-300">{doc.name}</p>
                  <p className="truncate text-xs text-red-300/80">{doc.specialty?.ru}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionButton action={toggleDoctorBan.bind(null, doc._id.toString(), false)} label="Разбанить" variant="success" icon={Undo2} />
                  <ActionButton action={deleteDoctor.bind(null, doc._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить врача, его аккаунт и статьи? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {rejectedDoctors.length > 0 && (
        <section aria-labelledby="rejected">
          <SectionHeader id="rejected" icon={CircleX} title="Отклонённые заявки" count={counts.doctorsRejected} tone="neutral" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rejectedDoctors.map((doc: DoctorRow) => (
              <Card key={String(doc._id)} as="article" className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-300">{doc.name}</p>
                  <p className="truncate text-xs text-gray-500">{doc.specialty?.ru} · {doc.phone}</p>
                  <p className="text-xs text-gray-600">{shortDate(doc.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionButton action={updateDoctorStatus.bind(null, doc._id.toString(), 'approved')} label="Одобрить" variant="success" icon={CircleCheck} />
                  <ActionButton action={deleteDoctor.bind(null, doc._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить заявку, аккаунт и статьи врача? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
