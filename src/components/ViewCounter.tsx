'use client';

import { useEffect } from 'react';

interface ViewCounterProps {
  slug: string;
}

export default function ViewCounter({ slug }: ViewCounterProps) {
  useEffect(() => {
    const incrementView = async () => {
      try {
        await fetch(`/api/articles/${slug}/view`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to increment view:', error);
      }
    };

    incrementView();
  }, [slug]);

  return null;
}
