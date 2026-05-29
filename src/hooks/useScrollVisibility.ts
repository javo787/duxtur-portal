'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Hook to track scroll visibility for smart sticky elements.
 * @param offset Scroll distance after which the element can hide.
 * @param threshold Minimum scroll delta to trigger visibility change.
 */
export function useScrollVisibility(offset = 100, threshold = 10) {
  const [state, setState] = useState({ visible: true, scrolled: false });
  const lastYRef = useRef(0);

  useEffect(() => {
    // Initialization
    lastYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrolled = currentY > 12;
      let isVisible = state.visible;

      // Smart sticky logic: hide on scroll down, show on scroll up
      if (currentY > lastYRef.current + threshold && currentY > offset) {
        isVisible = false;
      } else if (currentY < lastYRef.current - threshold) {
        isVisible = true;
      }

      // Batch updates if values changed
      if (isVisible !== state.visible || isScrolled !== state.scrolled) {
        setState({ visible: isVisible, scrolled: isScrolled });
      }

      lastYRef.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset, threshold, state.visible, state.scrolled]);

  return state;
}
