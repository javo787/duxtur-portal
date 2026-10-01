'use client';

/**
 * TEMP diagnostic component — added alongside the video-intro fix.
 *
 * CSP violations (like the missing media-src that broke video-intro
 * playback) fail silently in the browser: no thrown JS error, nothing
 * reaches Sentry on its own. This surfaces any future CSP block the same
 * way, so the next one doesn't take a code-archaeology session to find.
 *
 * Safe to remove any time — delete this file and its one usage in
 * src/app/[lang]/layout.tsx.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function CspViolationLogger() {
  useEffect(() => {
    const handler = (e: SecurityPolicyViolationEvent) => {
      console.warn('[csp]', e.violatedDirective, '→ blocked:', e.blockedURI);
      Sentry.captureMessage('CSP violation', {
        level: 'warning',
        extra: {
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
          documentURI: e.documentURI,
        },
      });
    };
    document.addEventListener('securitypolicyviolation', handler);
    return () => document.removeEventListener('securitypolicyviolation', handler);
  }, []);

  return null;
}
