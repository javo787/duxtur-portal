'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n';
import BookingModal from '@/components/BookingModal';
import { getOptimizedCloudinaryUrl } from '@/lib/utils';
import { initials } from './shared';

interface Doctor {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  specialty?: string | Record<string, string>;
  experience?: number;
  reviewAvg?: number;
  reviewCount?: number;
  schedule?: unknown;
  consultationTypes?: string[];
}

export default function ClinicDoctors({ doctors, lang }: { doctors: Doctor[]; lang: string }) {
  const { t } = useT(lang);
  const [selected, setSelected] = useState<Doctor | null>(null);

  return (
    <>
      <ul className="divide-y divide-border border-t border-border">
        {doctors.map(doc => {
          const specialty = typeof doc.specialty === 'object' ? doc.specialty?.[lang] || doc.specialty?.ru : doc.specialty;
          const href = `/${lang}/doctor/${doc.slug || doc._id}`;
          return (
            <li key={doc._id} className="flex items-center gap-4 py-4">
              <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
                <span className="relative flex size-14 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-foreground/60">
                  {doc.image ? (
                    <Image
                      src={getOptimizedCloudinaryUrl(doc.image, { width: 200, height: 200, crop: 'fill' })}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    initials(doc.name)
                  )}
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={href} className="font-semibold hover:underline">
                  {doc.name}
                </Link>
                {specialty && <p className="text-sm text-foreground/70">{specialty}</p>}
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-foreground/65">
                  {!!doc.experience && (
                    <span>
                      {doc.experience} {t('common.yearsExp')}
                    </span>
                  )}
                  {!!doc.reviewCount && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                      <span className="font-medium tabular-nums text-foreground">{(doc.reviewAvg ?? 0).toFixed(1)}</span>
                      <span>({doc.reviewCount})</span>
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(doc)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {t('booking.book')}
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {selected && (
          <BookingModal
            doctorId={selected._id}
            doctorName={selected.name}
            doctorSchedule={selected.schedule}
            doctorConsultationTypes={selected.consultationTypes || ['in_person']}
            lang={lang}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
