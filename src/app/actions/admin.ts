'use server';

import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { requireRole } from '@/lib/authGuards';
import { afterDoctorApproved } from '@/lib/author-approval';
import { realEmail } from '@/lib/placeholder-email';
import { reviewChanged } from '@/lib/review-service';
import {
  escapeHtml, isObjectId, parseDoctorDecision, reasonFromForm,
} from '@/lib/admin-moderation';
import { recordAudit } from '@/lib/audit-log';
import { trashArticle, trashClinic, trashDoctor, trashReview, type TrashResult } from '@/lib/admin-trash';

async function sendClinicStatusEmail(
  clinicId: string,
  status: 'approved' | 'rejected',
  lang: string = 'ru',
  reason: string = ''
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email notification.');
    return;
  }
  const resend = new Resend(apiKey);

  await dbConnect();
  const clinic = await Clinic.findById(clinicId).lean() as { name?: { ru?: string }; slug?: string; _id: unknown; userId: unknown };
  if (!clinic) return;

  const user = await User.findById(clinic.userId).lean() as { email?: string };
  if (!user?.email) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur.org';
  const cabinetUrl = `${baseUrl}/${lang}/clinic/admin`;

  const subjects = {
    approved: '✅ Ваша клиника одобрена — Duxtur.org',
    rejected: '❌ Заявка не прошла проверку — Duxtur.org',
  };

  const approvedHtml = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #0f2a52, #1a3a6e); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 28px;">
        <h1 style="color: white; font-size: 22px; margin: 0;">duxtur<span style="color: #60a5fa;">.org</span></h1>
        <p style="color: #93c5fd; margin: 8px 0 0;">Медицинский портал Центральной Азии</p>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h2 style="color: #166534; margin: 0 0 8px;">Клиника одобрена!</h2>
        <p style="color: #15803d; margin: 0;">Теперь ваша клиника доступна на портале Duxtur.org</p>
      </div>

      <p style="color: #374151; line-height: 1.7;">Здравствуйте,</p>
      <p style="color: #374151; line-height: 1.7;">Ваша заявка на регистрацию клиники <strong>${escapeHtml(clinic.name?.ru)}</strong> одобрена. Вы можете войти в панель управления для настройки профиля и добавления врачей.</p>

      <div style="margin: 28px 0;">
        <a href="${cabinetUrl}" style="display: block; text-align: center; background: #2563eb; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold;">
          Перейти в панель управления →
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Вопросы? Telegram: <a href="https://t.me/duxturcom" style="color: #2563eb;">@duxturcom</a></p>
    </div>
  `;

  const reasonBlock = reason
    ? `<div style="background: #f3f4f6; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
        <p style="color: #374151; font-weight: bold; margin: 0 0 6px; font-size: 14px;">Причина:</p>
        <p style="color: #374151; margin: 0; line-height: 1.6; white-space: pre-line;">${escapeHtml(reason)}</p>
      </div>`
    : '';

  const rejectedHtml = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #0f2a52, #1a3a6e); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 28px;">
        <h1 style="color: white; font-size: 22px; margin: 0;">duxtur<span style="color: #60a5fa;">.org</span></h1>
      </div>

      <h2 style="color: #374151;">Здравствуйте,</h2>
      <p style="color: #6b7280; line-height: 1.7;">К сожалению, ваша заявка на регистрацию клиники не прошла верификацию.</p>
      ${reasonBlock}

      <p style="color: #6b7280; line-height: 1.7;">Вы можете связаться с поддержкой для уточнения причин:</p>

      <a href="https://t.me/duxturcom" style="display: block; text-align: center; background: #2563eb; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">
        Связаться в Telegram
      </a>

      <p style="color: #9ca3af; font-size: 12px; text-align: center;">© Duxtur.org</p>
    </div>
  `;

  await resend.emails.send({
    from: 'Duxtur.org <noreply@duxtur.org>',
    to: user.email,
    subject: subjects[status as keyof typeof subjects],
    html: status === 'approved' ? approvedHtml : rejectedHtml,
  });
}

