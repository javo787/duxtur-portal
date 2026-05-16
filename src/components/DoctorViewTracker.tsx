'use client';

import { useEffect } from 'react';

export default function DoctorViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;

    // Fire and forget
    fetch(`/api/doctor/${slug}/view`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  return null;
}
