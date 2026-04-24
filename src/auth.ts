import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;
        if (!email || !password) return null;

        await dbConnect();
        const user = await User.findOne({ email });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        // Врач должен быть одобрен
        if (user.role === 'doctor') {
          const doctorProfile = await Doctor.findOne({ userId: user._id });
          if (!doctorProfile || doctorProfile.status !== 'approved') {
            throw new Error('Ваш аккаунт ожидает подтверждения администратора.');
          }
        }

        return { id: user._id.toString(), email: user.email, role: user.role };
      },
    }),
  ],
});