async function sendDoctorStatusEmail(
  doctorId: string,
  status: 'approved' | 'rejected',
  lang: string = 'ru',
  reason: string = ''
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email notification.');
    return;
  }
  const resend = new Resend(apiKey);

  await dbConnect();
  const doctor = await Doctor.findById(doctorId).lean() as { name?: string; slug?: string; _id: unknown; userId: unknown };
  if (!doctor) return;

  const user = await User.findById(doctor.userId).lean() as { email?: string };
  // A person who signed in with Telegram has no real address; they are told in the bot instead.
  const recipient = realEmail(user?.email);
  if (!recipient) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur.org';
  const profileUrl = `${baseUrl}/${lang}/doctor/${doctor.slug || doctor._id}`;
  const cabinetUrl = `${baseUrl}/${lang}/admin`;

  const subjects = {
    approved: '✅ Ваша заявка одобрена — Duxtur.org',
    rejected: '❌ Заявка не прошла проверку — Duxtur.org',
  };

  const approvedHtml = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #0f2a52, #1a3a6e); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 28px;">
        <h1 style="color: white; font-size: 22px; margin: 0;">duxtur<span style="color: #60a5fa;">.org</span></h1>
        <p style="color: #93c5fd; margin: 8px 0 0;">Медицинский портал Центральной Азии</p>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h2 style="color: #166534; margin: 0 0 8px;">Заявка одобрена!</h2>
        <p style="color: #15803d; margin: 0;">Добро пожаловать в команду верифицированных врачей Duxtur.org</p>
      </div>

      <p style="color: #374151; line-height: 1.7;">Уважаемый(ая) <strong>${escapeHtml(doctor.name)}</strong>,</p>
      <p style="color: #374151; line-height: 1.7;">Ваш диплом проверен и заявка одобрена. Теперь вы можете публиковать статьи и ваш профиль виден пациентам.</p>

      <div style="margin: 28px 0;">
        <a href="${cabinetUrl}" style="display: block; text-align: center; background: #2563eb; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-bottom: 12px;">
          Перейти в кабинет →
        </a>
        <a href="${profileUrl}" style="display: block; text-align: center; background: #f3f4f6; color: #374151; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold;">
          Мой публичный профиль
        </a>
      </div>

      <div style="background: #eff6ff; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #1e40af; font-weight: bold; margin: 0 0 8px; font-size: 14px;">Что делать дальше:</p>
        <ul style="color: #3b82f6; margin: 0; padding-left: 16px; font-size: 13px; line-height: 1.8;">
          <li>Войдите в личный кабинет</li>
          <li>Заполните профиль — специализацию, биографию, фото</li>
          <li>Напишите первую статью с помощью AI-помощника</li>
        </ul>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Вопросы? Telegram: <a href="https://t.me/duxturcom" style="color: #2563eb;">@duxturcom</a></p>
    </div>
  `;

  const reasonBlock = reason
    ? `<div style="background: #f3f4f6; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
        <p style="color: #374151; font-weight: bold; margin: 0 0 6px; font-size: 14px;">Причина:</p>
        <p style="color: #374151; margin: 0; line-height: 1.6; white-space: pre-line;">${escapeHtml(reason)}</p>
      </div>`
    : '';

  const rejectedHtml = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #0f2a52, #1a3a6e); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 28px;">
        <h1 style="color: white; font-size: 22px; margin: 0;">duxtur<span style="color: #60a5fa;">.org</span></h1>
      </div>

      <h2 style="color: #374151;">Уважаемый(ая) ${escapeHtml(doctor.name)},</h2>
      <p style="color: #6b7280; line-height: 1.7;">К сожалению, ваша заявка не прошла верификацию.${reason ? '' : ' Возможные причины:'}</p>

      ${reason ? reasonBlock : `<ul style="color: #6b7280; line-height: 2; padding-left: 20px;">
        <li>Фото диплома нечёткое или неразборчивое</li>
        <li>Документ не является медицинским дипломом/лицензией</li>
        <li>Информация в заявке не соответствует документу</li>
      </ul>`}

      <p style="color: #6b7280; line-height: 1.7;">Вы можете подать новую заявку с корректными документами:</p>

      <a href="${baseUrl}/${lang}/register" style="display: block; text-align: center; background: #2563eb; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">
        Подать заявку повторно
      </a>

      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Вопросы? Telegram: <a href="https://t.me/duxturcom" style="color: #2563eb;">@duxturcom</a></p>
    </div>
  `;

  await resend.emails.send({
    from: 'Duxtur.org <noreply@duxtur.org>',
    to: recipient,
    subject: subjects[status as keyof typeof subjects],
    html: status === 'approved' ? approvedHtml : rejectedHtml,
  });
}

// ─── Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// Every action checks the role first (Server Actions are public POST endpoints), validates what arrives, records the
// change in the audit log and returns `{ error }` instead of throwing, so the button can show what went wrong.
// Deleting never destroys data at once: see src/lib/admin-trash.ts.

