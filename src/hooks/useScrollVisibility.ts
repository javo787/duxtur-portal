'use client';

import { useState, useEffect } from 'react';

export function useScrollVisibility(offset = 100, threshold = 10) {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const fn = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 12);

      if (currentY > lastY + threshold && currentY > offset) {
        setVisible(false);
      } else if (currentY < lastY - threshold) {
        setVisible(true);
      }
      lastY = currentY;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [offset, threshold]);

  return { visible, scrolled };
}
