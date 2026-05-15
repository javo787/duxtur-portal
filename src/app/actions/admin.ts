'use server';

import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Article from '@/models/Article';
import User from '@/models/User';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

async function sendDoctorStatusEmail(
  doctorId: string,
  status: 'approved' | 'rejected',
  lang: string = 'ru'
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email notification.');
    return;
  }
  const resend = new Resend(apiKey);

  await dbConnect();
  const doctor = await Doctor.findById(doctorId).lean() as { name?: string; slug?: string; _id: any; userId: any };
  if (!doctor) return;

  const user = await User.findById(doctor.userId).lean() as { email?: string };
  if (!user?.email) return;

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

      <p style="color: #374151; line-height: 1.7;">Уважаемый(ая) <strong>${doctor.name}</strong>,</p>
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

  const rejectedHtml = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="background: linear-gradient(135deg, #0f2a52, #1a3a6e); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 28px;">
        <h1 style="color: white; font-size: 22px; margin: 0;">duxtur<span style="color: #60a5fa;">.org</span></h1>
      </div>

      <h2 style="color: #374151;">Уважаемый(ая) ${doctor.name},</h2>
      <p style="color: #6b7280; line-height: 1.7;">К сожалению, ваша заявка не прошла верификацию. Возможные причины:</p>

      <ul style="color: #6b7280; line-height: 2; padding-left: 20px;">
        <li>Фото диплома нечёткое или неразборчивое</li>
        <li>Документ не является медицинским дипломом/лицензией</li>
        <li>Информация в заявке не соответствует документу</li>
      </ul>

      <p style="color: #6b7280; line-height: 1.7;">Вы можете подать новую заявку с корректными документами:</p>

      <a href="${baseUrl}/${lang}/register" style="display: block; text-align: center; background: #2563eb; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">
        Подать заявку повторно
      </a>

      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Вопросы? Telegram: <a href="https://t.me/duxturcom" style="color: #2563eb;">@duxturcom</a></p>
    </div>
  `;

  await resend.emails.send({
    from: 'Duxtur.org <noreply@duxtur.org>',
    to: user.email,
    subject: subjects[status as keyof typeof subjects],
    html: status === 'approved' ? approvedHtml : rejectedHtml,
  });
}

export async function updateDoctorStatus(id: string, status: string) {
  await dbConnect();
  await Doctor.findByIdAndUpdate(id, { status });

  // Отправить email при одобрении или отклонении
  if (status === 'approved' || status === 'rejected') {
    await sendDoctorStatusEmail(id, status).catch(err =>
      console.error('Email send error:', err)
    );
  }

  revalidatePath('/admin/portal');
}

export async function deleteDoctor(id: string) {
  await dbConnect();
  const doctor = await Doctor.findById(id);
  if (!doctor) return;
  // Удаляем все статьи врача
  await Article.deleteMany({ authorId: id });
  // Удаляем User аккаунт
  await User.findByIdAndDelete(doctor.userId);
  // Удаляем профиль врача
  await Doctor.findByIdAndDelete(id);
  revalidatePath('/admin/portal');
}

export async function deleteArticle(id: string) {
  await dbConnect();
  await Article.findByIdAndDelete(id);
  revalidatePath('/admin/portal');
}

export async function toggleDoctorBan(id: string, banned: boolean) {
  await dbConnect();
  const status = banned ? 'banned' : 'approved';
  await Doctor.findByIdAndUpdate(id, { status });

  // Отправить email при восстановлении из бана (опционально, но здесь при одобрении)
  if (!banned) {
    await sendDoctorStatusEmail(id, 'approved').catch(err =>
      console.error('Email send error:', err)
    );
  }

  revalidatePath('/admin/portal');
}

export async function approveArticle(articleId: string) {
  await dbConnect();
  await Article.findByIdAndUpdate(articleId, { isVerified: true });
  revalidatePath('/admin/portal');
}