export type AdminActionResult = void | { error: string };

const BAD_ID = { error: 'Некорректный идентификатор' } as const;

function revalidateAdmin() {
  for (const path of ['', '/doctors', '/clinics', '/trash', '/audit']) {
    revalidatePath(`/[lang]/admin/portal${path}`, 'page');
  }
}

function revalidatePublic(...areas: Array<'doctors' | 'clinics' | 'blog'>) {
  const paths: Record<string, string[]> = {
    doctors: ['/[lang]/doctors', '/[lang]/doctor/[slug]'],
    clinics: ['/[lang]/clinics', '/[lang]/clinics/[slug]'],
    blog: ['/[lang]/blog', '/[lang]/blog/[slug]'],
  };
  for (const area of areas) for (const path of paths[area]) revalidatePath(path, 'page');
}

/** The article lists of the public site and of the portal, after an article went live, was hidden or was removed. */
function revalidateArticles() {
  revalidateAdmin();
  revalidatePath('/[lang]/admin/portal/articles', 'page');
  revalidatePublic('blog');
}

const done = (result: TrashResult): AdminActionResult => (result.ok ? undefined : { error: result.error });

/**
 * Approves or rejects a doctor's application. `input` is the submitted form when called from a button with a
 * reason field (reject): the reason goes into the e-mail and the audit log.
 */
export async function updateDoctorStatus(id: string, status: string, input?: unknown): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  const decision = parseDoctorDecision(status);
  if (!decision) return { error: 'Недопустимый статус заявки' };
  if (!isObjectId(id)) return BAD_ID;

  await dbConnect();
  const reason = decision === 'rejected' ? reasonFromForm(input) : '';
  const doctor = await Doctor.findByIdAndUpdate(id, { status: decision }, { projection: 'name' }).lean<{ name?: string } | null>();
  if (!doctor) return { error: 'Врач не найден' };

  // Отправить email при одобрении или отклонении
  await sendDoctorStatusEmail(id, decision, 'ru', reason).catch(err => console.error('Email send error:', err));

  // Одобренный автор: открывается кабинет врача, ждавшие проверки статьи выходят
  if (decision === 'approved') {
    await afterDoctorApproved(id).catch(err => console.error('After-approval error:', err));
  }

  await recordAudit({
    actor: admin, action: decision === 'approved' ? 'doctor.approved' : 'doctor.rejected',
    entityType: 'doctor', entityId: id, entityLabel: doctor.name, meta: reason ? { reason } : undefined,
  });
  revalidateAdmin();
  revalidatePublic('doctors');
}

export async function approveClinic(id: string): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(id)) return BAD_ID;
  await dbConnect();
  const clinic = await Clinic.findByIdAndUpdate(id, { status: 'approved' }, { projection: 'name' }).lean<{ name?: { ru?: string } } | null>();
  if (!clinic) return { error: 'Клиника не найдена' };
  await sendClinicStatusEmail(id, 'approved').catch(err => console.error('Email send error:', err));
  await recordAudit({ actor: admin, action: 'clinic.approved', entityType: 'clinic', entityId: id, entityLabel: clinic.name?.ru });
  revalidateAdmin();
  revalidatePublic('clinics');
}

/** `input` is the submitted form with an optional `reason`. */
export async function rejectClinic(id: string, input?: unknown): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(id)) return BAD_ID;
  await dbConnect();
  const reason = reasonFromForm(input);
  const clinic = await Clinic.findByIdAndUpdate(id, { status: 'rejected' }, { projection: 'name' }).lean<{ name?: { ru?: string } } | null>();
  if (!clinic) return { error: 'Клиника не найдена' };
  await sendClinicStatusEmail(id, 'rejected', 'ru', reason).catch(err => console.error('Email send error:', err));
  await recordAudit({
    actor: admin, action: 'clinic.rejected', entityType: 'clinic', entityId: id,
    entityLabel: clinic.name?.ru, meta: reason ? { reason } : undefined,
  });
  revalidateAdmin();
  revalidatePublic('clinics');
}

export async function banClinic(id: string, banned: boolean): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(id) || typeof banned !== 'boolean') return BAD_ID;
  await dbConnect();
  const clinic = await Clinic.findByIdAndUpdate(id, { status: banned ? 'banned' : 'approved' }, { projection: 'name' }).lean<{ name?: { ru?: string } } | null>();
  if (!clinic) return { error: 'Клиника не найдена' };
  await recordAudit({
    actor: admin, action: banned ? 'clinic.banned' : 'clinic.unbanned',
    entityType: 'clinic', entityId: id, entityLabel: clinic.name?.ru,
  });
  revalidateAdmin();
  revalidatePublic('clinics');
}

