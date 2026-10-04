'use client';

import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { btnPrimary, btnQuiet, WhatsAppIcon } from './shared';

const waIconOnly =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

interface Props {
  phone?: string;
  whatsappHref?: string | null;
  hasBooking: boolean;
  labels: { book: string; call: string };
}

/**
 * Mobile-only bar that keeps the main action in reach. It appears once the panel's own buttons
 * have scrolled off the top, and steps aside again at the end of the page so it never covers the footer.
 */
export default function ClinicDock({ phone, whatsappHref, hasBooking, labels }: Props) {
  const [pastActions, setPastActions] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const actions = document.getElementById('clinic-actions');
    const end = document.getElementById('clinic-end');
    const ios: IntersectionObserver[] = [];
    if (actions) {
      const io = new IntersectionObserver(([e]) => setPastActions(!e.isIntersecting && e.boundingClientRect.top < 0));
      io.observe(actions);
      ios.push(io);
    }
    if (end) {
      const io = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting));
      io.observe(end);
      ios.push(io);
    }
    return () => ios.forEach(io => io.disconnect());
  }, []);

  if (!hasBooking && !phone && !whatsappHref) return null;
  const visible = pastActions && !atEnd;
  const callIsPrimary = !hasBooking;

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {phone && (
        <a href={`tel:${phone}`} className={`${callIsPrimary ? btnPrimary : btnQuiet} flex-1`}>
          <Phone className="size-4" aria-hidden="true" />
          {labels.call}
        </a>
      )}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className={phone ? waIconOnly : `${btnQuiet} flex-1`}
        >
          <WhatsAppIcon className="size-5 shrink-0 text-[#25D366]" />
          {!phone && 'WhatsApp'}
        </a>
      )}
      {hasBooking && (
        <a href="#doctors" className={`${btnPrimary} flex-[1.4]`}>
          {labels.book}
        </a>
      )}
    </div>
  );
}
