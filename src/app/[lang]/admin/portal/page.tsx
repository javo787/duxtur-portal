import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Users, Stethoscope, FileText, Building2, Eye, MessageSquareText, Hourglass, PenLine, ArrowRight,
  CircleCheck, CircleX, Trash2, Ban, ExternalLink, FileBadge, EyeOff, Link2, Undo2, PartyPopper,
} from 'lucide-react';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import {
  updateDoctorStatus, deleteDoctor, deleteArticle, toggleDoctorBan, approveArticle, approveReview, hideReview,
  deleteReview, approveClinic, rejectClinic, deleteClinic, banClinic,
} from '@/app/actions/admin';
import AdminShell from './_shared/AdminShell';
import { getPortalTrends, sum, TREND_DAYS } from './_shared/trends';
import { ActionButton } from './_components/ActionButton';
import { RejectButton } from './_components/RejectButton';
import { Avatar, Card, EmptyState, KpiCard, Pill, SectionHeader } from './_components/ui';
import PlacesSection from './_components/PlacesSection';
import type { ArticleRow, ClinicRow, DoctorRow, ReviewRow, Titles } from './_shared/rows';
import { AdminAIAssistantWrapper } from './AdminAIAssistantWrapper';

const VIEWS = ['overview', 'moderation', 'directory'] as const;
type View = (typeof VIEWS)[number];

const DIRECTORY_LIMIT = 60;
const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
const FALLBACK_ARTICLE_IMAGE = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200';

const articleTitle = (a: { title?: Titles }) => a.title?.ru || a.title?.uz || a.title?.tg || a.title?.ky || a.title?.kk || 'Без названия';
const shortDate = (d: unknown) => new Date(d as string).toLocaleDateString('ru');

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
  const session = await auth();
  const { lang } = await params;
  const { view: rawView } = await searchParams;

  if (!session || (session.user as { role?: string } | undefined)?.role !== 'portal_admin') {
    redirect(`/${lang}/login`);
  }

  const view: View = (VIEWS as readonly string[]).includes(rawView ?? '') ? (rawView as View) : 'overview';

  await dbConnect();
  const Review = (await import('@/models/Review')).default;

  // Numbers every view needs (badges, tabs, KPIs).
  const [
    doctorsPending, doctorsApproved, doctorsBanned, doctorsRejected,
    clinicsPending, clinicsApproved,
    articlesPending, articlesPublished,
    totalUsers, reviewsTotal, reviewsHidden, viewsAgg,
  ] = await Promise.all([
    Doctor.countDocuments({ status: 'pending' }),
    Doctor.countDocuments({ status: 'approved' }),
    Doctor.countDocuments({ status: 'banned' }),
    Doctor.countDocuments({ status: 'rejected' }),
    Clinic.countDocuments({ status: 'pending' }),
    Clinic.countDocuments({ status: 'approved' }),
    Article.countDocuments({ isVerified: false }),
    Article.countDocuments({ isVerified: true }),
    User.countDocuments(),
    Review.countDocuments(),
    Review.countDocuments({ isVerified: false }),
    Article.aggregate<{ _id: null; views: number }>([{ $group: { _id: null, views: { $sum: '$views' } } }]),
  ]);
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
      title="Панель управления"
      description="Заявки, модерация, статьи и каталог — всё в одном месте."
      action={
        <Link
          href={`${base}/articles/new`}
          className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-b from-sky-400 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.8)] ring-1 ring-inset ring-white/25 transition-[transform,filter] duration-200 ease-premium hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          <PenLine className="h-4 w-4" aria-hidden /> Написать статью
        </Link>
      }
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
          name={session.user?.name || ''}
          queueTotal={queueTotal}
          counts={{
            doctorsApproved, clinicsApproved, articlesPending, articlesPublished, doctorsPending, clinicsPending,
            totalUsers, reviewsTotal, reviewsHidden, articleViews,
          }}
        />
      )}
      {view === 'moderation' && <Moderation lang={lang} />}
      {view === 'directory' && (
        <Directory lang={lang} counts={{ doctorsApproved, clinicsApproved, doctorsBanned, doctorsRejected }} />
      )}

      <AdminAIAssistantWrapper />
    </AdminShell>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ═════════════════════════════════════════════════════════════════════════════

