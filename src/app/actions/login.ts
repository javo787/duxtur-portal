'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirect: false, // Мы сами обработаем редирект на клиенте
    });
    return 'success';
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Неверный Email или пароль.';
        default:
          return 'Ошибка входа. Возможно, аккаунт еще не одобрен.';
      }
    }
    // Если ошибка выброшена нами вручную (про статус approved)
    if (error instanceof Error && error.message.includes("подтверждения")) {
       return error.message;
    }
    throw error;
  }
}
