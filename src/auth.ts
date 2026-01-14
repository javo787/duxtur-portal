import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (credentials.id && credentials.password === 'dummy') {
           // Обход для обновления сессии (не для реального входа)
           return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) return null;

        await dbConnect();
        
        // 1. Ищем пользователя
        const user = await User.findOne({ email });
        if (!user) return null;

        // 2. Проверяем пароль
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        // 3. ГЛАВНАЯ ПРОВЕРКА: Если это врач, проверим статус "Approved"
        if (user.role === 'doctor') {
          const doctorProfile = await Doctor.findOne({ userId: user._id });
          
          // Если профиля нет или статус не 'approved' — не пускаем
          if (!doctorProfile || doctorProfile.status !== 'approved') {
            throw new Error("Ваш аккаунт ожидает подтверждения администратора.");
          }
        }

        // Если все ок, возвращаем пользователя (NextAuth создаст сессию)
        return user;
      },
    }),
  ],
});
