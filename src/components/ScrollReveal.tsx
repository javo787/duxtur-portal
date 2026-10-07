'use client';

import { useEffect } from 'react';

/**
 * Lets blocks marked data-reveal="" fade and rise in when they scroll into view. Mount it once per page.
 *
 * The server HTML is the final, visible state, so visitors without JavaScript, crawlers and print see
 * everything. Only after hydration are blocks that are BELOW the fold hidden ("pending") and then revealed
 * ("shown"). Blocks in view or above the viewport when the script runs are never hidden, so there is no
 * flash, no disappearing content when the script arrives late on a slow connection, and the largest paint
 * (LCP) is not delayed. Only opacity and transform change, so nothing shifts (CLS 0).
 * With "reduce motion" on, or without IntersectionObserver, nothing is touched.
 */
export default function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    const viewport = window.innerHeight;
    const pending: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
      // On screen, or already scrolled past (slow JavaScript can arrive late): nothing to reveal, never hide it
      if (el.getBoundingClientRect().top < viewport * 0.92) {
        el.removeAttribute('data-reveal');
        return;
      }
      el.dataset.reveal = 'pending';
      pending.push(el);
    });

    const timers: number[] = [];
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          el.dataset.reveal = 'shown';
          // Afterwards the element is a normal one again: hover transforms and delays must not inherit the reveal
          timers.push(window.setTimeout(() => el.removeAttribute('data-reveal'), 1500));
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    pending.forEach(el => io.observe(el));

    return () => {
      io.disconnect();
      timers.forEach(window.clearTimeout);
      // If the effect re-runs (React strict mode), whatever is still hidden is shown again by the next run
      pending.forEach(el => {
        if (el.dataset.reveal === 'pending') el.dataset.reveal = '';
      });
    };
  }, []);

  return null;
}
