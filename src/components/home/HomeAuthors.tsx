import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import { initials } from '@/app/[lang]/clinics/[slug]/_components/shared';
import SectionHeader from './SectionHeader';

type Ml = Record<string, string> | null | undefined;
type Author = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  specialty?: Ml;
};

/** Doctors as cards, not floating avatars: with one or two people the block still looks finished. */
export default function HomeAuthors({ lang, authors }: { lang: string; authors: Author[] }) {
  const t = getT(lang);
  if (authors.length === 0) return null;

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeader title={t('home.authorsTitle')} href={`/${lang}/authors`} linkLabel={t('nav.allAuthors')} />

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((doc, i) => (
            <li key={doc._id} data-reveal="" style={{ '--i': Math.min(i, 5) } as CSSProperties}>
              <Link
                href={`/${lang}/doctor/${doc.slug || doc._id}`}
                className="group flex items-center gap-4 rounded-[10px] border border-border bg-card p-4 transition-colors duration-200 ease-premium hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-clinic text-lg font-semibold text-muted-foreground">
                  {doc.image ? (
                    <Image src={getOptimizedCloudinaryUrl(doc.image, { width: 112, height: 112, crop: 'fill' })} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    initials(doc.name)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] leading-snug font-semibold group-hover:underline underline-offset-4">{doc.name}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{doc.specialty?.[lang] || doc.specialty?.ru}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
