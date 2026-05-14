import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: 'Duxtur.org <noreply@duxtur.org>',
    }),

    Credentials({
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;
        if (!email || !password) return null;
        await dbConnect();
        const user = await User.findOne({ email });
        if (!user || !user.password) return null;
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;
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

  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Для OAuth — создаём patient-аккаунт автоматически
      if (account?.provider === 'google' || account?.provider === 'resend') {
        await dbConnect();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            email: user.email,
            password: '',
            role: 'patient',
            name: user.name || '',
            image: user.image || '',
          });
        }
      }
      return true;
    },
  },
});
