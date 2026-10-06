import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client"; // новый файл с MongoClient

import { authConfig } from "@/auth.config";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import bcrypt from "bcryptjs";
import { authorizeTelegramLogin } from "@/lib/portal-telegram-signin";
import { EduSignInFailure, authorizeEduSignIn } from "@/lib/portal-edu-signin";

/** A failed sign-in the person can act on: the code travels to the browser (signIn(...) returns it as `code`). */
function failedSignIn(code: string): CredentialsSignin {
  const error = new CredentialsSignin();
  error.code = code;
  return error;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise), // ← ГЛАВНОЕ ИСПРАВЛЕНИЕ
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "Duxtur.org <noreply@duxtur.org>",
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
        if (user.role === "doctor") {
          const doctorProfile = await Doctor.findOne({ userId: user._id });
          if (!doctorProfile || doctorProfile.status !== "approved") {
            throw new Error("Ваш аккаунт ожидает подтверждения администратора.");
          }
        }
        return { id: user._id.toString(), email: user.email, role: user.role };
      },
    }),

    // "Sign in with Telegram": the browser has the login approved in the bot (see /api/telegram-login/*) and
    // hands over the one-time token and poll secret. Nothing about the person comes from the browser.
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: { token: {}, pollSecret: {} },
      async authorize(credentials, request) {
        const ip = (request?.headers?.get("x-forwarded-for") || "anonymous").split(",")[0].trim();
        return authorizeTelegramLogin(credentials, ip);
      },
    }),

    // "Continue as ..." for a person who is signed in to Duxtur Edu in this browser: the page hands over the Firebase
    // ID token of that session, which is verified here (see portal-edu-signin.ts). Nothing else from the browser counts.
    Credentials({
      id: "edu",
      name: "Duxtur Edu",
      credentials: { idToken: {} },
      async authorize(credentials, request) {
        const ip = (request?.headers?.get("x-forwarded-for") || "anonymous").split(",")[0].trim();
        try {
          return await authorizeEduSignIn(credentials, ip);
        } catch (error) {
          throw failedSignIn(error instanceof EduSignInFailure ? error.code : "server");
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    // The role in the session is set when the person signs in. When something changes it while they are signed in
    // (the team approves a doctor, so a patient account becomes a doctor account), the page asks the session to
    // update and the role is read again from the database: nothing the browser sends is used.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.trigger === "update" && token.sub) {
        await dbConnect();
        const current = await User.findById(token.sub).select("role").lean<{ role?: string } | null>();
        if (current?.role) token.role = current.role;
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "resend") {
        await dbConnect();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            email: user.email,
            password: "",
            role: "patient",
            name: user.name || "",
            image: user.image || "",
          });
        }
      }
      return true;
    },
  },
});
