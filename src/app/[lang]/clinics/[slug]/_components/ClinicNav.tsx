'use client';

import { useEffect, useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
}

/** Jump links for the sections that exist, with the current one underlined while scrolling. */
export default function ClinicNav({ items, label }: { items: NavItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    if (!reduce) root.style.scrollBehavior = 'smooth';

    const seen = new Set<string>();
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        const first = items.find(i => seen.has(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: '-72px 0px -60% 0px' },
    );
    items.forEach(i => {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    });

    return () => {
      io.disconnect();
      root.style.scrollBehavior = prev;
    };
  }, [items]);

  return (
    <nav
      aria-label={label}
      className="scrollbar-hide sticky top-0 z-20 -mx-4 flex gap-6 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur md:-mx-8 md:px-8 lg:mx-0 lg:px-0"
    >
      {items.map(i => (
        <a
          key={i.id}
          href={`#${i.id}`}
          aria-current={active === i.id ? 'true' : undefined}
          className={`-mb-px whitespace-nowrap border-b-2 py-3.5 text-[0.9375rem] font-medium ${
            active === i.id ? 'border-primary text-foreground' : 'border-transparent text-foreground/65 hover:text-foreground'
          }`}
        >
          {i.label}
        </a>
      ))}
    </nav>
  );
}
