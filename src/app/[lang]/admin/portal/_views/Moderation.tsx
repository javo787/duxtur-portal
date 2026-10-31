import Link from 'next/link';
import {
  Stethoscope, FileText, Building2, Eye, MessageSquareText, PartyPopper, ExternalLink, CircleCheck, Trash2, Link2, FileBadge, EyeOff
} from 'lucide-react';
import type { Staff } from '@/lib/admin-access';
import { queueQuery, reviewScope, type OwnedIds } from '@/lib/admin-queue';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import {
  updateDoctorStatus, deleteDoctor, deleteArticle, approveArticle, approveReview, hideReview,
  deleteReview, approveClinic, rejectClinic, deleteClinic,
} from '@/app/actions/admin';
import { ActionButton } from '../_components/ActionButton';
import { RejectButton } from '../_components/RejectButton';
import { Avatar, Card, EmptyState, Pill, SectionHeader } from '../_components/ui';
import type { ArticleRow, ClinicRow, DoctorRow, ReviewRow, Titles } from '../_shared/rows';

const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
const FALLBACK_ARTICLE_IMAGE = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200';

const articleTitle = (a: { title?: Titles }) => a.title?.ru || a.title?.uz || a.title?.tg || a.title?.ky || a.title?.kk || 'Без названия';
const shortDate = (d: unknown) => new Date(d as string).toLocaleDateString('ru');

const viewLinkCls =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-gray-200 ring-1 ring-inset ring-white/10 transition-colors duration-150 hover:bg-white/[0.09]';

export async function Moderation({ lang, staff, own }: { lang: string; staff: Staff; own: OwnedIds | null }) {
  const Review = (await import('@/models/Review')).default;

  const [pendingDoctors, pendingClinics, pendingArticles, reviews] = await Promise.all([
    Doctor.find(queueQuery(staff, 'doctors', 'pending', own)).sort({ createdAt: -1 }).lean<DoctorRow[]>(),
    Clinic.find(queueQuery(staff, 'clinics', 'pending', own)).sort({ createdAt: -1 }).lean<ClinicRow[]>(),
    Article.find(queueQuery(staff, 'articles', 'pending', own)).sort({ createdAt: -1 }).populate('authorId').lean<ArticleRow[]>(),
    // Every review, newest first: they are published when written, the administrator hides or deletes what should not stay
    Review.find(reviewScope(staff, own)).sort({ createdAt: -1 }).limit(100)
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
