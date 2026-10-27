'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SignOutButton({ lang, label = 'Выйти' }: { lang: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `/${lang}/login` })}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
