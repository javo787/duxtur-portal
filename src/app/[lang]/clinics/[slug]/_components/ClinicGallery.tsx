'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useT } from '@/i18n';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';

export default function ClinicGallery({ photos, lang, alt }: { photos: string[]; lang: string; alt: string }) {
  const { t } = useT(lang);
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const tiles = photos.slice(0, 7);
  const extra = photos.length - tiles.length;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const step = (dir: 1 | -1) => setOpen(i => (i === null ? i : (i + dir + photos.length) % photos.length));
  const iconBtn =
    'absolute flex size-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white';

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((photo, i) => (
          <button
            key={photo}
            type="button"
            onClick={() => setOpen(i)}
            className={`relative overflow-hidden rounded-lg bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
            }`}
          >
            <Image
              src={getOptimizedCloudinaryUrl(photo, { width: i === 0 ? 800 : 400, height: i === 0 ? 800 : 400, crop: 'fill' })}
              alt={`${alt} ${i + 1}`}
              fill
              sizes={i === 0 ? '(min-width: 1024px) 400px, 100vw' : '(min-width: 1024px) 200px, 50vw'}
              className="object-cover"
            />
            {extra > 0 && i === tiles.length - 1 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-semibold text-white">
                +{extra}
              </span>
            )}
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        onClick={e => e.target === dialog.current && setOpen(null)}
        className="m-auto max-h-[92vh] max-w-[96vw] bg-transparent p-0 backdrop:bg-black/85"
      >
        {open !== null && (
          <div className="relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOptimizedCloudinaryUrl(photos[open], { width: 1600 })}
              alt={`${alt} ${open + 1}`}
              className="max-h-[88vh] max-w-[96vw] rounded-lg object-contain"
            />
            <button type="button" onClick={() => setOpen(null)} aria-label={t('common.close')} className={`${iconBtn} right-2 top-2`}>
              <X className="size-5" aria-hidden="true" />
            </button>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label={t('common.prev')} className={`${iconBtn} left-2 top-1/2 -translate-y-1/2`}>
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => step(1)} aria-label={t('common.next')} className={`${iconBtn} right-2 top-1/2 -translate-y-1/2`}>
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
