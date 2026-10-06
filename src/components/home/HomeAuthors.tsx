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

export default function HomeAuthors({ lang, authors }: { lang: string; authors: Author[] }) {
  const t = getT(lang);
  if (authors.length === 0) return null;

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeader title={t('home.authorsTitle')} href={`/${lang}/authors`} linkLabel={t('nav.allAuthors')} />

        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {authors.map((doc, i) => (
            <li key={doc._id} data-reveal="" style={{ '--i': Math.min(i, 5) } as React.CSSProperties}>
              <Link
                href={`/${lang}/doctor/${doc.slug || doc._id}`}
                className="group flex flex-col items-center gap-3 rounded-lg text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-clinic text-xl font-semibold text-muted-foreground transition-[transform,border-color] duration-300 ease-premium group-hover:scale-105 group-hover:border-foreground/30">
                  {doc.image ? (
                    <Image src={getOptimizedCloudinaryUrl(doc.image, { width: 160, height: 160, crop: 'fill' })} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    initials(doc.name)
                  )}
                </span>
                <span>
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