export async function deleteClinic(id: string): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  const result = await trashClinic(id, admin);
  if (result.ok) { revalidateAdmin(); revalidatePublic('clinics', 'doctors'); }
  return done(result);
}

export async function deleteDoctor(id: string): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  const result = await trashDoctor(id, admin);
  if (result.ok) { revalidateAdmin(); revalidatePublic('doctors', 'clinics', 'blog'); }
  return done(result);
}

export async function deleteArticle(id: string): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  const result = await trashArticle(id, admin);
  if (result.ok) revalidateArticles();
  return done(result);
}

export async function toggleDoctorBan(id: string, banned: boolean): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(id) || typeof banned !== 'boolean') return BAD_ID;
  await dbConnect();
  const doctor = await Doctor.findByIdAndUpdate(id, { status: banned ? 'banned' : 'approved' }, { projection: 'name' }).lean<{ name?: string } | null>();
  if (!doctor) return { error: 'Врач не найден' };

  // Отправить email при восстановлении из бана (опционально, но здесь при одобрении)
  if (!banned) {
    await sendDoctorStatusEmail(id, 'approved').catch(err => console.error('Email send error:', err));
    await afterDoctorApproved(id).catch(err => console.error('After-approval error:', err));
  }

  await recordAudit({
    actor: admin, action: banned ? 'doctor.banned' : 'doctor.unbanned',
    entityType: 'doctor', entityId: id, entityLabel: doctor.name,
  });
  revalidateAdmin();
  revalidatePublic('doctors');
}

export async function approveArticle(articleId: string): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(articleId)) return BAD_ID;
  await dbConnect();
  const article = await Article.findByIdAndUpdate(articleId, { isVerified: true }, { projection: 'title slug' })
    .lean<{ title?: { ru?: string; uz?: string; tg?: string }; slug?: string } | null>();
  if (!article) return { error: 'Статья не найдена' };
  await recordAudit({
    actor: admin, action: 'article.approved', entityType: 'article', entityId: articleId,
    entityLabel: article.title?.ru || article.title?.uz || article.title?.tg || article.slug,
  });
  revalidateArticles();
}

/** Takes a published article off the site without deleting it: it goes back to the moderation queue. */
export async function unpublishArticle(articleId: string): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(articleId)) return BAD_ID;
  await dbConnect();
  const article = await Article.findByIdAndUpdate(articleId, { isVerified: false }, { projection: 'title slug' })
    .lean<{ title?: { ru?: string; uz?: string; tg?: string }; slug?: string } | null>();
  if (!article) return { error: 'Статья не найдена' };
  await recordAudit({
    actor: admin, action: 'article.unpublished', entityType: 'article', entityId: articleId,
    entityLabel: article.title?.ru || article.title?.uz || article.title?.tg || article.slug,
  });
  revalidateArticles();
}

// ─── Reviews ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// Reviews are published when they are written. The administrator can hide one (it stays in the list, with its author,
// and can be shown again) or delete it (it goes to the trash). Every change refreshes the numbers of the doctor and the clinic.

async function setReviewShown(reviewId: string, shown: boolean): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  if (!isObjectId(reviewId)) return BAD_ID;
  await dbConnect();
  const Review = (await import('@/models/Review')).default;
  const review = await Review.findById(reviewId);
  if (!review) return { error: 'Отзыв не найден' };
  if (review.isVerified === shown) return;

  await Review.findByIdAndUpdate(reviewId, { isVerified: shown });
  await reviewChanged(review);
  await recordAudit({
    actor: admin, action: shown ? 'review.shown' : 'review.hidden', entityType: 'review',
    entityId: reviewId, entityLabel: String(review.text ?? '').slice(0, 80),
  });
  revalidateAdmin();
}

/** Show a review again (or publish an old one that was waiting for approval). */
export async function approveReview(reviewId: string): Promise<AdminActionResult> {
  return setReviewShown(reviewId, true);
}

export async function hideReview(reviewId: string): Promise<AdminActionResult> {
  return setReviewShown(reviewId, false);
}

export async function deleteReview(reviewId: string): Promise<AdminActionResult> {
  const admin = await requireRole('portal_admin');
  const result = await trashReview(reviewId, admin);
  if (result.ok) revalidateAdmin();
  return done(result);
}
