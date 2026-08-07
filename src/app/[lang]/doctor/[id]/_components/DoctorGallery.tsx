'use client';
import { useState } from 'react';
import Image from 'next/image';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';

export default function DoctorGallery({ photos }: { photos: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setOpenIndex(i)}
            className="relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-zoom-in"
          >
            <Image
              src={getOptimizedCloudinaryUrl(photo, { width: 400, height: 400, crop: 'fill' })}
              alt={`Фото ${i + 1}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl"
            onClick={() => setOpenIndex(null)}
          >
            ✕
          </button>
          {openIndex > 0 && (
            <button
              className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl"
              onClick={(e) => { e.stopPropagation(); setOpenIndex(openIndex - 1); }}
            >
              ‹
            </button>
          )}
          {openIndex < photos.length - 1 && (
            <button
              className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl"
              onClick={(e) => { e.stopPropagation(); setOpenIndex(openIndex + 1); }}
            >
              ›
            </button>
          )}
          <div className="relative w-full max-w-3xl aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image
              src={getOptimizedCloudinaryUrl(photos[openIndex], { width: 1200, height: 1200, crop: 'fit' })}
              alt={`Фото ${openIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