async function Overview({ lang, name, queueTotal, counts }: {
  lang: string;
  name: string;
  queueTotal: number;
  counts: {
    doctorsApproved: number; clinicsApproved: number; articlesPending: number; articlesPublished: number;
    doctorsPending: number; clinicsPending: number; totalUsers: number; reviewsTotal: number;
    reviewsHidden: number; articleViews: number;
  };
}) {
  const base = `/${lang}/admin/portal`;
  const trends = await getPortalTrends();
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
            href={queueTotal > 0 ? `${base}?view=moderation` : `${base}/articles`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-colors duration-200 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            {queueTotal > 0 ? 'Открыть очередь' : 'Все статьи'} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Card>

      {/* KPIs */}
      <section aria-label="Ключевые показатели" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Пользователи" value={counts.totalUsers} icon={Users} tone="sky"
          hint={`+${sum(trends.users)} за ${TREND_DAYS} дн.`} series={trends.users} seriesLabel="Новые пользователи по дням"
        />
        <KpiCard
          label="Врачи на портале" value={counts.doctorsApproved} icon={Stethoscope} tone="emerald"
          hint={`+${sum(trends.doctors)} заявок за ${TREND_DAYS} дн.`} series={trends.doctors} seriesLabel="Новые заявки врачей по дням"
          href={`${base}/doctors`}
        />
        <KpiCard
          label="Опубликовано статей" value={counts.articlesPublished} icon={FileText} tone="violet"
          hint={`+${sum(trends.articles)} за ${TREND_DAYS} дн.`}
          series={trends.articles} seriesLabel="Новые статьи по дням" href={`${base}/articles`}
        />
        <KpiCard
          label="Клиники" value={counts.clinicsApproved} icon={Building2} tone="amber"
          hint={`+${sum(trends.clinics)} за ${TREND_DAYS} дн.`} series={trends.clinics} seriesLabel="Новые клиники по дням"
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
          { href: `${base}/articles/new`, icon: PenLine, title: 'Написать статью', text: 'Под подписью «Редакция Duxtur», сразу на сайте' },
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

      <PlacesSection />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODERATION
// ═════════════════════════════════════════════════════════════════════════════

async function Moderation({ lang }: { lang: string }) {
  const Review = (await import('@/models/Review')).default;

  const [pendingDoctors, pendingClinics, pendingArticles, reviews] = await Promise.all([
    Doctor.find({ status: 'pending' }).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
    Clinic.find({ status: 'pending' }).sort({ createdAt: -1 }).lean<ClinicRow[]>(),
    Article.find({ isVerified: false }).sort({ createdAt: -1 }).populate('authorId').lean<ArticleRow[]>(),
    // Every review, newest first: they are published when written, the administrator hides or deletes what should not stay
    Review.find({}).sort({ createdAt: -1 }).limit(100)
      .populate('doctorId')
      .populate({ path: 'clinicId', model: Clinic, select: 'name slug' })
      .populate({ path: 'articleId', model: Article, select: 'title slug' })
      .populate({ path: 'patientId', model: User, select: 'name email role provider' })
      .lean<ReviewRow[]>(),
  ]);
  const hiddenReviews = reviews.filter((review: ReviewRow) => !review.isVerified).length;

  return (
    <>
      {/* Doctors */}
      <section aria-labelledby="doctors">
        <SectionHeader id="doctors" icon={Stethoscope} title="Заявки врачей" count={pendingDoctors.length} tone="amber" />
        {pendingDoctors.length === 0 ? (
          <EmptyState icon={PartyPopper} title="Все заявки обработаны" text="Новые заявки врачей появятся здесь." />
        ) : (
          <div className="grid gap-3">
            {pendingDoctors.map((doc: DoctorRow) => (
              <Card key={String(doc._id)} as="article" className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:p-5">
                <a
                  href={doc.documentImage} target="_blank" rel="noopener noreferrer"
                  className="group relative block h-28 w-full shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 sm:w-44"
                  aria-label={`Открыть диплом: ${doc.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {doc.documentImage && <img src={doc.documentImage} alt="Диплом" className="h-full w-full object-cover" loading="lazy" />}
                  <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="inline-flex items-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" aria-hidden /> Открыть</span>
                  </span>
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-white">{doc.name}</h3>
                    {doc.isClaimed && <Pill tone="amber">Claimed</Pill>}
                    <Pill tone="sky">На проверке</Pill>
                  </div>
                  <p className="mt-1 text-sm text-sky-300">{doc.specialty?.ru || '—'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <Pill>{doc.phone}</Pill>
                    <Pill>{shortDate(doc.createdAt)}</Pill>
                    {doc.isClaimed && doc.importSourceUrl && (
                      <a href={doc.importSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-300 hover:underline">
                        <Link2 className="h-3 w-3" aria-hidden /> Источник
                      </a>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton action={updateDoctorStatus.bind(null, doc._id.toString(), 'approved')} label="Одобрить" variant="success" icon={CircleCheck} />
                    <RejectButton action={updateDoctorStatus.bind(null, doc._id.toString(), 'rejected')} />
                    <ActionButton action={deleteDoctor.bind(null, doc._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить заявку, аккаунт и статьи врача? Копия хранится в корзине 30 дней." />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Clinics */}
      <section aria-labelledby="clinics">
        <SectionHeader id="clinics" icon={Building2} title="Заявки клиник" count={pendingClinics.length} tone="sky" />
        {pendingClinics.length === 0 ? (
          <EmptyState icon={Building2} title="Нет новых заявок от клиник" />
        ) : (
          <div className="grid gap-3">
            {pendingClinics.map((clinic: ClinicRow) => (
              <Card key={String(clinic._id)} as="article" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <Avatar src={clinic.logo || FALLBACK_AVATAR} name={clinic.name?.ru || ''} size={64} rounded="xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-white">{clinic.name?.ru}</h3>
                    {clinic.type && <Pill tone="sky">{clinic.type}</Pill>}
                    <Pill tone="amber">На проверке</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {clinic.city && <Pill>{clinic.city}</Pill>}
                    {clinic.phone && <Pill>{clinic.phone}</Pill>}
                    {clinic.licenseDocument && (
                      <a href={clinic.licenseDocument} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 px-2 py-0.5 font-medium text-sky-300 ring-1 ring-inset ring-sky-400/25 hover:bg-sky-400/20">
                        <FileBadge className="h-3 w-3" aria-hidden /> Лицензия
                      </a>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton action={approveClinic.bind(null, clinic._id.toString())} label="Одобрить" variant="success" icon={CircleCheck} />
                    <RejectButton action={rejectClinic.bind(null, clinic._id.toString())} />
                    <ActionButton action={deleteClinic.bind(null, clinic._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить клинику и аккаунт владельца? Копия хранится в корзине 30 дней." />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Articles on moderation */}
      <section aria-labelledby="articles">
        <SectionHeader id="articles" icon={FileText} title="Статьи на проверке" count={pendingArticles.length} tone="violet" description="Статьи врачей и скрытые статьи. Свои статьи вы публикуете сразу." />
        {pendingArticles.length === 0 ? (
          <EmptyState icon={PartyPopper} title="Нет статей на проверке" />
        ) : (
          <div className="grid gap-3">
            {pendingArticles.map((article: ArticleRow) => (
              <Card key={String(article._id)} as="article" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Avatar src={article.image || FALLBACK_ARTICLE_IMAGE} name={articleTitle(article)} size={64} rounded="xl" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Pill tone="amber">На проверке</Pill>
                      {article.aiGenerated === false && <Pill>Вручную</Pill>}
                      {article.category && <Pill tone="violet">{article.category}</Pill>}
                    </div>
                    <p className="truncate text-sm font-medium text-white">{articleTitle(article)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {article.authorId?.name || 'Неизвестен'} · {shortDate(article.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/${lang}/blog/${article.slug}`} target="_blank" className={viewLinkCls}>
                    <Eye className="h-3.5 w-3.5" aria-hidden /> Просмотр
                  </Link>
                  <ActionButton action={approveArticle.bind(null, article._id.toString())} label="Одобрить" variant="success" icon={CircleCheck} />
                  <ActionButton action={deleteArticle.bind(null, article._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить статью? Копия хранится в корзине 30 дней." />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section aria-labelledby="reviews">
        <SectionHeader
          id="reviews" icon={MessageSquareText} title="Отзывы" count={hiddenReviews} tone="violet"
          description="Отзывы публикуются сразу. Здесь видно, кто написал; отзыв можно скрыть (он вернётся кнопкой «Показать») или удалить. Счётчик — скрытые отзывы."
        />
        {reviews.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="Отзывов пока нет" />
        ) : (
          <div className="grid gap-3">
            {reviews.map((review: ReviewRow) => {
              const doctor = review.doctorId;
              const clinic = review.clinicId;
              const article = review.articleId;
              const account = review.patientId;
              const subject = doctor
                ? { label: `Врач: ${doctor.name || 'Неизвестен'}`, href: `/${lang}/doctor/${doctor.slug || doctor._id}` }
                : article
                  ? { label: `Статья: ${article.title?.ru || article.slug || 'Неизвестна'}`, href: `/${lang}/blog/${article.slug}` }
                  : { label: `Клиника: ${clinic?.name?.ru || 'Неизвестна'}`, href: clinic?.slug ? `/${lang}/clinics/${clinic.slug}` : '' };
              return (
                <Card key={String(review._id)} as="article" className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-start ${review.isVerified ? '' : 'border-violet-400/25'}`}>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Pill tone="amber">★ {review.rating}/5</Pill>
                      <Pill tone={review.isVerified ? 'emerald' : 'violet'}>{review.isVerified ? 'Опубликован' : 'Скрыт'}</Pill>
                      {subject.href ? (
                        <a href={subject.href} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-300 hover:underline">{subject.label}</a>
                      ) : (
                        <span className="text-xs text-gray-400">{subject.label}</span>
                      )}
                    </div>
                    <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-100">«{review.text}»</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                      Автор:{' '}
                      {account
                        ? <>{account.name || 'без имени'} · {account.email} · {account.provider || 'credentials'} · {account.role}</>
                        : 'аккаунт неизвестен (старый отзыв)'}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      На сайте: {review.authorName || (review.isAnonymous ? 'Анонимный пациент' : 'без имени')}
                      {review.isAnonymous && review.authorName ? ' (автор скрыл имя)' : ''} · {shortDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    {review.isVerified ? (
                      <ActionButton action={hideReview.bind(null, review._id.toString())} label="Скрыть" variant="neutral" icon={EyeOff} />
                    ) : (
                      <ActionButton action={approveReview.bind(null, review._id.toString())} label="Показать" variant="success" icon={Eye} />
                    )}
                    <ActionButton action={deleteReview.bind(null, review._id.toString())} label="Удалить" variant="danger" icon={Trash2} confirm="Удалить отзыв? Копия хранится в корзине 30 дней." />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DIRECTORY
// ═════════════════════════════════════════════════════════════════════════════

async function Directory({ lang, counts }: {
  lang: string;
  counts: { doctorsApproved: number; clinicsApproved: number; doctorsBanned: number; doctorsRejected: number };
}) {
  const base = `/${lang}/admin/portal`;
  const [approvedDoctors, approvedClinics, bannedDoctors, rejectedDoctors] = await Promise.all([
    Doctor.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(DIRECTORY_LIMIT).lean<DoctorRow[]>(),
    Clinic.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(DIRECTORY_LIMIT).lean<ClinicRow[]>(),
    Doctor.find({ status: 'banned' }).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
    Doctor.find({ status: 'rejected' }).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
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
