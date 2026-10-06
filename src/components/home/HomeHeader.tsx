'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { Locale, useT } from '@/i18n';
import { EDU_LINKS } from '@/lib/edu-routes';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

// Duxtur Edu is a separate app mounted at /edu (see next.config.ts). It is reached with a plain <a>, never next/link:
// Link would try to prefetch and client-navigate to a route this app does not own.
const link =
  'inline-flex min-h-10 items-center whitespace-nowrap rounded-lg px-3 text-[0.9375rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:text-foreground';
const mobileLink =
  'flex min-h-12 items-center rounded-lg px-3 text-base font-medium transition-colors hover:bg-muted aria-[current=page]:bg-muted';
const cta =
  'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

interface HomeHeaderProps {
  lang: Locale;
  eduLabel?: string;
  eduTeacherLabel?: string;
}

export default function HomeHeader({ lang, eduLabel: eduLabelProp, eduTeacherLabel: eduTeacherLabelProp }: HomeHeaderProps) {
  // '' is not "missing" for a default parameter, and an empty label renders an invisible link: fall back explicitly.
  const eduLabel = eduLabelProp || 'Студентам';
  const eduTeacherLabel = eduTeacherLabelProp || 'Преподавателям';
  const { t } = useT(lang);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  // Open for one page only: a different pathname closes it, with no effect needed
  const [openAt, setOpenAt] = useState<string | null>(null);
  const menuOpen = openAt !== null && openAt === pathname;
  const setMenuOpen = (open: boolean) => setOpenAt(open ? pathname : null);

  const role = (session?.user as ExtendedUser | undefined)?.role;
  const isDoctor = role === 'doctor' || role === 'portal_admin';

  // Escape closes the menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenAt(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const navLinks = [
    { href: `/${lang}/blog`, label: t('nav.articles') },
    { href: `/${lang}/doctors`, label: t('nav.findDoctor') },
    { href: `/${lang}/clinics`, label: t('clinic.title') },
    { href: `/${lang}/search`, label: t('common.search') },
  ];
  const current = (href: string) => (pathname === href || pathname?.startsWith(href + '/') ? 'page' : undefined);

  const auth = (mobile: boolean) => {
    // Not decided yet: keep the room free instead of guessing, so nothing jumps and a signed-in doctor never sees "Log in"
    if (status === 'loading') return <span aria-hidden="true" className={mobile ? 'block h-12' : 'block h-10 w-44'} />;
    if (session) {
      return isDoctor ? (
        <Link href={`/${lang}/admin`} className={mobile ? `${cta} h-12 w-full` : cta}>
          {t('nav.myOffice')}
        </Link>
      ) : (
        <>
          <span className="max-w-40 truncate text-sm text-muted-foreground">{session.user?.name || session.user?.email}</span>
          <button type="button" onClick={() => signOut()} className={mobile ? `${link} justify-center border border-border` : link}>
            {t('nav.logout')}
          </button>
        </>
      );
    }
    return (
      <>
        <Link href={`/${lang}/login`} className={mobile ? `${link} justify-center border border-border` : link}>
          {t('nav.login')}
        </Link>
        <Link href={`/${lang}/register`} className={mobile ? `${cta} h-12 w-full` : cta}>
          {t('nav.becomeAuthor')}
        </Link>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
        <Link href={`/${lang}`} className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <Image src="/logo.png" alt="" width={32} height={32} priority className="size-8 rounded-lg object-contain" />
          <span className="font-clinic text-lg font-semibold tracking-[-0.01em]">
            duxtur<span className="text-primary">.org</span>
          </span>
        </Link>

        {/* Full navigation only where it really fits (lg and up); below that it lives in the menu */}
        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)} className={link}>
              {l.label}
            </Link>
          ))}
          <a href={EDU_LINKS.students} className={link}>
            {eduLabel}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="ml-2 hidden items-center gap-1 lg:flex">{auth(false)}</div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={t('nav.menu')}
            className="inline-flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
          >
            {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Always in the markup, hidden by CSS while closed: not focusable then, and the links stay crawlable */}
      <div id="mobile-menu" className={menuOpen ? 'max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background lg:hidden' : 'hidden'}>
          <nav aria-label="Main" className="mx-auto max-w-6xl space-y-1 px-4 py-3 md:px-8">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} aria-current={current(l.href)} className={mobileLink}>
                {l.label}
              </Link>
            ))}
            <a href={EDU_LINKS.students} className={mobileLink}>
              {eduLabel}
            </a>
            <a href={EDU_LINKS.teachers} className={mobileLink}>
              {eduTeacherLabel}
            </a>
            <div className="flex flex-col gap-2 border-t border-border pt-4 pb-2">{auth(true)}</div>
          </nav>
      </div>
    </header>
  );
}
