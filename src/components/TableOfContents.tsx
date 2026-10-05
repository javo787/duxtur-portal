'use client';

import { useEffect, useState } from 'react';

interface Section {
  id: string;
  title: string;
}

/**
 * Sticky "in this article" list. Plain anchor links, so it works without JavaScript;
 * the script only marks the section currently being read.
 */
export default function TableOfContents({ sections, label }: { sections: Section[]; label: string }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        const first = sections.find(s => seen.has(s.id));
        if (first) setActiveId(first.id);
      },
      { rootMargin: '-10% 0px -70% 0px' },
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav aria-label={label}>
      <p className="mb-3 text-sm font-semibold">{label}</p>
      <ol className="border-l border-border">
        {sections.map(s => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={activeId === s.id ? 'location' : undefined}
              className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-snug ${
                activeId === s.id
                  ? 'border-primary font-semibold text-foreground'
                  : 'border-transparent text-foreground/65 hover:text-foreground'
              }`}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
