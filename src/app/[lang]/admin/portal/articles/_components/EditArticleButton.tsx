'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { ArticleEditModal } from '@/app/[lang]/admin/_components/ArticleEditModal';

/** Opens the same editor the doctors use for their articles; the super admin may open any article. */
export function EditArticleButton({ slug, lang }: { slug: string; lang: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-gray-200 ring-1 ring-inset ring-white/10 transition-[transform,background-color] duration-150 ease-premium hover:bg-white/[0.09] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden /> Править
      </button>
      {open && (
        <ArticleEditModal
          slug={slug}
          lang={lang}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}
