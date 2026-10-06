import Link from 'next/link';

/** Section title with an optional "see all" link. Same rhythm on every block of the home page. */
export default function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div data-reveal="" className="mb-8 flex items-end justify-between gap-4">
      <h2 className="font-clinic text-[1.75rem] leading-tight font-semibold tracking-[-0.01em] text-balance md:text-[2rem]">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="group shrink-0 pb-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
          {linkLabel} <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-premium group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </div>
  );
}
