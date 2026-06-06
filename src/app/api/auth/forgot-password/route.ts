import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    await dbConnect();
    const user = await User.findOne({ email });

    // Важно: отвечать одинаково независимо от того, найден email или нет (безопасность)
    // Но если OAuth пользователь — сообщить войти через Google
    if (user && !user.password && user.provider === 'google') {
      return NextResponse.json({
        error: 'Этот аккаунт создан через Google. Пожалуйста, используйте вход через Google.'
      }, { status: 400 });
    }

    if (!user || !user.password) {
      return NextResponse.json({ success: true }); // не раскрываем наличие email
    }

    // Генерируем токен сброса
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duxtur.org';
    // Для простоты используем /ru/ роут, так как сброс пароля технический процесс
    const resetUrl = `${baseUrl}/ru/reset-password?token=${token}`;

    // Отправить письмо через Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Duxtur.org <noreply@duxtur.org>',
      to: email,
      subject: 'Восстановление пароля — Duxtur.org',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <div style="background: linear-gradient(135deg, #0f2a52, #1a3a6e); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; font-size: 20px; margin: 0;">duxtur<span style="color: #60a5fa;">.org</span></h1>
          </div>
          <h2 style="color: #111; font-size: 18px;">Восстановление пароля</h2>
          <p style="color: #555; line-height: 1.6;">Нажмите кнопку ниже для сброса пароля. Ссылка действительна 1 час.</p>
          <a href="${resetUrl}" style="display: block; text-align: center; background: #2563eb; color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 24px 0;">
            Сбросить пароль
          </a>
          <p style="color: #999; font-size: 12px;">Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
