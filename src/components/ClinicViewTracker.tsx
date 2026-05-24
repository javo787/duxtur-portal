'use client';

import { useEffect } from 'react';

export default function ClinicViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;

    // Fire and forget
    fetch(`/api/clinic/${slug}/view`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  return null;
}
